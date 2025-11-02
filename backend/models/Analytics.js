import mongoose from "mongoose"

const analyticsSchema = new mongoose.Schema({
  totalOrders: Number,
  virtualTryOns: Number,
  totalRevenue: Number,
  conversionRate: Number,
  uniqueUsers: Number,
  avgSessionDuration: Number,
  returnUserRate: Number,
  totalTryOns: Number,
  tryOnSuccessRate: Number,
  avgImagesGenerated: Number,
  avgOrderValue: Number,
  discountRedeemed: Number,
  mostViewedProduct: String,
  bestPerformer: String,
  avgRating: Number,
  salesTrend: [Number],
  topProducts: [
    {
      name: String,
      tryOns: Number,
      purchases: Number,
      revenue: Number,
    },
  ],
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.model("Analytics", analyticsSchema)
