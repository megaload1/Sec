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

    let result
    if (admin_note) {
      result = await sql`
        UPDATE transactions 
        SET status = ${status}, description = ${admin_note}
        WHERE id = ${transactionId}
        RETURNING *
      `
    } else {
      result = await sql`
        UPDATE transactions 
        SET status = ${status}
        WHERE id = ${transactionId}
        RETURNING *
      `
    }

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ transaction: result[0], message: "Transaction updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating transaction:", error)
    return NextResponse.json({ error: "Failed to update transaction", details: String(error) }, { status: 500 })
  }
}
