"use client"

import { useState, useRef } from "react"
import axios from "axios"
import "./VirtualTryOn.css"

export default function VirtualTryOn({ product, isOpen, onClose }) {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([product?.id].filter(Boolean))
  const [recommendations, setRecommendations] = useState([])
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)
  const [discountTier, setDiscountTier] = useState(0)

  const discountTiers = [
    { count: 1, discount: 0, text: "No discount" },
    { count: 2, discount: 10, text: "10% off" },
    { count: 3, discount: 15, text: "15% off" },
    { count: 4, discount: 20, text: "20% off" },
  ]

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setLoading(true)
    setProcessedImage(null)

    try {
      // Show preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("product_id", product?.id || product?.shopifyId)

      console.log("[v0] Uploading image for product:", product?.id)

      const response = await axios.post("/api/virtual-tryon/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      })

      console.log("[v0] Processing response received")

      setProcessedImage(response.data.processed_image)
      setRecommendations(response.data.recommendations || [])
    } catch (err) {
      console.error("[v0] Image processing error:", err.message)
      const errorMsg = err.response?.data?.message || err.message
      setError(`Processing error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) => {
      let updated
      if (prev.includes(productId)) {
        updated = prev.filter((id) => id !== productId)
      } else {
        updated = [...prev, productId]
      }

      const tier = discountTiers.find((t) => t.count === updated.length) || discountTiers[0]
      setDiscountTier(tier.discount)
      return updated
    })
  }

  const addToCart = () => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")
    const newItems = selectedProducts.map((id) => {
      const prod = id === product?.id ? product : recommendations.find((r) => r.id === id || r._id === id)
      return {
        id: prod?.id || prod?._id,
        quantity: 1,
        discount: discountTier,
        name: prod?.name,
        price: prod?.price,
        image: prod?.image,
      }
    })
    cartItems.push(...newItems)
    localStorage.setItem("cart", JSON.stringify(cartItems))
    localStorage.setItem("cartCount", cartItems.length)
    window.dispatchEvent(new Event("cartUpdated"))
    alert(`Added ${newItems.length} item(s) to cart with ${discountTier}% discount!`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="tryon-modal-overlay" onClick={onClose}>
      <div className="tryon-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tryon-header">
          <div className="header-content">
            <h2>Virtual Try-On</h2>
            <p className="header-subtitle">See how this product looks on you</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="tryon-content">
          {/* Left Section */}
          <div className="tryon-left">
            <div className="upload-section">
              <h3>Step 1: Upload Your Photo</h3>
              {!uploadedImage ? (
                <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon">📷</div>
                  <p>Click to upload your photo</p>
                  <small>JPG, PNG or GIF (Max 10MB)</small>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </div>
              ) : (
                <div className="preview-section">
                  <div className="preview-label">Your Photo</div>
                  <img src={uploadedImage || "/placeholder.svg"} alt="Preview" className="preview-image" />
                  <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                    Change Photo
                  </button>
                </div>
              )}

              {error && (
                <div className="alert alert-danger">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {loading && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Processing your image with AI...</p>
                  <small>This may take up to 30 seconds</small>
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="tryon-right">
            {/* Virtual Try-On Result */}
            {processedImage && (
              <div className="result-section">
                <h3>Step 2: Virtual Try-On Result</h3>
                <div className="result-container">
                  <img
                    src={`data:image/jpeg;base64,${processedImage}`}
                    alt="Virtual try-on result"
                    className="result-image"
                  />
                  <div className="result-status">
                    <span className="status-badge success">✓ Product wrapping complete</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bundle Offers */}
            <div className="bundle-offers">
              <h3>Bundle Discounts</h3>
              <p className="offer-subtitle">Select multiple items to save more</p>
              <div className="offers-grid">
                {discountTiers.map((tier) => (
                  <div
                    key={tier.count}
                    className={`offer-card ${selectedProducts.length === tier.count ? "active" : ""}`}
                  >
                    <div className="offer-count">{tier.count} Items</div>
                    <div className="offer-discount">{tier.discount}% OFF</div>
                    <small>{tier.text}</small>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="recommendations-section">
              <h3>Step 3: Recommended Products</h3>
              {recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {recommendations.map((item) => (
                    <div key={item._id || item.id} className="recommendation-item">
                      <input
                        type="checkbox"
                        id={`product-${item._id || item.id}`}
                        checked={selectedProducts.includes(item._id || item.id)}
                        onChange={() => toggleProductSelection(item._id || item.id)}
                      />
                      <label htmlFor={`product-${item._id || item.id}`} className="item-label">
                        <img src={item.image || "/placeholder.svg"} alt={item.name} />
                        <div className="item-details">
                          <p className="item-name">{item.name}</p>
                          <p className="item-price">${Number.parseFloat(item.price || 0).toFixed(2)}</p>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-recommendations">
                  <p>📸 Upload a photo to see recommendations</p>
                </div>
              )}
            </div>

            {/* Summary & Checkout */}
            <div className="summary-section">
              <h4>Order Summary</h4>
              <div className="summary-details">
                <p>
                  Items: <strong>{selectedProducts.length}</strong>
                </p>
                {discountTier > 0 && (
                  <p className="discount-badge">
                    Discount: <strong>{discountTier}% OFF</strong>
                  </p>
                )}
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={addToCart}
                disabled={selectedProducts.length === 0}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
