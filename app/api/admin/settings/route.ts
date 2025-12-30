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
    console.error("Admin settings API error:", error)
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

    const settings = await request.json()

    // Update each setting including new topup settings
    for (const [key, value] of Object.entries(settings)) {
      await sql`
        INSERT INTO admin_settings (setting_name, setting_value)
        VALUES (${key}, ${value as string})
        ON CONFLICT (setting_name) 
        DO UPDATE SET setting_value = ${value as string}, updated_at = CURRENT_TIMESTAMP
      `
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("Admin settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
