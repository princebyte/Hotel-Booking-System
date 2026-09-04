import React, { useEffect, useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import roomImg1 from '../assets/roomImg1.png'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MyBooking = () => {


  const { axios, getToken, user} = useAppContext()
 const [bookings, setBookings] = useState([])

 const fetchUserBooking = async ()=>{
  try{
    const { data} = await axios.get('/api/bookings/user', {headers: {Authorization: `Bearer ${await getToken()}` }})
    if(data.success){
      setBookings(data.bookings || [])
    }else{
      toast.error(data.message)
    }

  }catch (error){
       toast.error(error.message)
  }
 }

 const handlePayment = async (bookingId)=>{
  try{
     const {data } = await axios.post('/api/bookings/stripe-payment', {bookingId}, {headers: {Authorization: `Bearer ${await getToken()}`}})
     if(data.success){
      window.location.href = data.url
     }else{
      toast.error(data.message)
     }
  }catch(error){
      toast.error(error.message)
  }
 }
 useEffect(()=>{
  if(user){
    fetchUserBooking()
  }
 },[user, getToken])

  return (
    <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>

      <Title
        title='My Bookings'
        subTitle='Easily manage your past, current, and upcoming hotel reservations in one place. Plan your trips seamlessly with just a few clicks'
        align='left'
      />

      <div className='max-w-6xl mt-8 w-full text-gray-800'>

        {/* Table Header */}
        <div className='hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3'>
          <div>Hotels</div>
          <div>Date & Timing</div>
          <div>Status</div>
        </div>

        {/* Bookings */}
        {bookings.map((booking) => (

          <div
            key={booking._id}
            className='grid grid-cols-1 md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 py-6 first:border-t'
          >

            {/* Hotel Details */}
            <div className='flex flex-col md:flex-row'>

              <img
                  src={booking.room?.images?.[0] || roomImg1}
                alt='hotel-img'
                className='w-full md:w-44 h-32 rounded shadow object-cover'
              />

              <div className='flex flex-col gap-1.5 max-md:mt-3 md:ml-4'>

                {/* Hotel Name */}
                <p className='font-playfair text-2xl'>
                    {booking.hotel?.name || 'Hotel details unavailable'}
                  <span className='font-inter text-sm'>
                      {booking.room?.roomType && ` (${booking.room.roomType})`}
                  </span>
                </p>

                {/* Address */}
                <div className='flex items-center gap-1 text-sm text-gray-500'>
                  <img
                    src={assets.locationIcon}
                    alt='location-icon'
                  />
                    <span>{booking.hotel?.address || 'Address unavailable'}</span>
                </div>

                {/* Guests */}
                <div className='flex items-center gap-1 text-sm text-gray-500'>
                  <img
                    src={assets.guestsIcon}
                    alt='guests-icon'
                  />
                  <span>Guests: {booking.guests}</span>
                </div>

                {/* Total */}
                <p className='text-base'>
                  Total: ${booking.totalPrice}
                </p>

              </div>
            </div>

            {/* Date & Timing */}
            <div className='flex flex-row items-center gap-10 md:gap-14'>

              {/* Check In */}
              <div>
                <p className='font-medium'>
                  Check-In:
                </p>

                <p className='text-gray-500 text-sm'>
                  {new Date(booking.checkInDate).toDateString()}
                </p>
              </div>

              {/* Check Out */}
              <div>
                <p className='font-medium'>
                  Check-Out:
                </p>

                <p className='text-gray-500 text-sm'>
                  {new Date(booking.checkOutDate).toDateString()}
                </p>
              </div>

            </div>

            {/* Booking and Payment Status */}
            <div className='flex flex-col items-start justify-center pt-3'>

              <p className={`text-sm font-medium capitalize ${
                booking.status === 'cancelled'
                  ? 'text-red-500'
                  : booking.status === 'confirmed'
                    ? 'text-green-500'
                    : 'text-orange-500'
              }`}>
                Booking: {booking.status || 'pending'}
              </p>

              <div className='flex items-center gap-2 mt-2'>

                {/* Status Dot */}
                <div
                  className={`h-3 w-3 rounded-full ${
                    booking.isPaid ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>

                {/* Status Text */}
                <p
                  className={`text-sm font-medium ${
                    booking.isPaid ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {booking.isPaid ? 'Paid' : 'Unpaid'}
                </p>

              </div>
              {!booking.isPaid && (
                <button onClick = {()=>handlePayment(booking._id)} className = 'px-4 py-1.5 mt-4 text-xs border border-gray-400 rounded-full hover:bg-gray-50 transition-all cursor-pointer'>
                  Pay Now
                  </button>
              )}

            </div>

          </div>

        ))}

      </div>
    </div>
  )
}

export default MyBooking