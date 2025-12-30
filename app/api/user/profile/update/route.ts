import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    const body = await request.json()
    const { firstName, lastName, currentPassword, newPassword } = body

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    // Get current user
    const users = await sql`
      SELECT * FROM users WHERE id = ${decoded.userId}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // If password change is requested, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 })
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
      }

      // Update with new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await sql`
        UPDATE users 
        SET 
          first_name = ${firstName},
          last_name = ${lastName},
          password_hash = ${hashedPassword}
        WHERE id = ${decoded.userId}
      `
    } else {
      // Update without password change
      await sql`
        UPDATE users 
        SET 
          first_name = ${firstName},
          last_name = ${lastName}
        WHERE id = ${decoded.userId}
      `
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
