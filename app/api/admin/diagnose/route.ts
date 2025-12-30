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

    // Get all admin settings
    const settings = await sql`
      SELECT setting_name, setting_value, updated_at FROM admin_settings
      ORDER BY setting_name
    `

    // Get recent topup transactions
    const topupTransactions = await sql`
      SELECT id, user_id, amount, description, status, created_at, reference
      FROM transactions 
      WHERE type = 'topup'
      ORDER BY created_at DESC
      LIMIT 10
    `

    // Check if topup settings exist
    const topupPaymentAmount = settings.find((s) => s.setting_name === "topup_payment_amount")
    const topupCreditAmount = settings.find((s) => s.setting_name === "topup_credit_amount")

    const diagnosis = {
      settings_count: settings.length,
      topup_settings: {
        payment_amount: topupPaymentAmount || { error: "NOT_FOUND" },
        credit_amount: topupCreditAmount || { error: "NOT_FOUND" },
      },
      recent_topup_transactions: topupTransactions,
      all_settings: settings,
    }

    return NextResponse.json({
      success: true,
      diagnosis,
    })
  } catch (error) {
    console.error("Diagnosis error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
