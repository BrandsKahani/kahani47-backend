export default function handler(req, res) {
  res.status(200).json({
    CUSTOMER_MOBILE: process.env.CUSTOMER_MOBILE || "MISSING",
    AIK_API_KEY: process.env.AIK_API_KEY || "MISSING",
    AIK_SECRET: process.env.AIK_SECRET || "MISSING",
    AIK_BASE_URL: process.env.AIK_BASE_URL || "MISSING",
    CALLBACK_URL: process.env.CALLBACK_URL || "MISSING",

    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN || "MISSING",
    SHOPIFY_TOKEN: process.env.SHOPIFY_TOKEN ? "LOADED" : "MISSING",
    SHOPIFY_API_VERSION: process.env.SHOPIFY_API_VERSION || "MISSING",
  });
}
