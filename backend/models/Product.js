import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
  _id: String,
  id: String,
  shopifyId: Number,
  name: String,
  description: String,
  price: Number,
  image: String,
  images: [String],
  sku: String,
  category: String,
  variants: mongoose.Schema.Types.Mixed,
  tags: [String],
  vendor: String,
  createdAt: Date,
  updatedAt: Date,
  savedAt: { type: Date, default: Date.now },
})

export default mongoose.model("Product", productSchema)
