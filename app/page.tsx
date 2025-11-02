"use client"

import { useState } from "react"
import styles from "./page.module.css"

export default function Home() {
  const [copied, setCopied] = useState("")

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(""), 2000)
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logoSection}>
            <div className={styles.icon}>📷</div>
            <div>
              <h1>Virtual Try-On Platform</h1>
              <p>Complete Shopify Integration with AI Image Processing</p>
            </div>
          </div>
        </header>

        {/* Setup Instructions */}
        <section className={styles.section}>
          <h2>⚡ Quick Start</h2>
          <div className={styles.instructionsGrid}>
            <div className={styles.card}>
              <h3>1. Install Dependencies</h3>
              <code>
                npm install
                <br />
                cd frontend && npm install
                <br />
                cd ../backend && npm install
              </code>
              <button
                onClick={() =>
                  copyToClipboard("npm install\ncd frontend && npm install\ncd ../backend && npm install", "Install")
                }
                className={styles.copyBtn}
              >
                {copied === "Install" ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <div className={styles.card}>
              <h3>2. Configure Environment</h3>
              <code>
                cd backend
                <br />
                cp .env.example .env
              </code>
              <p className={styles.hint}>Add your Shopify API key, access token, and MongoDB URI</p>
              <button
                onClick={() => copyToClipboard("cd backend\ncp .env.example .env", "Config")}
                className={styles.copyBtn}
              >
                {copied === "Config" ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <div className={styles.card}>
              <h3>3. Start Backend</h3>
              <code>
                cd backend
                <br />
                npm run dev
              </code>
              <p className={styles.hint}>Runs on https://virtual-1-8hpp.onrender.com</p>
              <button
                onClick={() => copyToClipboard("cd backend && npm run dev", "Backend")}
                className={styles.copyBtn}
              >
                {copied === "Backend" ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <div className={styles.card}>
              <h3>4. Start Python AI</h3>
              <code>
                cd python
                <br />
                pip install -r requirements.txt
                <br />
                python app.py
              </code>
              <p className={styles.hint}>Runs on http://localhost:5001</p>
              <button
                onClick={() =>
                  copyToClipboard("cd python && pip install -r requirements.txt && python app.py", "Python")
                }
                className={styles.copyBtn}
              >
                {copied === "Python" ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <div className={styles.card}>
              <h3>5. Start Frontend</h3>
              <code>
                cd frontend
                <br />
                npm run dev
              </code>
              <p className={styles.hint}>Runs on http://localhost:5173</p>
              <button
                onClick={() => copyToClipboard("cd frontend && npm run dev", "Frontend")}
                className={styles.copyBtn}
              >
                {copied === "Frontend" ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <div className={styles.card}>
              <h3>Admin Dashboard</h3>
              <code>
                Email: admin@example.com
                <br />
                Password: password123
              </code>
              <p className={styles.hint}>Demo credentials for testing</p>
              <button
                onClick={() => copyToClipboard("admin@example.com\npassword123", "Creds")}
                className={styles.copyBtn}
              >
                {copied === "Creds" ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={styles.section}>
          <h2>✨ Key Features</h2>
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🎥</span>
              <div>
                <h4>Virtual Try-On</h4>
                <p>Upload photos and see products virtually on your body using AI</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🛍️</span>
              <div>
                <h4>Shopify Integration</h4>
                <p>Automatic product catalog sync and inventory management</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📊</span>
              <div>
                <h4>Advanced Analytics</h4>
                <p>Track conversions, revenue, and user behavior in real-time</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>💰</span>
              <div>
                <h4>Bundle Discounts</h4>
                <p>10-20% discounts for purchasing multiple items</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🤖</span>
              <div>
                <h4>AI Recommendations</h4>
                <p>Smart product suggestions based on try-on history</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🔐</span>
              <div>
                <h4>Secure Admin Panel</h4>
                <p>JWT authentication with detailed performance metrics</p>
              </div>
            </div>
          </div>
        </section>

        {/* Project Structure */}
        <section className={styles.section}>
          <h2>📁 Project Structure</h2>
          <pre className={styles.codeBlock}>{`project/
├── frontend/              # Vite React App
│   ├── src/
│   │   ├── components/    # Header, Footer, VirtualTryOn
│   │   ├── pages/         # HomePage, ProductPage, CartPage, Admin
│   │   ├── styles/        # Global CSS
│   │   └── utils/         # API utilities
│   └── package.json
│
├── backend/               # Node.js + Express
│   ├── routes/            # Products, Admin, Virtual Try-On
│   ├── models/            # MongoDB schemas
│   ├── middleware/        # Auth middleware
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
├── python/                # Flask AI Service
│   ├── app.py             # Image processing API
│   └── requirements.txt
│
├── README.md              # Documentation
└── DEPLOYMENT_GUIDE.md    # Production deployment`}</pre>
        </section>

        {/* Tech Stack */}
        <section className={styles.section}>
          <h2>🛠️ Technology Stack</h2>
          <div className={styles.techGrid}>
            <div className={styles.techCard}>
              <h4>Frontend</h4>
              <ul>
                <li>React 18</li>
                <li>Vite</li>
                <li>React Router</li>
                <li>Axios</li>
              </ul>
            </div>

            <div className={styles.techCard}>
              <h4>Backend</h4>
              <ul>
                <li>Node.js</li>
                <li>Express 5</li>
                <li>MongoDB</li>
                <li>JWT Auth</li>
              </ul>
            </div>

            <div className={styles.techCard}>
              <h4>AI Service</h4>
              <ul>
                <li>Python Flask</li>
                <li>OpenCV</li>
                <li>Image Processing</li>
                <li>Pillow</li>
              </ul>
            </div>

            <div className={styles.techCard}>
              <h4>Deployment</h4>
              <ul>
                <li>Vercel (Frontend)</li>
                <li>Render (Backend)</li>
                <li>Any Python Host</li>
                <li>MongoDB Atlas</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Shopify Setup */}
        <section className={styles.section}>
          <h2>🛒 Shopify Setup</h2>
          <ol className={styles.setupSteps}>
            <li>
              <strong>Create Custom App</strong>
              <p>Go to Shopify Admin → Settings → Apps and integrations → Develop apps</p>
            </li>
            <li>
              <strong>Configure Scopes</strong>
              <p>
                Add <code>read_products</code> and <code>write_products</code> permissions
              </p>
            </li>
            <li>
              <strong>Get Credentials</strong>
              <p>Copy API Key and Access Token to backend .env file</p>
            </li>
            <li>
              <strong>Sync Products</strong>
              <p>
                Run <code>POST /api/products/sync</code> to import your catalog
              </p>
            </li>
          </ol>
        </section>

        {/* API Documentation */}
        <section className={styles.section}>
          <h2>📚 API Endpoints</h2>
          <div className={styles.apiTable}>
            <div className={styles.apiRow}>
              <div className={styles.apiMethod}>GET</div>
              <div className={styles.apiPath}>/api/products</div>
              <div className={styles.apiDesc}>Get all products</div>
            </div>
            <div className={styles.apiRow}>
              <div className={styles.apiMethod}>POST</div>
              <div className={styles.apiPath}>/api/virtual-tryon/process</div>
              <div className={styles.apiDesc}>Process image for try-on</div>
            </div>
            <div className={styles.apiRow}>
              <div className={styles.apiMethod}>POST</div>
              <div className={styles.apiPath}>/api/admin/login</div>
              <div className={styles.apiDesc}>Admin authentication</div>
            </div>
            <div className={styles.apiRow}>
              <div className={styles.apiMethod}>GET</div>
              <div className={styles.apiPath}>/api/admin/analytics</div>
              <div className={styles.apiDesc}>Get analytics data</div>
            </div>
          </div>
        </section>

        {/* Deployment */}
        <section className={styles.section}>
          <h2>🚀 Deploy to Production</h2>
          <div className={styles.deploymentTabs}>
            <div className={styles.deploymentCard}>
              <h3>Frontend (Vercel)</h3>
              <ol className={styles.deploySteps}>
                <li>
                  <code>cd frontend && npm run build</code>
                </li>
                <li>Connect to Vercel</li>
                <li>
                  Set <code>VITE_API_URL</code> environment variable
                </li>
                <li>Deploy!</li>
              </ol>
            </div>

            <div className={styles.deploymentCard}>
              <h3>Backend (Render)</h3>
              <ol className={styles.deploySteps}>
                <li>Push code to GitHub</li>
                <li>Create Web Service on Render</li>
                <li>Add all environment variables</li>
                <li>Deploy automatically</li>
              </ol>
            </div>

            <div className={styles.deploymentCard}>
              <h3>Python (Any Host)</h3>
              <ol className={styles.deploySteps}>
                <li>
                  <code>pip install -r requirements.txt</code>
                </li>
                <li>Deploy to Railway, Render, or Heroku</li>
                <li>
                  Set <code>PYTHON_API_URL</code> in backend
                </li>
                <li>Ready to scale!</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Demo Credentials */}
        <section className={styles.section}>
          <h2>🔑 Demo Credentials</h2>
          <div className={styles.credentialsBox}>
            <div className={styles.credential}>
              <label>Admin Email:</label>
              <code>admin@example.com</code>
            </div>
            <div className={styles.credential}>
              <label>Admin Password:</label>
              <code>password123</code>
            </div>
            <p className={styles.hint}>These are created automatically on first login attempt</p>
          </div>
        </section>

        {/* Next Steps */}
        <section className={styles.section + " " + styles.lastSection}>
          <h2>📝 Next Steps</h2>
          <ol className={styles.nextSteps}>
            <li>Follow the Quick Start guide above</li>
            <li>Test the app locally</li>
            <li>Configure your Shopify store credentials</li>
            <li>Customize AI processing in python/app.py</li>
            <li>Deploy to production using the deployment guide</li>
            <li>Monitor analytics and optimize conversions</li>
          </ol>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>Virtual Try-On Platform © 2025 | Production Ready | MIT License</p>
          <div className={styles.links}>
            <a href="https://github.com">GitHub</a>
            <a href="https://docs">Docs</a>
            <a href="https://support">Support</a>
          </div>
        </footer>
      </div>
    </main>
  )
}
