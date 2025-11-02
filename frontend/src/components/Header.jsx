import { Link } from "react-router-dom"
import "./Header.css"

export default function Header() {
  const cartCount = localStorage.getItem("cartCount") || 0

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <i className="fas fa-camera"></i>
            <span>VirtualTry-On</span>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/cart" className="nav-link cart-link">
              <i className="fas fa-shopping-cart"></i>
              <span className="cart-badge">{cartCount}</span>
            </Link>
            <Link to="/admin/login" className="nav-link admin-link">
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
