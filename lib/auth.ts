import { sql } from "./db"
import { compare, hash } from "bcryptjs"
import { sign, verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "flashbot-secret-key"

export async function hashPassword(password: string) {
  const hashedPassword = await hash(password, 12)
  return hashedPassword
}

export async function verifyPassword(password: string, hashedPassword: string) {
  try {
    const isValid = await compare(password, hashedPassword)
    return isValid
  } catch (error) {
    console.error("Password verification error:", error)
    return false
  }
}

export function generateToken(userId: number) {
  const token = sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
  return token
}

export function verifyToken(token: string) {
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: number }
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export async function getUserFromToken(token: string) {
  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  try {
    const users = await sql`
      SELECT * FROM users WHERE id = ${decoded.userId}
    `

    const user = users[0] || null
    return user
  } catch (error) {
    console.error("Database error during user lookup:", error)
    return null
  }
}

// Export authOptions for NextAuth compatibility if needed
export const authOptions = {
  secret: JWT_SECRET,
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.userId
      }
      return session
    },
  },
}
