"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import VirtualTryOn from "../components/VirtualTryOn"
import "./ProductPage.css"

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTryOn, setShowTryOn] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      console.log("[v0] Fetching product:", id)
      setError("")
      setLoading(true)

      const response = await axios.get(`/api/products/${id}`, {
        timeout: 10000,
      })

      console.log("[v0] Product fetched:", response.data)
      setProduct(response.data)
    } catch (err) {
      console.error("[v0] Error fetching product:", err.message)
      setError(`Failed to load product. Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    cart.push({ id: product.id, quantity, discount: 0, name: product.name, price: product.price })
    localStorage.setItem("cart", JSON.stringify(cart))
    localStorage.setItem("cartCount", cart.length)
    window.dispatchEvent(new Event("cartUpdated"))
    alert("Added to cart!")
    navigate("/cart")
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
        <p>Loading product details...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="error-container">
        <div className="error-message">{error || "Product not found"}</div>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Back to Shop
        </button>
      </div>
    )
  }

  return (
    <div className="product-page">
      <div className="container">
        <button onClick={() => navigate("/")} className="back-link">
          ← Back to Products
        </button>

        <div className="product-details">
          <div className="product-image-section">
            <img src={product.image || "/placeholder.svg"} alt={product.name} className="main-image" />
            <button className="btn btn-secondary btn-virtual-try" onClick={() => setShowTryOn(true)}>
              Virtual Try-On
            </button>
          </div>

          <div className="product-info-section">
            <h1>{product.name}</h1>
            <p className="description">{product.description}</p>
            <div className="price-section">
              <span className="price">${Number.parseFloat(product.price || 0).toFixed(2)}</span>
              <span className="badge badge-success">In Stock</span>
            </div>

            <div className="actions">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-control">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  />
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                Add to Cart
              </button>
            </div>

            <div className="product-details-info">
              <h3>Product Details</h3>
              <ul>
                <li>
                  <strong>SKU:</strong> {product.sku || "N/A"}
                </li>
                <li>
                  <strong>Category:</strong> {product.category || "Uncategorized"}
                </li>
                <li>
                  <strong>Vendor:</strong> {product.vendor || "N/A"}
                </li>
                <li>
                  <strong>Status:</strong> Available
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <VirtualTryOn product={product} isOpen={showTryOn} onClose={() => setShowTryOn(false)} />
    </div>
  )
}
