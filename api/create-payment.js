// api/create-payment.js

export default async function handler(req, res) {
  // Sirf POST allow karein
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { amount, orderId } = req.body || {};

    // Basic validation
    if (amount == null || orderId == null) {
      return res
        .status(400)
        .json({ error: "amount & orderId are required" });
    }

    // 🔐 AIK Pay credentials from environment
    const MERCHANT_ID = process.env.AIK_MERCHANT_ID;
    const API_KEY = process.env.AIK_API_KEY;
    const CALLBACK_URL = process.env.CALLBACK_URL;

    if (!MERCHANT_ID || !API_KEY || !CALLBACK_URL) {
      return res.status(500).json({ error: "AIK credentials missing" });
    }

    // Amount & orderId ko string bana do (API ko string pasand hai)
    const amountStr = String(amount);
    const orderIdStr = String(orderId);

    // 🔵 Call AIK Pay API to create payment
    const aikResponse = await fetch("https://aikpay.pk/api/payment/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": API_KEY,
      },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        order_id: orderIdStr,
        amount: amountStr,
        callback_url: CALLBACK_URL,
      }),
    });

    const data = await aikResponse.json();
    console.log("AIK Response:", data);

    // ❌ Agar HTTP status OK nahi ya QR missing ho
    if (!aikResponse.ok) {
      return res.status(500).json({
        success: false,
        error: "AIK Payment Error (HTTP)",
        details: data,
      });
    }

    // API kabhi qr_text, kabhi qrText de sakti hai
    const qrText = data?.qr_text || data?.qrText;

    if (!qrText) {
      return res.status(500).json({
        success: false,
        error: "QR text missing in AIK response",
        details: data,
      });
    }

    // ✅ Frontend ke liye clean response
    return res.status(200).json({
      success: true,
      qrText,
      aikRaw: data,
    });
  } catch (error) {
    console.error("AIK BACKEND ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Server Error",
      details: error.message || String(error),
    });
  }
}
