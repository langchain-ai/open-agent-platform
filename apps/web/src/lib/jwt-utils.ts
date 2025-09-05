import jwt from "jsonwebtoken";

export interface JWTPayload {
  sub: string; // user ID
  [key: string]: any;
}

export function decodeJWT(token: string, secret: string): JWTPayload | null {
  try {
    // Verify and decode the JWT token
    const decoded = jwt.verify(token, secret) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error("JWT decode error:", error);
    return null;
  }
}
