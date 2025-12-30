import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

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

    const { userId, isActive } = await request.json()

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    await sql`
      UPDATE users 
      SET is_active = ${isActive}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    })
  } catch (error) {
    console.error("Update user status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
