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
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const settings = await sql`
      SELECT setting_name, setting_value FROM admin_settings
      WHERE setting_name IN ('flutterwave_secret_key', 'flutterwave_public_key', 'flutterwave_encryption_key')
    `

    const flutterwaveSettings = settings.reduce((acc: any, setting) => {
      acc[setting.setting_name] = setting.setting_value
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      settings: flutterwaveSettings,
    })
  } catch (error) {
    console.error("Flutterwave settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { flutterwave_secret_key, flutterwave_public_key, flutterwave_encryption_key } = await request.json()

    // Update Flutterwave settings
    if (flutterwave_secret_key !== undefined) {
      await sql`
        UPDATE admin_settings 
        SET setting_value = ${flutterwave_secret_key}, updated_at = CURRENT_TIMESTAMP
        WHERE setting_name = 'flutterwave_secret_key'
      `
    }

    if (flutterwave_public_key !== undefined) {
      await sql`
        UPDATE admin_settings 
        SET setting_value = ${flutterwave_public_key}, updated_at = CURRENT_TIMESTAMP
        WHERE setting_name = 'flutterwave_public_key'
      `
    }

    if (flutterwave_encryption_key !== undefined) {
      await sql`
        UPDATE admin_settings 
        SET setting_value = ${flutterwave_encryption_key}, updated_at = CURRENT_TIMESTAMP
        WHERE setting_name = 'flutterwave_encryption_key'
      `
    }

    return NextResponse.json({
      success: true,
      message: "Flutterwave settings updated successfully",
    })
  } catch (error) {
    console.error("Flutterwave settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
