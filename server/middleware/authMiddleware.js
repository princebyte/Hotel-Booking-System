import { getAuth } from "@clerk/express";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        const auth = getAuth(req);
        const userId = auth?.userId || req.auth?.userId;

        if (!userId) {
            console.log("Auth error - No userId found. req.auth:", req.auth);
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        let user = await User.findById(userId);

        // If user doesn't exist, it means webhook hasn't fired yet
        // Create user with minimal data and wait for webhook to update
        if (!user) {
            user = await User.create({
                _id: userId,
                email: "",
                username: "User",
                image: ""
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};