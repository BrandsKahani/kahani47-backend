import axios from "axios";

export default async function handler(req, res) {
  // Sirf POST allow karein
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, orderId } = req.body;

  // Basic validation
  if (!amount || !orderId) {
    return res
      .status(400)
      .json({ error: "amount and orderId are required" });
  }

  try {
    // AIK Digital MerchantQR API call
    const aikResponse = await axios.post(
      `${process.env.AIK_BASE_URL}/api/QR/MerchantQR`,
      {
        Amount: amount,
        OrderId: orderId,
        Call_back_URL: process.env.CALLBACK_URL,
      },
      {
        headers: {
          CustomerMobile: process.env.CUSTOMER_MOBILE,
          API_KEY: process.env.AIK_API_KEY,
          SECRET: process.env.AIK_SECRET,
        },
      }
    );

    const data = aikResponse.data;

    // Normally qrText body ke andar hota hai
    const qrText = data?.body?.qrText || data?.qrText;

    if (!qrText) {
      return res.status(500).json({
        success: false,
        error: "QR text not found in AIK response",
        raw: data,
      });
    }

    // Frontend ko qrText bhej dein
    return res.status(200).json({
      success: true,
      qrText,
      aikRaw: data,
    });
  } catch (error) {
    console.error(
      "AIK create QR error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      error: "Failed to create AIK QR",
      details: error.response?.data || error.message,
    });
  }
}
