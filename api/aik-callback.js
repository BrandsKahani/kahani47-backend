// api/aik-callback.js
import axios from "axios";

export default async function handler(req, res) {
  // CORS (useful if you hit this from browser for testing)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Simple ping
  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", message: "AIK callback live" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { responseCode, responseMessage, traceId, body } = req.body || {};
    console.log("AIK callback body:", req.body);

    if (responseCode !== "00" || responseMessage !== "Paid") {
      return res.status(200).json({
        status: "ignored",
        reason: "Payment not marked as Paid by AIK",
      });
    }

    const amountRaw = body?.Amount || body?.amount;
    if (!amountRaw) {
      return res.status(400).json({ error: "Missing Amount in callback body" });
    }

    const amount = Number(amountRaw).toFixed(2);

    if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_TOKEN) {
      return res.status(500).json({
        error: "SHOPIFY_STORE_DOMAIN or SHOPIFY_TOKEN not set in env",
      });
    }

    const apiVersion = process.env.SHOPIFY_API_VERSION || "2024-01";
    const shopifyUrl = https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${apiVersion}/orders.json;

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

    console.log("Shopify order created from AIK callback.");
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("aik-callback error:", err.response?.data || err.message || err);
    return res.status(500).json({ error: "Callback failed" });
  }
}
