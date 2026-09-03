import Hotel from "../models/Hotel.js";
import { v2 as cloudinary } from "cloudinary";
import Room from "../models/Room.js";

const fallbackRoomImages = [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
];

const uploadRoomImage = async (file, index) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return fallbackRoomImages[index % fallbackRoomImages.length];
        }

        const response = await cloudinary.uploader.upload(file.path, {
            folder: "hotel-booking/rooms"
        });

        return response.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed, using fallback image:", error.message);
        return fallbackRoomImages[index % fallbackRoomImages.length];
    }
};

// API to create a new room for a hotel
export const createRoom = async (req, res) => {
    try {
        const { roomType, pricePerNight, amenities } = req.body;

        if (!roomType || !pricePerNight || !amenities) {
            return res.status(400).json({
                success: false,
                message: "Please fill all room details"
            });
        }

        const hotel = await Hotel.findOne({
            owner: req.user._id
        });

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "No Hotel found"
            });
        }

        const files = Array.isArray(req.files) ? req.files : [];
        const images = files.length > 0
            ? await Promise.all(files.map(uploadRoomImage))
            : [fallbackRoomImages[0]];

        await Room.create({
            hotel: hotel._id,
            roomType,
            pricePerNight: +pricePerNight,
            amenities: JSON.parse(amenities),
            images
        });

        res.json({
            success: true,
            message: "Room created successfully"
        });

    } catch (error) {
        console.error("createRoom error:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
};


// API to get all rooms
export const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find()
            .populate({
                path: "hotel",
                populate: {
                    path: "owner",
                    select: "image"
                }
            })
            .sort({
                createdAt: -1
            });

        rooms.forEach((room, index) => {
            if (room.images.length > 1) {
                const offset = index % room.images.length;
                room.images = [
                    ...room.images.slice(offset),
                    ...room.images.slice(0, offset)
                ];
            }
        });

        res.json({
            success: true,
            rooms
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};


// API to get all rooms for a specific hotel
export const getOwnerRooms = async (req, res) => {
    try {
        const hotelData = await Hotel.findOne({ owner: req.user._id });

        if (!hotelData) {
            return res.status(404).json({
                success: false,
                message: "No Hotel found"
            });
        }

        const rooms = await Room.find({ hotel: hotelData._id })
            .populate("hotel")
            .sort({ createdAt: -1 })
            .limit(4);

        res.json({
            success: true,
            rooms
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
   
// API to toggle availability of a room
export const toggleRoomAvailability = async (req, res) => {
    try {
        const { roomId, isAvailable } = req.body;

        if (!roomId || typeof isAvailable !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Room availability must be true or false"
            });
        }

        const roomData = await Room.findById(roomId).populate("hotel");

        if (!roomData || !roomData.hotel || !roomData.hotel.owner || roomData.hotel.owner.toString() !== req.user._id.toString()) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        const updatedRoom = await Room.findOneAndUpdate(
            { _id: roomId },
            { $set: { isAvailable } },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: "Room availability updated",
            roomId: updatedRoom._id,
            isAvailable: updatedRoom.isAvailable
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};