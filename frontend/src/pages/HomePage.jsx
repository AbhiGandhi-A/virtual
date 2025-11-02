"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "./HomePage.css"

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      console.log("[v0] Fetching products from:", window.location.origin + "/api/products")
      setLoading(true)
      setError("")

      const response = await axios.get("/api/products", {
        timeout: 10000,
      })

      console.log("[v0] Products received:", response.data.length)
      setProducts(response.data)
    } catch (err) {
      console.error("[v0] Error fetching products:", err.message)
      setError("Failed to load products. Make sure backend is running on http://localhost:5000")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
        <p>Loading products from Shopify...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchProducts} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Try Before You Buy</h1>
            <p>Experience our revolutionary virtual try-on technology</p>
            <button
              className="btn btn-primary"
              onClick={() => document.querySelector(".products-section").scrollIntoView()}
            >
              Shop Now
            </button>
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          <h2>Our Collection ({products.length} items)</h2>
          {products.length === 0 ? (
            <div className="empty-state">
              <p>No products available. Run: POST /api/products/sync in your backend</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <img src={product.image || "/placeholder.svg"} alt={product.name} />
                    <div className="product-overlay">
                      <a href={`/product/${product.id}`} className="btn btn-primary btn-sm">
                        View Details
                      </a>
                    </div>
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="description">{product.description?.substring(0, 50)}...</p>
                    <div className="product-footer">
                      <span className="price">${Number.parseFloat(product.price || 0).toFixed(2)}</span>
                      <span className="badge badge-primary">{product.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
