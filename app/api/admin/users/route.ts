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

    const users = await sql`
      SELECT id, email, first_name, last_name, wallet_balance, is_active, is_admin, created_at
      FROM users
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      users: users,
    })
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
