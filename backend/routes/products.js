import express from "express"
import axios from "axios"
import Product from "../models/Product.js"

const router = express.Router()

const SHOPIFY_API_VERSION = "2024-01"

// Get all products
router.get("/", async (req, res) => {
  try {
    console.log("[v0] Fetching products from database...")
    const products = await Product.find().limit(50)

    // If no products in DB, fetch from Shopify
    if (products.length === 0) {
      console.log("[v0] No products in DB, fetching from Shopify...")
      const shopifyProducts = await fetchFromShopify()

      // Save to database
      if (shopifyProducts.length > 0) {
        await Product.insertMany(shopifyProducts, { ordered: false }).catch(() => {})
      }

      return res.json(shopifyProducts)
    }

    res.json(products)
  } catch (err) {
    console.error("[v0] Error fetching products:", err.message)
    res.status(500).json({ message: err.message })
  }
})

// Get single product by Shopify ID
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id
    console.log("[v0] Looking up product:", productId)

    // Try to find in database first
    const product = await Product.findOne({
      $or: [{ _id: productId }, { id: productId }, { shopifyId: productId }],
    })

    if (product) {
      return res.json(product)
    }

    // Not found in database, return 404
    return res.status(404).json({ message: "Product not found", id: productId })
  } catch (err) {
    console.error("[v0] Error fetching single product:", err.message)
    res.status(500).json({ message: err.message })
  }
})

// Get batch products
router.post("/batch", async (req, res) => {
  try {
    const { ids } = req.body
    const products = await Product.find({
      $or: [{ _id: { $in: ids } }, { id: { $in: ids } }],
    })
    res.json(products)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Sync products from Shopify
router.post("/sync", async (req, res) => {
  try {
    console.log("[v0] Starting Shopify product sync...")
    const products = await fetchFromShopify()

    if (products.length === 0) {
      return res.status(400).json({
        message: "No products found from Shopify. Check your credentials.",
        error: "EMPTY_PRODUCTS",
      })
    }

    // Clear existing products and insert new ones
    await Product.deleteMany({})
    const savedProducts = await Product.insertMany(products)

    res.json({
      message: "Products synced successfully",
      count: savedProducts.length,
      products: savedProducts,
    })
  } catch (err) {
    console.error("[v0] Sync error:", err.message)
    res.status(500).json({ message: err.message })
  }
})

async function fetchFromShopify() {
  try {
    const storeUrl = process.env.SHOPIFY_STORE_URL
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN
    const apiVersion = SHOPIFY_API_VERSION

    if (!storeUrl || !accessToken) {
      console.error("[v0] Missing Shopify credentials")
      throw new Error("Missing SHOPIFY_STORE_URL or SHOPIFY_ACCESS_TOKEN environment variables")
    }

    // Ensure store URL doesn't have protocol or trailing slash
    const cleanStoreUrl = storeUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")

    const shopifyUrl = `https://${cleanStoreUrl}/admin/api/${apiVersion}/products.json?limit=250`

    console.log("[v0] Fetching from Shopify:", shopifyUrl)

    const response = await axios.get(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    })

    console.log("[v0] Shopify response status:", response.status)
    console.log("[v0] Products found:", response.data.products?.length || 0)

    const products = response.data.products.map((product) => ({
      _id: product.id.toString(),
      id: product.id.toString(),
      shopifyId: product.id,
      name: product.title,
      description: product.body_html || "No description",
      price: Number.parseFloat(product.variants[0]?.price || 0),
      image: product.image?.src || product.images?.[0]?.src || "/placeholder.svg",
      images: product.images?.map((img) => img.src) || [product.image?.src],
      sku: product.variants[0]?.sku || "",
      category: product.product_type || "Uncategorized",
      variants: product.variants || [],
      tags: product.tags || [],
      vendor: product.vendor || "",
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }))

    return products
  } catch (err) {
    console.error("[v0] Shopify API error:", err.message)
    if (err.response) {
      console.error("[v0] Response status:", err.response.status)
      console.error("[v0] Response data:", err.response.data)
    }
    return []
  }
}

export default router
