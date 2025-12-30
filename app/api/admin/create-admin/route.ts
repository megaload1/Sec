import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { setupKey } = await request.json()

    if (setupKey !== "setup-flashbot-admin-2024") {
      console.log("[v0] Invalid setup key attempted:", setupKey)
      return NextResponse.json({ error: "Invalid setup key" }, { status: 401 })
    }

    console.log("[v0] Creating admin user with setup key")

    await sql`DELETE FROM users WHERE email = 'admin@flashbot.com'`

    // Generate proper password hash dynamically
    const passwordHash = await hashPassword("flashbot123")

    console.log("[v0] Generated password hash, creating admin user")

    const result = await sql`
      INSERT INTO users (
        email, password_hash, first_name, last_name, 
        is_admin, is_active, wallet_balance
      ) VALUES (
        'admin@flashbot.com', ${passwordHash}, 'Admin', 'User',
        true, true, 0.00
      ) RETURNING id, email, is_admin, is_active
    `

    console.log("[v0] Admin user created successfully:", result[0])

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: result[0],
    })
  } catch (error) {
    console.error("[v0] Create admin error:", error)
    return NextResponse.json({ error: "Failed to create admin user: " + String(error) }, { status: 500 })
  }
}
