import stripe from "stripe";
import Booking from "../models/Booking.js";

// API to handle Stripe Webhooks
export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.log("Webhook Error:", error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle successful Stripe Checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const bookingId = session.metadata?.bookingId;

    console.log("Stripe Payment Successful");
    console.log("Booking ID:", bookingId);

    if (!bookingId) {
      console.log("Booking ID not found in Stripe metadata");
      return response.json({ received: true });
    }

    // Mark booking as paid
    await Booking.findByIdAndUpdate(bookingId, {
      isPaid: true,
      paymentMethod: "Stripe",
    });

    console.log("Booking marked as paid:", bookingId);
  } else {
    console.log("Unhandled event type:", event.type);
  }

  response.json({ received: true });
};