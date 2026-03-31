import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Stripe from "stripe";
import dotenv from "dotenv";
import { adminDb as db, adminAuth, admin } from "./src/lib/firebase-admin.ts";
import { sendEmail } from "./src/lib/email.server.ts";
import { 
  getAdminNewApplicationEmail, 
  getApplicantApprovalEmail, 
  getApplicantRejectionEmail 
} from "./src/lib/emailTemplates.ts";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = 3000;

export async function startServer() {
  // Webhook needs raw body
  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (metadata && metadata.bookingId) {
        try {
          const bookingRef = db.collection("bookings").doc(metadata.bookingId);
          await bookingRef.update({
            bookingStatus: "confirmed",
            paymentStatus: "paid",
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Create payment record
          await db.collection("payments").add({
            bookingId: metadata.bookingId,
            userId: metadata.buyerId,
            amount: parseFloat(metadata.amount),
            status: "succeeded",
            stripeId: session.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Notify trainer of new confirmed booking
          await db.collection("notifications").add({
            userId: metadata.trainerId,
            title: "New Booking Confirmed!",
            message: `You have a new booking from ${metadata.buyerName || 'an athlete'}.`,
            type: "success",
            link: "/dashboard",
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`Booking ${metadata.bookingId} confirmed.`);
        } catch (error) {
          console.error("Error updating booking after payment:", error);
        }
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper to check admin status
  const checkAdmin = async (uid: string) => {
    if (!uid) return false;
    try {
      // 1. Check Firestore role and email (Resilient to Auth API failures)
      const userDoc = await db.collection("users").doc(uid).get();
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check for bootstrap admin email or explicit admin role
        if (userData?.email === "nasa16nasa17@gmail.com" || userData?.role === "admin") {
          return true;
        }
      } else {
        // If user doc doesn't exist, try Auth as a last resort
        try {
          const authUser = await adminAuth.getUser(uid);
          if (authUser.email === "nasa16nasa17@gmail.com" && authUser.emailVerified) {
            return true;
          }
        } catch (e) {
          console.warn("Auth check failed and no user document found for uid:", uid);
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  app.get("/api/admin/test-db", async (req, res) => {
    try {
      const results: any = {
        env: {
          FIREBASE_CONFIG: process.env.FIREBASE_CONFIG ? "Set" : "Not Set",
          GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? "Set" : "Not Set"
        }
      };

      // Test the new Wrapper
      try {
        const testDoc = await db.collection("health_check").doc("wrapper_test").get();
        results.wrapperRead = { success: true, exists: testDoc.exists() };
        
        await db.collection("health_check").doc("wrapper_test").set({
          lastCheck: new Date().toISOString(),
          status: "ok"
        });
        results.wrapperWrite = { success: true };
      } catch (err: any) {
        results.wrapperError = { error: err.message, code: err.code };
      }

      res.json(results);
    } catch (error: any) {
      console.error("Database test failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Trainer Application Route
  app.post("/api/trainers/apply", async (req, res) => {
    console.log("POST /api/trainers/apply - Request received");
    try {
      const { userId, trainerData, userEmail, userName } = req.body;
      console.log("Applying for userId:", userId);

      if (!userId) {
        console.error("Missing userId in request body");
        return res.status(400).json({ error: "Missing userId" });
      }

      // 1. Save trainer application
      console.log("Saving trainer application to Firestore...");
      try {
        await db.collection("trainers").doc(userId).set({
          ...trainerData,
          userId,
          status: "pending",
          isApproved: false,
          createdAt: db.firestore.FieldValue.serverTimestamp(),
        });
        console.log("Trainer application saved successfully.");
      } catch (err: any) {
        console.error("Firestore error saving trainer application:", err);
        throw new Error(`Firestore error (trainers): ${err.message}`);
      }

      // 2. Fetch platform settings
      console.log("Fetching platform settings...");
      let emailEnabled = true;
      try {
        const settingsDoc = await db.collection("platform_settings").doc("global").get();
        const settings = settingsDoc.data();
        emailEnabled = settings?.notifications?.emailNewTrainerApplication ?? true;
        console.log("Email notifications enabled:", emailEnabled);
      } catch (err: any) {
        console.warn("Error fetching platform settings (non-fatal):", err);
      }

      // 3. Notify admins (in-app)
      console.log("Fetching admins for notification...");
      let adminsSnap: any = { docs: [] };
      try {
        adminsSnap = await db.collection("users").where("role", "==", "admin").get();
        console.log(`Found ${adminsSnap.size} admins.`);
        
        const adminNotifications = adminsSnap.docs.map(async (adminDoc: any) => {
          await db.collection("notifications").add({
            userId: adminDoc.id,
            title: "New Trainer Application",
            message: `${userName || userEmail} has applied to be a coach.`,
            type: "info",
            link: "/dashboard/approvals",
            read: false,
            createdAt: db.firestore.FieldValue.serverTimestamp(),
          });
        });
        await Promise.all(adminNotifications);
        console.log("In-app notifications sent to admins.");
      } catch (err: any) {
        console.warn("Error notifying admins (non-fatal):", err);
      }

      // 4. Send Email to Admin
      if (emailEnabled) {
        console.log("Preparing to send email to admins...");
        const { subject, html } = getAdminNewApplicationEmail(userName || "New Trainer", userEmail, process.env.APP_URL || "");
        const adminEmails = adminsSnap.docs.map(d => d.data().email).filter(Boolean);
        
        if (adminEmails.length > 0) {
          console.log(`Sending email to: ${adminEmails.join(", ")}`);
          const emailResult = await sendEmail({
            to: adminEmails,
            subject,
            html,
            templateName: "admin-new-application",
          });
          console.log("Email send result:", emailResult);
        } else {
          console.log("No admin emails found to send notification to.");
        }
      }

      console.log("Trainer application process completed successfully.");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Application error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Trainer Approval Route
  app.post("/api/trainers/approve", async (req, res) => {
    try {
      const { trainerId, adminId } = req.body;

      if (!(await checkAdmin(adminId))) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 1. Update trainer and user status
      await db.collection("trainers").doc(trainerId).update({
        isApproved: true,
        status: "active",
        memberSince: db.firestore.FieldValue.serverTimestamp(),
        updatedAt: db.firestore.FieldValue.serverTimestamp(),
      });
      await db.collection("users").doc(trainerId).update({
        role: "trainer",
        updatedAt: db.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Fetch user data for email
      const userDoc = await db.collection("users").doc(trainerId).get();
      const userData = userDoc.data();

      // 3. Send in-app notification
      await db.collection("notifications").add({
        userId: trainerId,
        title: "Application Approved!",
        message: "Congratulations! Your coach application has been approved. You can now set up your availability and start accepting clients.",
        type: "success",
        link: "/dashboard",
        read: false,
        createdAt: db.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Send Email to Trainer
      if (userData?.email) {
        const { subject, html } = getApplicantApprovalEmail(userData.displayName || "Coach", process.env.APP_URL || "");
        await sendEmail({
          to: userData.email,
          subject,
          html,
          templateName: "applicant-approval",
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Approval error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Trainer Rejection Route
  app.post("/api/trainers/reject", async (req, res) => {
    try {
      const { trainerId, adminId } = req.body;

      if (!(await checkAdmin(adminId))) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 1. Update trainer status
      await db.collection("trainers").doc(trainerId).update({
        isApproved: false,
        status: "rejected",
        updatedAt: db.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Fetch user data for email
      const userDoc = await db.collection("users").doc(trainerId).get();
      const userData = userDoc.data();

      // 3. Send in-app notification
      await db.collection("notifications").add({
        userId: trainerId,
        title: "Application Update",
        message: "Thank you for your interest. Unfortunately, your coach application was not approved at this time. You can contact support for more details.",
        type: "info",
        link: "/dashboard",
        read: false,
        createdAt: db.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Send Email to Trainer
      if (userData?.email) {
        const { subject, html } = getApplicantRejectionEmail(userData.displayName || "Coach");
        await sendEmail({
          to: userData.email,
          subject,
          html,
          templateName: "applicant-rejection",
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Rejection error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Refund Booking Route
  app.post("/api/refund-booking", async (req, res) => {
    try {
      const { bookingId, adminId } = req.body;

      if (!(await checkAdmin(adminId))) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const bookingDoc = await db.collection("bookings").doc(bookingId).get();
      if (!bookingDoc.exists) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const bookingData = bookingDoc.data();
      if (!bookingData?.stripePaymentIntentId) {
        return res.status(400).json({ error: "No payment intent found for this booking" });
      }

      // 1. Create Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: bookingData.stripePaymentIntentId,
      });

      // 2. Update booking status
      await db.collection("bookings").doc(bookingId).update({
        bookingStatus: "refunded",
        paymentStatus: "refunded",
        stripeRefundId: refund.id,
        updatedAt: db.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Notify buyer and trainer
      const notifications = [
        db.collection("notifications").add({
          userId: bookingData.buyerId,
          title: "Booking Refunded",
          message: `Your booking with ${bookingData.trainerName} has been refunded.`,
          type: "info",
          link: "/dashboard",
          read: false,
          createdAt: db.firestore.FieldValue.serverTimestamp(),
        }),
        db.collection("notifications").add({
          userId: bookingData.trainerId,
          title: "Booking Refunded",
          message: `The booking for ${bookingData.buyerName} has been refunded by an admin.`,
          type: "warning",
          link: "/dashboard",
          read: false,
          createdAt: db.firestore.FieldValue.serverTimestamp(),
        })
      ];
      await Promise.all(notifications);

      res.json({ success: true, refundId: refund.id });
    } catch (error: any) {
      console.error("Refund error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { 
        trainerId, 
        trainerName, 
        amount, 
        type, 
        date, 
        buyerId, 
        buyerName,
        trainerProfileId,
        startTime,
        endTime,
        duration,
        sessionType,
        meetingLink
      } = req.body;

      // 1. Create a pending booking in Firestore first
      const bookingRef = db.collection("bookings").doc();
      const bookingId = bookingRef.id;

      const commissionRate = 0.15; // 15% platform fee
      const payoutAmount = amount * (1 - commissionRate);

      await bookingRef.set({
        id: bookingId,
        trainerId,
        buyerId,
        trainerName,
        buyerName,
        trainerProfileId,
        type,
        sessionType,
        date,
        startTime,
        endTime,
        duration,
        meetingLink: meetingLink || "",
        price: amount,
        payoutAmount,
        bookingStatus: "pending",
        paymentStatus: "pending",
        createdAt: db.firestore.FieldValue.serverTimestamp(),
        updatedAt: db.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Create Stripe session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${sessionType} with ${trainerName}`,
                description: date ? `Scheduled for ${date} at ${startTime}` : 'Monthly coaching plan',
              },
              unit_amount: Math.round(amount * 100), // amount in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL}/dashboard?success=true&bookingId=${bookingId}`,
        cancel_url: `${process.env.APP_URL}/dashboard?cancel=true&bookingId=${bookingId}`,
        metadata: {
          bookingId,
          trainerId,
          buyerId,
          buyerName,
          type,
          amount: amount.toString(),
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Wallet API Routes
  app.get("/api/wallet/balance", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      
      const walletDoc = await db.collection("wallets").doc(userId as string).get();
      if (!walletDoc.exists) {
        return res.json({ balance: 0, currency: "USD" });
      }
      res.json(walletDoc.data());
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/wallet/transactions", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      
      const transactionsSnap = await db.collection("transactions")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
      
      const transactions = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/wallet/payout", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      if (!userId || !amount) return res.status(400).json({ error: "Missing userId or amount" });
      
      // 1. Check balance
      const walletDoc = await db.collection("wallets").doc(userId).get();
      const walletData = walletDoc.data();
      if (!walletData || walletData.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // 2. Create payout record
      const payoutRef = db.collection("payouts").doc();
      await payoutRef.set({
        userId,
        amount,
        status: "pending",
        createdAt: db.firestore.FieldValue.serverTimestamp(),
        updatedAt: db.firestore.FieldValue.serverTimestamp(),
      });
      
      // 3. Update wallet
      await db.collection("wallets").doc(userId).update({
        balance: walletData.balance - amount,
        updatedAt: db.firestore.FieldValue.serverTimestamp(),
      });
      
      // 4. Create transaction record
      await db.collection("transactions").add({
        userId,
        type: "payout",
        amount,
        status: "pending",
        createdAt: db.firestore.FieldValue.serverTimestamp(),
      });
      
      res.json({ success: true, payoutId: payoutRef.id });
    } catch (error: any) {
      console.error("Error processing payout:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}
