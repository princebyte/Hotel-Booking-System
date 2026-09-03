import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";

const rotateRoomImages = (room, index) => {
  if (!room?.images?.length || room.images.length < 2) return;

  const offset = index % room.images.length;
  room.images = [
    ...room.images.slice(offset),
    ...room.images.slice(0, offset)
  ];
};

// Function to Check Availability of Rooms
const checkAvailability = async ({checkInDate, checkOutDate, room})=>{
  try{
     const checkIn = new Date(checkInDate);
     const checkOut = new Date(checkOutDate);
     if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
       return false;
     }

     const bookings = await Booking.find({
      room,
      checkInDate: {$lte: checkOutDate},
      checkOutDate: {$gte: checkInDate},
     });

     const isAvailable = bookings.length === 0;
     return isAvailable;

  }catch(error){
     console.error(error.message);
  }
}

//API to check availability of room
//POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res)=>{
  try{
      const { room, checkInDate, checkOutDate} = req.body;
      const isAvailable = await checkAvailability({checkInDate, checkOutDate,  
        room});
        res.json({success: true, isAvailable})
  }catch(error){
    res.json({success: false, message: error.message })

  }
}

// API to create a new booking
//POST /api/booking/book

export const createBooking = async (req,res)=>{
  try{
  const { room, checkInDate, checkOutDate, guests, paymentMethod = "Pay At Hotel", email, username } = req.body;
  const userId = req.user._id;
     if (email && !req.user.email) {
       req.user.email = email;
       req.user.username = username || req.user.username;
       await req.user.save();
     }
     const checkIn = new Date(checkInDate);
     const checkOut = new Date(checkOutDate);
     if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn || !Number.isInteger(+guests) || +guests < 1) {
       return res.status(400).json({success: false, message: "Invalid booking details"});
     }
    //Before booking check Availability
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room
    })

    if(!isAvailable){
      return res.json({success: false, message: "Room is not Available"})
    }

    //Get totalPrice from room
    const roomData = await Room.findById(room).populate("hotel");
    if (!roomData || !roomData.hotel) {
      return res.status(404).json({success: false, message: "Room not found"});
    }
    let totalPrice = roomData.pricePerNight;

    //calculate totalPrice based on nights
    const timeDiff = checkOut.getTime() -checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 *24));

    totalPrice *= nights;
    const booking =await Booking.create({
      user: userId,
      room,
      hotel:roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
      paymentMethod,
    })
    
    const recipientEmail = req.user.email || email;
    if (recipientEmail && process.env.SENDER_EMAIL && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const mailOption = {
        from: process.env.SENDER_EMAIL,
        to: recipientEmail,
        subject: 'Hotel Booking Details',
        html: `
           <h2>Your Booking Details</h2>
           <p>Dear ${req.user.username},</p>
           <p>Thank you for your booking Here are your detailes:</p>
           <ul>
            <li><strong>Booking ID:</strong> ${booking._id}</li>
            <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
            <li><strong>Location:</strong> ${roomData.hotel.address}</li>
            <li><strong>Date:</strong> ${booking.checkInDate.toDateString()}</li>
            <li><strong>Booking Amount:</strong>${process.env.CURRENCY || '$'} ${booking.totalPrice}/night</li>
            


           </ul>
           <p>We Look forward to welcoming you!</p>
           <p>if you need to make any changes, feel free to contact us.</p>
          `
      };

      try {
        await transporter.sendMail(mailOption);
      } catch (mailError) {
        console.error("Booking email failed:", mailError.message);
      }
    }

    res.status(201).json({success: true, message: "Booking created Successfully"})


  }catch(error){
    console.log(error);
    res.json ({success: false, message: "Failed to create"})
  }
};

//API to get all booking all booking for a user
//GET /api/booking /user
export const getUserBooking  = async (req, res)=>{
  try{
    const user = req.user._id;
    const bookings = await Booking.find({user}).populate("room hotel").sort({createdAt: -1})
    bookings.forEach((booking, index) => rotateRoomImages(booking.room, index));
    res.json({success: true, bookings})
  }catch(error){
    res.json({success: false, message: "Failed to fetch bookings"})

  }
}

export const getHotelBookings = async (req, res)=>{
  try {
      const hotel = await Hotel.findOne({owner: req.user._id});
  if(!hotel){
    return res.json({success: false, message: "No Hotel found"});
  }
  const bookings = await Booking.find({hotel: hotel._id}).populate("room hotel user").sort({createdAt: -1});
  bookings.forEach((booking, index) => rotateRoomImages(booking.room, index));
  // Total Booking
  const totalBookings = bookings.length;
  //total revenue
  const totalRevenue = bookings.reduce((acc, booking)=> acc + booking.totalPrice,0)


  res.json({success: true, dashboardData: {totalBookings, totalRevenue, bookings}})
  }catch (error){
    res.json({success: false, message: "Failed to fetch booking" })
  }
}