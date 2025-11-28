// api/create-payment.js

export default async function handler(req, res) {
  // =============================
  // CORS HEADERS
  // =============================
  res.setHeader("Access-Control-Allow-Origin", "*"); // or "https://kahani47.com"
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request from browser
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // =============================

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const amount = body.amount;
    const orderId = body.orderId;

    if (!amount || !orderId) {
      return res.status(400).json({ error: "amount and orderId are required" });
    }

    const payload = {
      Amount: String(amount),
      OrderId: String(orderId),
      Call_back_URL: process.env.CALLBACK_URL,
    };

    const url = process.env.AIK_BASE_URL + "QR/MerchantQR";

    const aikResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        CustomerMobile: process.env.CUSTOMER_MOBILE,
        API_KEY: process.env.AIK_API_KEY,
        SECRET: process.env.AIK_SECRET,
      },
      body: JSON.stringify(payload),
    });

    const text = await aikResponse.text();

    if (!aikResponse.ok) {
      console.error("AIK Digital error:", aikResponse.status, text);
      return res.status(502).json({
        error: "AIK Digital request failed",
        status: aikResponse.status,
        body: text,
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("AIK JSON parse error:", parseError, text);
      return res.status(502).json({
        error: "Invalid JSON from AIK Digital",
        raw: text,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("create-payment error:", err);
    return res.status(500).json({ error: "Payment creation failed" });
  }
}
