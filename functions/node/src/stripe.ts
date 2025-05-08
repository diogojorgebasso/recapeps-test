import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { error, info, debug } from "firebase-functions/logger";
import Stripe from "stripe";
import { FieldValue, getFirestore } from "firebase-admin/firestore"; // Import FieldValue
import * as admin from "firebase-admin"; // TODO : Remove this to auth library.

const db = getFirestore();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}
const stripe = new Stripe(stripeSecretKey);

export const stripewebhooktest = onRequest({
  serviceAccount: "stripe-webhook-test-run@recapeps-test.iam.gserviceaccount.com"
}, async (req, res) => {
  try {

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      webhookSecret
    );

    debug(`Received event: ${event.type}`);

    if (event.type === "invoice.payment_failed") {
      const customerId = event.data.object.customer;
      const userSnap = await db
        .collection('users')
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();

      if (userSnap.empty) {
        error(`Webhook: No user found for customer ${customerId}`);
        res.status(404).send('No user found');
      }
      const uid = userSnap.docs[0].id;
      const userRef = db.collection('users').doc(uid);

      // 1️⃣ Send FCM push & Handle Results
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      const tokens = userData?.fcmTokens;

      if (Array.isArray(tokens) && tokens.length > 0) {
        info(`Sending payment failed notification to ${tokens.length} tokens for user ${uid}.`);
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: 'Payment Failed',
            body: 'We couldn’t process your subscription payment. Please update your card info.',
          }
        });

        const tokensToRemove: string[] = [];
        response.responses.forEach((result, index) => {
          if (!result.success) {
            const errorCode = result.error?.code;
            // Check for errors indicating an invalid or unregistered token
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              const invalidToken = tokens[index];
              error(`Invalid token found for user ${uid}: ${invalidToken}. Scheduling removal.`);
              tokensToRemove.push(invalidToken);
            } else {
              error(`Failed to send to token for user ${uid}: ${tokens[index]}`, result.error);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          await userRef.update({
            fcmTokens: FieldValue.arrayRemove(...tokensToRemove)
          });
          info(`Removed ${tokensToRemove.length} invalid tokens for user ${uid}.`);
        }

      } else {
        info(`No valid FCM tokens found for user ${uid} to send payment failed notification.`);
      }

      // 2️⃣ Persist in-app notification
      await userRef.collection('notifications').add({
        type: 'payment_failed',
        title: 'Payment Failed',
        body: 'We couldn’t process your subscription payment. Please update your card info.',
        isRead: false,
        createdAt: FieldValue.serverTimestamp()
      });
      info(`In-app notification created for user ${uid}.`);
    }

    if (
      event.type === 'customer.subscription.deleted') {
      const customerId = event.data.object.customer;
      const userSnapshot = await db.collection("users").where("stripeCustomerId", "==", customerId).get();
      const userId = userSnapshot.docs[0].id;
      await admin.auth().setCustomUserClaims(userId, { pro: false });
    }

    if (event.type === "customer.subscription.updated") {

      const subscription = event.data.object as Stripe.Subscription;
      const isPro = subscription.status === "active";

      const subscriptionId = subscription.id;
      const stripeCustomerId = subscription.customer as string;

      debug(`Subscription ${subscriptionId} updated for user ${stripeCustomerId}`);

      const userSnapshot = await db.collection("users").where("stripeCustomerId", "==", stripeCustomerId).get();

      if (userSnapshot.empty) {
        error(`No user found for Stripe customer ID ${stripeCustomerId}`);
        res.status(404).send("User not found");
        return;
      }

      const userId = userSnapshot.docs[0].id;
      const subscriptionRef = db
        .collection("users")
        .doc(userId)
        .collection("subscriptions")
        .doc(subscriptionId);

      debug("Starting to update subscription.");

      await subscriptionRef.set(subscription, { merge: true });
      info(`Subscription ${subscriptionId} updated successfully`);

      await admin.auth().setCustomUserClaims(userId, { pro: isPro });

      res.status(200).send("Webhook received");
    } else {
      // Acknowledge unhandled event types
      res.status(200).send("Event type not handled");
    }

  } catch (err) {
    const e = err as Error;
    error("Webhook error:", e.message);
    if (!res.headersSent) {
      res.status(400).send(`Webhook Error: ${e.message}`);
    }
  }
});

export const createportalsession = onCall(
  {
    cors: "https://recapeps.fr",
    serviceAccount: "create-portal-session-run@recapeps-test.iam.gserviceaccount.com",
    enforceAppCheck: true
  },
  async (request) => {

    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    try {
      // Retrieve Stripe customer ID from Firestore
      const userDoc = await db.collection("users").doc(userId).get();
      const stripeCustomerId = userDoc.data()?.stripeCustomerId;

      if (!stripeCustomerId) {
        error(`Customer not found for user ${userId}`);
        throw new HttpsError("not-found", "Customer not found");
      }

      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: "https://recapeps.fr/profil",
      });
      info(`Portal session created: ${session.id} ${session.url}`);
      return { url: session.url };
    } catch (err) {
      const e = err as Error;
      error("Error creating portal session:", e);
      throw new HttpsError("internal", "Internal server error");
    }
  }
);

