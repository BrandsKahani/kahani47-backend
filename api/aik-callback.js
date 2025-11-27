import axios from "axios";

export default async function handler(req, res) {
  // Sirf POST allow karein
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body;

  console.log("AIK callback payload:", JSON.stringify(payload));

  const { responseCode, responseMessage, traceId, body } = payload;

  // Sirf Paid par order banayein
  if (responseCode !== "00" || responseMessage !== "Paid") {
    console.log("Payment not paid yet or failed:", responseCode, responseMessage);

    return res.status(200).json({
      received: true,
      status: "ignored_not_paid",
    });
  }

  // Amount nikaalna (structure AIK ke JSON par depend karega)
  const amount = body?.Amount || body?.amount || "0";

  try {
    // Shopify order object
    const orderData = {
      order: {
        financial_status: "paid",
        email: "customer@example.com", // TODO: yahan real customer email use karein
        note: `AIK Digital payment, traceId: ${traceId}`,
        line_items: [
          {
            title: "AIK Digital Payment",
            quantity: 1,
            price: amount,
          },
        ],
      },
    };

    const shopifyUrl = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}/orders.json`;

    const shopifyResponse = await axios.post(shopifyUrl, orderData, {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN,
        "Content-Type": "application/json",
      },
    });

    console.log("Shopify order created:", shopifyResponse.data);

    return res.status(200).json({
      received: true,
      status: "order_created",
      shopifyResponse: shopifyResponse.data,
    });
  } catch (error) {
    console.error(
      "Error creating Shopify order:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      received: true,
      status: "error_creating_order",
      error: error.response?.data || error.message,
    });
  }
}
