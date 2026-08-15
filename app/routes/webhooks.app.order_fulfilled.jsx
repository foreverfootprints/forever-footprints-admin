import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  console.log(request.body);
  try {
    // Authenticate and verify the webhook
    const { shop, session, topic, body } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for shop: ${shop}`);
    console.log("Webhook Payload:", body);

    // Perform any custom logic here
    // For example: Save data to the database, send notifications, etc.

    // Return a 200 response to acknowledge the webhook
    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);

    // Return a 500 response for any error
    return new Response("Error processing webhook", { status: 500 });
  }
};
