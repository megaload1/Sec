import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, confirmPassword } = await request.json()

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Get admin settings
    const settings = await sql`
      SELECT setting_name, setting_value FROM admin_settings 
      WHERE setting_name IN ('countdown_minutes', 'registration_bonus')
    `

    const countdownMinutes = Number.parseInt(
      settings.find((s) => s.setting_name === "countdown_minutes")?.setting_value || "5",
    )
    const registrationBonus = Number.parseFloat(
      settings.find((s) => s.setting_name === "registration_bonus")?.setting_value || "300",
    )

    // Create countdown end time
    const countdownEnd = new Date()
    countdownEnd.setMinutes(countdownEnd.getMinutes() + countdownMinutes)

    // Hash password and create user
    const passwordHash = await hashPassword(password)

    const users = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, registration_countdown_end)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${countdownEnd.toISOString()})
      RETURNING id, email, first_name, last_name, wallet_balance, is_active, registration_countdown_end
    `

    const user = users[0]
    const token = generateToken(user.id)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        walletBalance: user.wallet_balance,
        isActive: user.is_active,
        registrationCountdownEnd: user.registration_countdown_end,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
