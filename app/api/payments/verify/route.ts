import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import { verifyPayment, getTransactionStatus } from "@/lib/flutterwave-bank"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { transactionId, reference, type } = await request.json()

    if ((!transactionId && !reference) || !type) {
      return NextResponse.json({ error: "Missing transaction ID/reference or type" }, { status: 400 })
    }

    // Get transaction from database
    const transactions = await sql`
      SELECT * FROM transactions 
      WHERE reference = ${reference || transactionId} AND user_id = ${user.id}
    `

    if (transactions.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const transaction = transactions[0]

    // Verify payment with Flutterwave
    let paymentData
    try {
      if (transactionId) {
        paymentData = await verifyPayment(transactionId)
      } else {
        paymentData = await getTransactionStatus(reference)
      }
    } catch (error) {
      console.error("Payment verification failed:", error)
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    console.log("Payment verification data:", paymentData)

    if (paymentData.status === "success" && paymentData.data.status === "successful") {
      const amount = paymentData.data.amount

      // Start database transaction
      await sql`BEGIN`

      try {
        if (type === "activation") {
          // Activate user account
          await sql`
            UPDATE users 
            SET is_active = true
            WHERE id = ${user.id}
          `

          // Update transaction status
          await sql`
            UPDATE transactions 
            SET status = 'completed'
            WHERE reference = ${reference || transactionId} AND user_id = ${user.id}
          `

          await sql`COMMIT`

          return NextResponse.json({
            success: true,
            message: "Account activated successfully! You can now send money and access all features.",
          })
        } else if (type === "topup") {
          // Get the credit amount from transaction description or use the transaction amount
          const creditAmount = transaction.amount

          console.log("Processing topup verification:", {
            userId: user.id,
            transactionAmount: transaction.amount,
            creditAmount: creditAmount,
            paymentAmount: paymentData.data.amount,
          })

          // Credit user wallet with the credit amount (not payment amount)
          await sql`
            UPDATE users 
            SET wallet_balance = wallet_balance + ${creditAmount}
            WHERE id = ${user.id}
          `

          // Update transaction status
          await sql`
            UPDATE transactions 
            SET status = 'completed'
            WHERE reference = ${reference || transactionId} AND user_id = ${user.id}
          `

          await sql`COMMIT`

          console.log("Topup completed successfully:", {
            userId: user.id,
            creditedAmount: creditAmount,
          })

          return NextResponse.json({
            success: true,
            message: `₦${creditAmount.toLocaleString()} has been added to your wallet successfully!`,
          })
        } else {
          await sql`ROLLBACK`
          return NextResponse.json({ error: "Invalid payment type" }, { status: 400 })
        }
      } catch (error) {
        await sql`ROLLBACK`
        throw error
      }
    } else {
      return NextResponse.json(
        {
          error: "Payment not successful or still pending",
          status: paymentData.data?.status || "unknown",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
