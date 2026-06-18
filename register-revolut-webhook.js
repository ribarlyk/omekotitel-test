// Script to register webhook with Revolut Merchant API
const REVOLUT_API_SECRET_KEY = "sk__Bq4PllNZPqj0s39CqXBd8-6wBff4gaaWYkvzhu4OUqJjDW29NhN-yOvkjmOfmdb";
const WEBHOOK_URL = "https://omekotitel-test.vercel.app/api/checkout/revolut-webhook";
const REVOLUT_API_BASE = "https://sandbox-merchant.revolut.com/api";

async function registerWebhook() {
  try {
    const response = await fetch(`${REVOLUT_API_BASE}/1.0/webhooks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REVOLUT_API_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: [
          "ORDER_COMPLETED",
          "ORDER_PAYMENT_FAILED",
          "ORDER_PAYMENT_DECLINED"
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Failed to register webhook:");
      console.error(data);
      process.exit(1);
    }

    console.log("✅ Webhook registered successfully!");
    console.log("\nWebhook Details:");
    console.log(JSON.stringify(data, null, 2));
    console.log("\n⚠️  IMPORTANT: Copy the 'signing_secret' from above and add it to your Vercel environment variables:");
    console.log("   Variable name: REVOLUT_WEBHOOK_SIGNING_SECRET");
    
  } catch (error) {
    console.error("Error registering webhook:", error);
    process.exit(1);
  }
}

registerWebhook();
