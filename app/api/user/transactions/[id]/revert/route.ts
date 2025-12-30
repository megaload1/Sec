import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const transactionId = Number.parseInt(params.id)
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 })
    }

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 })
    }

    // Get the transaction to revert
    const transaction = await sql`
      SELECT * FROM transactions 
      WHERE id = ${transactionId} AND user_id = ${user.id}
    `

    if (transaction.length === 0) {
      return NextResponse.json({ error: "Transaction not found or access denied" }, { status: 404 })
    }

    const txn = transaction[0]

    // Check if transaction can be reverted
    if (txn.status !== "pending") {
      return NextResponse.json(
        {
          error: "Only pending transactions can be reverted",
          details: `Transaction status is '${txn.status}'`,
        },
        { status: 400 },
      )
    }

    if (txn.type !== "transfer") {
      return NextResponse.json(
        {
          error: "Only transfer transactions can be reverted",
          details: `Transaction type is '${txn.type}'`,
        },
        { status: 400 },
      )
    }

    if (user.is_active) {
      return NextResponse.json(
        {
          error: "Cannot revert transactions for active accounts",
          details: "Your account is already activated",
        },
        { status: 400 },
      )
    }

    // Check if already reverted
    if (txn.description && txn.description.includes("REVERTED")) {
      return NextResponse.json(
        {
          error: "Transaction has already been reverted",
          details: "This transaction was previously reverted",
        },
        { status: 400 },
      )
    }

    // Start database transaction
    await sql`BEGIN`

    try {
      // Update the original transaction to reverted status
      await sql`
        UPDATE transactions 
        SET status = 'reverted', 
            description = CONCAT(COALESCE(description, ''), ' - REVERTED by user')
        WHERE id = ${transactionId}
      `

      // Add the money back to user's wallet
      await sql`
        UPDATE users 
        SET wallet_balance = wallet_balance + ${txn.amount}
        WHERE id = ${user.id}
      `

      // Create a credit transaction for the reversal
      await sql`
        INSERT INTO transactions (
          user_id, type, amount, status, description, reference,
          recipient_account_number, recipient_account_name, recipient_bank_name
        ) VALUES (
          ${user.id}, 'credit', ${txn.amount}, 'completed', 
          'Transaction reversal - Money returned to wallet', 
          CONCAT('REVERT_', COALESCE(${txn.reference}, ${txn.id})),
          ${txn.recipient_account_number}, ${txn.recipient_account_name}, ${txn.recipient_bank_name}
        )
      `

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: `₦${txn.amount.toLocaleString()} has been successfully returned to your wallet`,
        amount_returned: txn.amount,
        transaction_id: transactionId,
      })
    } catch (error) {
      await sql`ROLLBACK`
      console.error("Database transaction failed:", error)
      throw new Error("Failed to process transaction reversal")
    }
  } catch (error) {
    console.error("Transaction revert error:", error)

    // Return more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Transaction reversal failed",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: "An unexpected error occurred while processing your request",
      },
      { status: 500 },
    )
  }
}
