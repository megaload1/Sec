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

    // Get ALL transactions without limit
    const transactions = await sql`
      SELECT 
        t.*,
        u.first_name,
        u.last_name,
        u.email,
        u.is_active as user_is_active
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `

    // Calculate proper statistics
    const totalSent = transactions
      .filter((t) => (t.type === "transfer" || t.type === "debit") && t.status === "completed")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const totalReceived = transactions
      .filter((t) => t.type === "credit" && t.status === "completed")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const pendingTransactions = transactions.filter((t) => t.status === "pending").length

    return NextResponse.json({
      success: true,
      transactions: transactions,
      stats: {
        total_transactions: transactions.length,
        total_sent: totalSent,
        total_received: totalReceived,
        pending_transactions: pendingTransactions,
      },
    })
  } catch (error) {
    console.error("Admin transactions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
