import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "gaming-zone-secret-key-change-in-production";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function adminMiddleware(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }
  next();
}

export const JWT_SECRET_KEY = JWT_SECRET;
