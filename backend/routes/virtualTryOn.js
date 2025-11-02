import express from "express"
import multer from "multer"
import axios from "axios"
import Product from "../models/Product.js"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.post("/process", upload.single("file"), async (req, res) => {
  try {
    const { product_id } = req.body

    console.log("[v0] Processing virtual try-on for product:", product_id)

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" })
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "File must be an image" })
    }

    // Convert image to base64
    const base64Image = req.file.buffer.toString("base64")
    console.log("[v0] Image converted to base64, size:", base64Image.length)

    let product = null
    try {
      product = await Product.findOne({
        $or: [{ _id: product_id }, { id: product_id }, { shopifyId: product_id }],
      }).exec()
    } catch (dbErr) {
      console.warn("[v0] Database query error:", dbErr.message)
    }

    let productImageUrl = null
    if (product && product.image) {
      productImageUrl = product.image
      console.log("[v0] Product image URL:", productImageUrl)
    }

    const pythonUrl = process.env.PYTHON_API_URL || "http://localhost:5001"
    console.log("[v0] Sending to Python service:", pythonUrl)

    const pythonResponse = await axios.post(
      `${pythonUrl}/process-try-on`,
      {
        image: base64Image,
        product_id: product_id,
        product_image_url: productImageUrl,
      },
      {
        timeout: 120000, // 2 minutes timeout
        headers: { "Content-Type": "application/json" },
      },
    )

    console.log("[v0] Python service response status:", pythonResponse.status)

    let recommendations = []
    if (product) {
      try {
        recommendations = await Product.find({
          category: product.category,
          _id: { $ne: product._id },
        })
          .limit(5)
          .exec()
        console.log("[v0] Found", recommendations.length, "recommendations")
      } catch (recErr) {
        console.warn("[v0] Recommendations query error:", recErr.message)
      }
    }

    res.json({
      processed_image: pythonResponse.data.processed_image,
      recommendations: recommendations,
      product_overlayed: pythonResponse.data.product_overlayed,
      status: pythonResponse.data.status,
    })
  } catch (err) {
    console.error("[v0] Virtual try-on error:", err.message)
    if (err.response) {
      console.error("[v0] Python service error:", err.response.data)
      return res.status(err.response.status || 500).json({
        message: "Python service error",
        error: err.response.data,
      })
    }
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "AI service unavailable. Make sure Python service is running on port 5001",
        error: err.message,
      })
    }
    res.status(500).json({ message: "Failed to process image", error: err.message })
  }
})

export default router
