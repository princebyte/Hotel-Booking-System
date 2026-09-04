import express from "express";
import "dotenv/config";
import cors from "cors";

import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controllers/clerkWebhooks.js";

import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";

import { stripeWebhooks } from "./controllers/stripeWebhooks.js";
import connectCloudinary from "./configs/cloudinary.js";


// Connect Database
connectDB();

// Connect Cloudinary
connectCloudinary();

const app = express();


// ===============================
// CORS
// ===============================
app.use(
    cors({
        origin: (origin, callback) => {

            // Allow requests without origin
            // Example: Postman, server-to-server
            if (!origin) {
                return callback(null, true);
            }

            // Allow localhost frontend
            if (origin === "http://localhost:5174") {
                return callback(null, true);
            }

            // Allow Vercel frontend
            if (origin.endsWith(".vercel.app")) {
                return callback(null, true);
            }

            // Block other origins
            return callback(new Error("Not allowed by CORS"));
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "x-requested-with"
        ],
    })
);


// ===============================
// Stripe Webhook
// ===============================
app.post(
    "/api/stripe",
    express.raw({
        type: "application/json"
    }),
    stripeWebhooks
);


// ===============================
// Middleware
// ===============================
app.use(express.json());

app.use(clerkMiddleware());


// ===============================
// Clerk Webhook
// ===============================
app.use("/api/clerk", clerkWebhooks);


// ===============================
// Test API
// ===============================
app.get("/", (req, res) => {
    res.send("API is working");
});


// ===============================
// Routes
// ===============================
app.use("/api/user", userRouter);

app.use("/api/hotel", hotelRouter);

app.use("/api/rooms", roomRouter);

app.use("/api/bookings", bookingRouter);


// ===============================
// Server
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});