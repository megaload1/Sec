import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find admin user
    const users = await sql`
      SELECT id, email, password_hash, first_name, last_name, is_admin, is_active 
      FROM users 
      WHERE email = ${email}
    `

    console.log("[v0] Admin login attempt - Email:", email, "User found:", users.length > 0)

    if (users.length === 0) {
      console.log("[v0] No user found with email:", email)
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
    }

    const user = users[0]

    console.log("[v0] User found - is_admin:", user.is_admin, "is_active:", user.is_active)

    // Check if user is admin
    if (!user.is_admin) {
      console.log("[v0] User is not admin")
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
    }

    // Verify password
    console.log("[v0] Verifying password for user:", email)
    const isValidPassword = await verifyPassword(password, user.password_hash)

    console.log("[v0] Password verification result:", isValidPassword)

    if (!isValidPassword) {
      console.log("[v0] Password verification failed")
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
    }

    const token = generateToken(user.id)

    console.log("[v0] Admin login successful for:", email)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        walletBalance: 0,
        isActive: user.is_active,
        isAdmin: user.is_admin,
      },
    })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
