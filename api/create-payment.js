export default async function handler(req, res) {
  // =============================
  // CORS HEADERS (IMPORTANT)
  // =============================
  res.setHeader("Access-Control-Allow-Origin", "*"); // or "https://kahani47.com"
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Browser preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // =============================

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, orderId } = req.body || {};

    if (!amount || !orderId) {
      return res.status(400).json({ error: "amount and orderId are required" });
    }

    const payload = {
      Amount: amount.toString(),
      OrderId: String(orderId),
      Call_back_URL: process.env.CALLBACK_URL, // must match your aik-callback URL
    };

    const aikResponse = await fetch(
      ${process.env.AIK_BASE_URL}QR/MerchantQR,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          CustomerMobile: process.env.CUSTOMER_MOBILE,
          API_KEY: process.env.AIK_API_KEY,
          SECRET: process.env.AIK_SECRET,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!aikResponse.ok) {
      const text = await aikResponse.text();
      console.error("AIK Digital error:", aikResponse.status, text);
      return res.status(502).json({
        error: "AIK Digital request failed",
        status: aikResponse.status,
        body: text,
      });
    }

    const data = await aikResponse.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("create-payment error:", err);
    return res.status(500).json({ error: "Payment creation failed" });
  }
}
