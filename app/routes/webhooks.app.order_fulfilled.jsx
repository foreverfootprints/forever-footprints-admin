import axios from "axios";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    // Authenticate and verify the webhook
    const { shop, topic, payload } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for shop: ${shop}`);

    // Create the order over on forever-main — this is what actually
    // generates the QR code (uploaded to Blob storage) and sends the
    // customer their setup email. Previously this handler only logged the
    // webhook and did nothing else, so fulfilling an order never actually
    // produced anything for the customer.
    const data = {
      orderId: String(payload.id),
      status: "pending",
      redirectUrl: "",
      items: payload.line_items?.length ?? 0,
      email: payload.email ?? payload.customer?.email,
    };

    if (!data.email) {
      console.error("order_fulfilled webhook missing customer email, payload:", JSON.stringify(payload));
      return new Response("Webhook processed, but no customer email found", { status: 200 });
    }

    const response = await axios.post(
      "https://app.forever-footprints.com/api/order/",
      data
    );
    console.log(`Order created on forever-main for order ${data.orderId}:`, response.data);

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing order_fulfilled webhook:", error.response?.data || error.message);

    // Still return 200 — Shopify retries on non-2xx, and retrying won't fix
    // a downstream error on our end, it'll just spam the same failure.
    return new Response("Error processing webhook", { status: 200 });
  }
};
