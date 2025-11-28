import axios from "axios";

export default async function handler(req, res) {
  // =============================
  // CORS HEADERS (for browser tests)
  // =============================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // =============================

  // Simple GET check in browser
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "AIK callback endpoint is live. Use POST for AIK webhook.",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { responseCode, responseMessage, traceId, body } = req.body || {};

    console.log("AIK callback received:", req.body);

    if (responseCode !== "00" || responseMessage !== "Paid") {
      console.log("Payment not completed, ignoring.");
      return res.status(200).json({ status: "ignored", reason: "not paid" });
    }

    const amountRaw = body?.Amount || body?.amount;
    if (!amountRaw) {
      console.error("No amount in AIK callback body:", body);
      return res.status(400).json({ error: "Missing amount in callback body" });
    }

    const amount = Number(amountRaw).toFixed(2); // "2500.00"

    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN; // e.g. kahani47.myshopify.com
    const apiVersion = process.env.SHOPIFY_API_VERSION || "2024-01";
    const shopifyUrl = https://${shopifyDomain}/admin/api/${apiVersion}/orders.json;

    const orderPayload = {
      order: {
        financial_status: "paid",
        note: AIK Digital Trace ID: ${traceId || ""},
        tags: "AIK Digital",
        line_items: [
          {
            title: "AIK Digital Payment",
            quantity: 1,
            price: amount,
          },
        ],
      },
    };

    await axios.post(shopifyUrl, orderPayload, {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN,
        "Content-Type": "application/json",
      },
    });

    console.log("Shopify order created successfully from AIK callback.");
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(
      "AIK callback error:",
      err.response?.data || err.message || err
    );
    return res.status(500).json({ error: "Callback failed" });
  }
}
