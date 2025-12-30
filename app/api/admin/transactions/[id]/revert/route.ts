import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const transactionId = Number.parseInt(params.id)
    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 })
    }

    // Get transaction details
    const transactions = await sql`
      SELECT t.*, u.is_active as user_is_active 
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ${transactionId}
    `

    if (transactions.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const transaction = transactions[0]

    // Only allow reverting pending transfers for inactive users
    if (transaction.status !== "pending" || transaction.type !== "transfer" || transaction.user_is_active) {
      return NextResponse.json(
        {
          error: "Can only revert pending transfers for inactive users",
        },
        { status: 400 },
      )
    }

    // Start database transaction
    await sql`BEGIN`

    try {
      // Credit back the amount to user's wallet
      await sql`
        UPDATE users 
        SET wallet_balance = wallet_balance + ${transaction.amount}
        WHERE id = ${transaction.user_id}
      `

      // Update transaction status to reverted
      await sql`
        UPDATE transactions 
        SET status = 'reverted', description = CONCAT(description, ' - REVERTED BY ADMIN')
        WHERE id = ${transactionId}
      `

      // Create a reversal transaction record
      await sql`
        INSERT INTO transactions (
          user_id, type, amount, status, description, reference
        ) VALUES (
          ${transaction.user_id}, 'credit', ${transaction.amount}, 'completed', 
          'Reversal of transaction #${transactionId}', 'REVERSAL_${transactionId}_${Date.now()}'
        )
      `

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: "Transaction reverted successfully",
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Revert transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
