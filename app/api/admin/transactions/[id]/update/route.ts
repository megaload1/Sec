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

    // Validate status
    const validStatuses = ["pending", "completed", "failed", "reverted"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update transaction
    const result = await sql(
      `UPDATE transactions 
       SET status = $1, description = CASE WHEN $2 IS NOT NULL THEN $2 ELSE description END
       WHERE id = $3
       RETURNING *`,
      [status, admin_note || null, transactionId],
    )

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ transaction: result[0] })
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}
