"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./CartPage.css"

export default function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCart()
    window.addEventListener("cartUpdated", loadCart)
    return () => window.removeEventListener("cartUpdated", loadCart)
  }, [])

  const loadCart = async () => {
    try {
      const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")
      console.log("[v0] Cart items:", cartItems.length)
      setCart(cartItems)

      if (cartItems.length > 0) {
        const productIds = [...new Set(cartItems.map((item) => item.id))]
        console.log("[v0] Fetching product details for:", productIds.length, "products")

        const response = await axios.post("/api/products/batch", { ids: productIds })
        const productMap = {}
        response.data.forEach((product) => {
          productMap[product.id] = product
        })
        setProducts(productMap)
      }
    } catch (err) {
      console.error("[v0] Error loading cart:", err.message)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index)
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
    localStorage.setItem("cartCount", newCart.length)
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return
    const newCart = [...cart]
    newCart[index].quantity = newQuantity
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const product = products[item.id]
      if (!product) return total
      return total + product.price * item.quantity
    }, 0)
  }

  const calculateDiscount = () => {
    return cart.reduce((total, item) => {
      const product = products[item.id]
      if (!product) return total
      const itemTotal = product.price * item.quantity
      const discount = itemTotal * (item.discount / 100)
      return total + discount
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
        <p>Loading cart...</p>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        <button onClick={() => navigate("/")} className="back-link">
          ← Continue Shopping
        </button>

        <h1>Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <p>Your cart is empty</p>
            <p className="empty-text">Add some products using the virtual try-on feature!</p>
            <button onClick={() => navigate("/")} className="btn btn-primary">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.map((item, index) => {
                const product = products[item.id]
                if (!product)
                  return (
                    <div key={index} className="cart-item loading-item">
                      Loading product...
                    </div>
                  )

                const itemTotal = product.price * item.quantity
                const discount = itemTotal * (item.discount / 100)
                const finalPrice = itemTotal - discount

                return (
                  <div key={index} className="cart-item">
                    <img src={product.image || "/placeholder.svg"} alt={product.name} className="item-image" />
                    <div className="item-details">
                      <h3>{product.name}</h3>
                      <p className="item-category">{product.category}</p>
                      <p className="item-price">${Number.parseFloat(product.price || 0).toFixed(2)}</p>
                    </div>
                    <div className="item-quantity-control">
                      <label>Quantity</label>
                      <div className="quantity-buttons">
                        <button onClick={() => updateQuantity(index, item.quantity - 1)}>−</button>
                        <input type="number" value={item.quantity} readOnly />
                        <button onClick={() => updateQuantity(index, item.quantity + 1)}>+</button>
                      </div>
                    </div>
                    <div className="item-pricing">
                      <div className="price-section">
                        <p className="label">Subtotal</p>
                        <p className="value">${itemTotal.toFixed(2)}</p>
                      </div>
                      {item.discount > 0 && (
                        <div className="discount-section">
                          <p className="label discount-label">{item.discount}% Off</p>
                          <p className="value discount-value">-${discount.toFixed(2)}</p>
                        </div>
                      )}
                      <div className="total-section">
                        <p className="label total-label">Total</p>
                        <p className="value total-value">${finalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <button className="btn-remove" onClick={() => removeFromCart(index)} title="Remove item">
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>
              <div className="summary-section">
                <div className="summary-line">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                {calculateDiscount() > 0 && (
                  <div className="summary-line discount">
                    <span>Virtual Try-On Bundle Discount</span>
                    <span>-${calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-line">
                  <span>Shipping</span>
                  <span className="free">Free</span>
                </div>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-total">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <button className="btn btn-primary btn-checkout btn-block">Proceed to Checkout</button>
              <button onClick={() => navigate("/")} className="btn btn-secondary btn-block">
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
