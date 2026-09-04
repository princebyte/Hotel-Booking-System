import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
    checkAvailabilityAPI,
    createBooking,
    getUserBooking,
    getHotelBookings,
    stripePayment
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.post(
    "/clerk-availability",
    checkAvailabilityAPI
);

bookingRouter.post(
    "/book",
    protect,
    createBooking
);

bookingRouter.get(
    "/user",
    protect,
    getUserBooking
);

bookingRouter.get(
    "/hotel",
    protect,
    getHotelBookings
);

bookingRouter.post('/stripe-payment', protect, stripePayment)

export default bookingRouter;