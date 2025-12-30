import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get public settings that users can see - including registration bonus for countdown
    const settings = await sql`
      SELECT setting_name, setting_value FROM admin_settings
      WHERE setting_name IN ('topup_payment_amount', 'topup_credit_amount', 'activation_fee', 'registration_bonus')
    `

    const settingsObj = settings.reduce((acc: any, setting) => {
      acc[setting.setting_name] = setting.setting_value
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      settings: settingsObj,
    })
  } catch (error) {
    console.error("User settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
