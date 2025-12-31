import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const settings = await sql`
      SELECT setting_name, setting_value FROM admin_settings
      WHERE setting_name IN ('upgrade_notification_enabled', 'upgrade_completion_time')
    `

    const settingsObj = settings.reduce((acc: any, setting) => {
      acc[setting.setting_name] = setting.setting_value
      return acc
    }, {})

    return NextResponse.json({
      upgrade_notification_enabled: settingsObj.upgrade_notification_enabled === "true",
      upgrade_completion_time: settingsObj.upgrade_completion_time || "",
    })
  } catch (error) {
    console.error("Upgrade status error:", error)
    return NextResponse.json(
      {
        upgrade_notification_enabled: false,
        upgrade_completion_time: "",
      },
      { status: 200 },
    )
  }
}
