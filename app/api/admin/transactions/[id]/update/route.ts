import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await verifyAdminToken(token)
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const transactionId = Number.parseInt(params.id)
    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status, admin_note } = body

    const validStatuses = ["pending", "completed", "failed", "reverted"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    let query = `UPDATE transactions SET status = $1`
    const params_array = [status]
    let paramIndex = 2

    // Only update description if admin_note is provided
    if (admin_note) {
      query += `, description = $${paramIndex}`
      params_array.push(admin_note)
      paramIndex++
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`
    params_array.push(transactionId)

    console.log("[v0] Executing query:", query)
    console.log("[v0] With params:", params_array)

    const result = await sql(query, params_array)

    if (!result || result.length === 0) {
      console.log("[v0] Transaction not found:", transactionId)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    console.log("[v0] Transaction updated successfully:", result[0])
    return NextResponse.json({ transaction: result[0] })
  } catch (error) {
    console.error("[v0] Error updating transaction:", error)
    return NextResponse.json({ error: "Failed to update transaction", details: String(error) }, { status: 500 })
  }
}
