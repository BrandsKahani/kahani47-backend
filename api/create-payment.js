// api/create-payment.js

export default async function handler(req, res) {
  // -----------------------------
  // 1. CORS HEADERS
  // -----------------------------
  res.setHeader("Access-Control-Allow-Origin", "*"); // or "https://kahani47.com"
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight request from browser
    return res.status(200).end();
  }

  // -----------------------------
  // 2. METHOD CHECK
  // -----------------------------
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // -----------------------------
  // 3. READ BODY
  // -----------------------------
  try {
    const body = req.body || {};
    const amount = body.amount;
    const orderId = body.orderId;

    if (!amount || !orderId) {
      return res.status(400).json({
        error: "amount and orderId are required from frontend",
        receivedBody: body,
      });
    }

    // -----------------------------
    // 4. BUILD AIK PAYLOAD
    // -----------------------------
    const payload = {
      Amount: String(amount),
      OrderId: String(orderId),
      Call_back_URL: process.env.CALLBACK_URL,
    };

    // guard env vars so it doesn't silently crash
    if (!process.env.AIK_BASE_URL) {
      return res.status(500).json({
        error: "AIK_BASE_URL is not set in Vercel env",
      });
    }
    if (!process.env.CUSTOMER_MOBILE ||
        !process.env.AIK_API_KEY ||
        !process.env.AIK_SECRET) {
      return res.status(500).json({
        error: "One or more AIK credentials (CUSTOMER_MOBILE, AIK_API_KEY, AIK_SECRET) are missing in env",
      });
    }

    const url = process.env.AIK_BASE_URL.endsWith("/")
      ? process.env.AIK_BASE_URL + "QR/MerchantQR"
      : process.env.AIK_BASE_URL + "/QR/MerchantQR";

    console.log("Sending to AIK:", { url, payload });

    // -----------------------------
    // 5. CALL AIK DIGITAL API
    // -----------------------------
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

    const rawText = await aikResponse.text();
    console.log("AIK raw response:", rawText);

    if (!aikResponse.ok) {
      // AIK returned HTTP error
      return res.status(502).json({
        error: "AIK Digital request failed",
        status: aikResponse.status,
        body: rawText,
      });
    }

    // -----------------------------
    // 6. PARSE JSON SAFELY
    // -----------------------------
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("AIK JSON parse error:", parseError);
      return res.status(502).json({
        error: "Invalid JSON from AIK Digital",
        raw: rawText,
      });
    }

    // Just pass through AIK response to frontend
    return res.status(200).json(data);
  } catch (err) {
    console.error("create-payment unexpected error:", err);
    return res.status(500).json({ error: "Payment creation failed", details: String(err) });
  }
}
