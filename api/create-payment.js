export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ error: "Amount & orderId are required" });
    }

    // 🟢 Your AIK Digital Merchant Keys
    const MERCHANT_ID = process.env.AIK_MERCHANT_ID;
    const API_KEY = process.env.AIK_API_KEY;

    if (!MERCHANT_ID || !API_KEY) {
      return res.status(500).json({ error: "AIK credentials missing" });
    }

    // 🟢 CALL AIK PAY API TO CREATE PAYMENT
    const aikResponse = await fetch("https://aikpay.pk/api/payment/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": API_KEY
      },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        order_id: orderId,
        amount: amount,
        callback_url: "https://kahani47.com/aik-callback", // Change to your domain
      })
    });

    const data = await aikResponse.json();
    console.log("AIK Response:", data);

    // 🧨 AIK API error handling
    if (!aikResponse.ok || !data?.qr_text) {
      return res.status(500).json({
        error: "AIK Payment Error",
        details: data
      });
    }

    // 🟢 FRONTEND EXPECTS THIS KEY!
    return res.status(200).json({
      qrText: data.qr_text
    });

  } catch (error) {
    console.error("AIK BACKEND ERROR:", error);

    return res.status(500).json({
      error: "Server Error",
      details: error.message
    });
  }
}