import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userId = Number.parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Check if user exists and is not an admin
    const targetUsers = await sql`
      SELECT id, is_admin FROM users WHERE id = ${userId}
    `

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (targetUsers[0].is_admin) {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 })
    }

    // Start transaction
    await sql`BEGIN`

    try {
      // Delete user transactions first
      await sql`DELETE FROM transactions WHERE user_id = ${userId}`

      // Delete user
      await sql`DELETE FROM users WHERE id = ${userId}`

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: "User deleted successfully",
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
