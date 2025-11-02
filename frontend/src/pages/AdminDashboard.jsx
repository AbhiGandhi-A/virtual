"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"
import "./AdminDashboard.css"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [productAnalytics, setProductAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      navigate("/admin/login")
      return
    }
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("adminToken")

      const [analyticsRes, productsRes] = await Promise.all([
        axios.get("/api/admin/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/admin/products-analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      console.log("[v0] Analytics data received:", analyticsRes.data)
      console.log("[v0] Product analytics received:", productsRes.data)

      setAnalytics(analyticsRes.data)
      setProductAnalytics(productsRes.data)
    } catch (err) {
      console.error("[v0] Error fetching data:", err.message)
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken")
        navigate("/admin/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    navigate("/admin/login")
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="error-container">
        <div className="error-message">Failed to load analytics</div>
        <button onClick={() => navigate("/admin/login")} className="btn btn-primary">
          Back to Login
        </button>
      </div>
    )
  }

  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
    datasets: [
      {
        label: "Sales via Virtual Try-On",
        data: analytics.salesTrend || [12, 19, 15, 25, 28, 35, 42],
        borderColor: "#1a73e8",
        backgroundColor: "rgba(26, 115, 232, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const productChartData = {
    labels: productAnalytics.slice(0, 5).map((p) => p.name),
    datasets: [
      {
        label: "Try-Ons",
        data: productAnalytics.slice(0, 5).map((p) => p.tryOns),
        backgroundColor: "rgba(26, 115, 232, 0.8)",
      },
      {
        label: "Purchases",
        data: productAnalytics.slice(0, 5).map((p) => p.purchases),
        backgroundColor: "rgba(52, 168, 83, 0.8)",
      },
    ],
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <h1>Admin Dashboard</h1>
              <p className="header-subtitle">Real-time analytics and insights</p>
            </div>
            <div className="header-actions">
              <button onClick={handleRefresh} className="btn btn-secondary btn-sm" disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button onClick={handleLogout} className="btn btn-primary btn-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === "detailed" ? "active" : ""}`}
            onClick={() => setActiveTab("detailed")}
          >
            Detailed Analytics
          </button>
          <button
            className={`tab ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Product Performance
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon" style={{ color: "#34a853" }}>
                  📦
                </div>
                <div className="metric-content">
                  <h3>Total Orders</h3>
                  <p className="metric-value">{analytics.totalOrders || 0}</p>
                  <p className="metric-change">From virtual try-ons</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon" style={{ color: "#1a73e8" }}>
                  📸
                </div>
                <div className="metric-content">
                  <h3>Virtual Try-Ons</h3>
                  <p className="metric-value">{analytics.virtualTryOns || 0}</p>
                  <p className="metric-change">{(analytics.tryOnSuccessRate || 0).toFixed(1)}% success rate</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon" style={{ color: "#fbbc04" }}>
                  💰
                </div>
                <div className="metric-content">
                  <h3>Revenue</h3>
                  <p className="metric-value">${(analytics.totalRevenue || 0).toFixed(2)}</p>
                  <p className="metric-change">After discounts</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon" style={{ color: "#ea4335" }}>
                  📈
                </div>
                <div className="metric-content">
                  <h3>Conversion Rate</h3>
                  <p className="metric-value">{(analytics.conversionRate || 0).toFixed(1)}%</p>
                  <p className="metric-change">Virtual try-on to purchase</p>
                </div>
              </div>
            </div>

            <div className="chart-section">
              <h2>Sales Trend</h2>
              <div className="chart-container">
                <Line data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
              </div>
            </div>

            <div className="top-products">
              <h2>Top Products via Virtual Try-On</h2>
              {analytics.topProducts && analytics.topProducts.length > 0 ? (
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Try-Ons</th>
                      <th>Purchases</th>
                      <th>Revenue</th>
                      <th>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="product-name">{product.name}</td>
                        <td>{product.tryOns}</td>
                        <td>{product.purchases}</td>
                        <td>${Number.parseFloat(product.revenue || 0).toFixed(2)}</td>
                        <td>{product.tryOns > 0 ? ((product.purchases / product.tryOns) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No product data available</p>
              )}
            </div>
          </>
        )}

        {activeTab === "detailed" && (
          <>
            <div className="detailed-metrics">
              <div className="detail-card">
                <h3>User Engagement</h3>
                <div className="detail-content">
                  <div className="detail-item">
                    <span>Unique Users</span>
                    <strong>{analytics.uniqueUsers || 0}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Avg. Session Duration</span>
                    <strong>{(analytics.avgSessionDuration || 0).toFixed(1)} min</strong>
                  </div>
                  <div className="detail-item">
                    <span>Return Users</span>
                    <strong>{(analytics.returnUserRate || 0).toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              <div className="detail-card">
                <h3>Virtual Try-On Stats</h3>
                <div className="detail-content">
                  <div className="detail-item">
                    <span>Total Try-Ons</span>
                    <strong>{analytics.totalTryOns || 0}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Success Rate</span>
                    <strong>{(analytics.tryOnSuccessRate || 0).toFixed(1)}%</strong>
                  </div>
                  <div className="detail-item">
                    <span>Avg. Images Generated</span>
                    <strong>{(analytics.avgImagesGenerated || 0).toFixed(1)}</strong>
                  </div>
                </div>
              </div>

              <div className="detail-card">
                <h3>Financial Metrics</h3>
                <div className="detail-content">
                  <div className="detail-item">
                    <span>Avg. Order Value</span>
                    <strong>${(analytics.avgOrderValue || 0).toFixed(2)}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Discount Redemption</span>
                    <strong>${(analytics.discountRedeemed || 0).toFixed(2)}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Net Revenue</span>
                    <strong>${((analytics.totalRevenue || 0) - (analytics.discountRedeemed || 0)).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div className="detail-card">
                <h3>Product Performance</h3>
                <div className="detail-content">
                  <div className="detail-item">
                    <span>Most Viewed</span>
                    <strong>{analytics.mostViewedProduct || "N/A"}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Best Performer</span>
                    <strong>{analytics.bestPerformer || "N/A"}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Avg. Rating</span>
                    <strong>{(analytics.avgRating || 0).toFixed(1)} ⭐</strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "products" && (
          <>
            <div className="chart-section">
              <h2>Try-Ons vs Purchases (Top 5 Products)</h2>
              <div className="chart-container">
                <Bar data={productChartData} options={{ responsive: true, maintainAspectRatio: true }} />
              </div>
            </div>

            <div className="products-analytics-table">
              <h2>All Products Analytics</h2>
              {productAnalytics.length > 0 ? (
                <table className="detailed-products-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Views</th>
                      <th>Try-Ons</th>
                      <th>Purchases</th>
                      <th>Revenue</th>
                      <th>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productAnalytics.map((product) => (
                      <tr key={product.id}>
                        <td className="product-name">{product.name}</td>
                        <td>${Number.parseFloat(product.price || 0).toFixed(2)}</td>
                        <td>{product.views}</td>
                        <td>{product.tryOns}</td>
                        <td>{product.purchases}</td>
                        <td>${Number.parseFloat(product.revenue || 0).toFixed(2)}</td>
                        <td>
                          <span className="conversion-badge">
                            {product.tryOns > 0 ? ((product.purchases / product.tryOns) * 100).toFixed(1) : 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No product analytics available</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
