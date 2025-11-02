import jwt from "jsonwebtoken"

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret-key-change-in-production")
    req.admin = decoded
    next()
  } catch (err) {
    console.error("[v0] Token verification failed:", err.message)
    res.status(401).json({ message: "Invalid or expired token" })
  }
}

export default verifyToken
