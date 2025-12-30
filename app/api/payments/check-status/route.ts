import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import { checkPaymentStatus } from "@/lib/flutterwave-virtual"

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

    const { reference, type } = await request.json()

    if (!reference || !type) {
      return NextResponse.json({ error: "Missing reference or type" }, { status: 400 })
    }

    console.log(`Checking payment status for ${reference} (${type})`)

    // Check local transaction status first
    const localTransaction = await sql`
      SELECT * FROM transactions 
      WHERE reference = ${reference} AND user_id = ${user.id}
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (localTransaction.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const transaction = localTransaction[0]

    // If already completed locally, return success
    if (transaction.status === "completed") {
      return NextResponse.json({
        success: true,
        status: "completed",
        message: type === "activation" ? "Account activated successfully!" : "Wallet topped up successfully!",
      })
    }

    try {
      // Check with Flutterwave
      const flutterwaveResponse = await checkPaymentStatus(reference)
      console.log("Flutterwave payment status:", flutterwaveResponse)

      if (flutterwaveResponse.status === "success" && flutterwaveResponse.data) {
        const paymentData = flutterwaveResponse.data

        // Check if payment is successful
        if (paymentData.status === "successful" && paymentData.amount_settled > 0) {
          console.log("Payment confirmed by Flutterwave, processing...")

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
              SET status = 'completed', description = 'Account activation - Completed'
              WHERE reference = ${reference} AND user_id = ${user.id}
            `

            return NextResponse.json({
              success: true,
              status: "completed",
              message: "Account activated successfully!",
            })
          } else if (type === "topup") {
            // Get credit amount from admin settings
            const settings = await sql`
              SELECT setting_value FROM admin_settings 
              WHERE setting_name = 'topup_credit_amount'
            `

            const creditAmount = Number.parseFloat(settings[0]?.setting_value || "200000")

            // Credit user wallet
            await sql`
              UPDATE users 
              SET wallet_balance = wallet_balance + ${creditAmount}
              WHERE id = ${user.id}
            `

            // Update transaction status
            await sql`
              UPDATE transactions 
              SET status = 'completed', description = 'Wallet topup - Completed'
              WHERE reference = ${reference} AND user_id = ${user.id}
            `

            // Create credit transaction record
            await sql`
              INSERT INTO transactions (
                user_id, type, amount, status, description, reference
              ) VALUES (
                ${user.id}, 'credit', ${creditAmount}, 'completed', 
                'Wallet credit from topup', ${reference + "_CREDIT"}
              )
            `

            return NextResponse.json({
              success: true,
              status: "completed",
              message: `Wallet credited with ₦${creditAmount.toLocaleString()}!`,
            })
          }
        } else {
          // Payment still pending
          return NextResponse.json({
            success: true,
            status: "pending",
            message: "Payment is still being processed. Please wait...",
          })
        }
      } else {
        // Flutterwave API error or payment not found
        return NextResponse.json({
          success: true,
          status: "pending",
          message: "Checking payment status. Please wait...",
        })
      }
    } catch (flutterwaveError) {
      console.error("Flutterwave status check error:", flutterwaveError)

      // Return pending status if Flutterwave check fails
      return NextResponse.json({
        success: true,
        status: "pending",
        message: "Payment verification in progress. Please wait...",
      })
    }
  } catch (error) {
    console.error("Payment status check error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
