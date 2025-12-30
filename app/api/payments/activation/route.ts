import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import { createVirtualAccountNumber, createBankTransferPayment } from "@/lib/flutterwave-virtual"

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

    if (user.is_active) {
      return NextResponse.json({ error: "Account is already active" }, { status: 400 })
    }

    // Get activation fee from settings
    const settings = await sql`
      SELECT setting_value FROM admin_settings 
      WHERE setting_name = 'activation_fee'
    `

    const activationFee = Number.parseFloat(settings[0]?.setting_value || "35000")
    const reference = `ACTIVATE_${user.id}_${Date.now()}`
    const customerName = `${user.first_name} ${user.last_name}`

    console.log("Creating virtual account for activation:", {
      email: "app@flbapp.co",
      amount: activationFee,
      reference,
      customerName,
    })

    // Store payment reference in database first
    await sql`
      INSERT INTO transactions (
        user_id, type, amount, status, description, reference
      ) VALUES (
        ${user.id}, 'activation', ${activationFee}, 'pending', 
        'Account activation payment', ${reference}
      )
    `

    try {
      // Try virtual account number creation first
      const virtualAccountResponse = await createVirtualAccountNumber(
        "app@flbapp.co",
        activationFee,
        reference,
        customerName,
        user.phone || "08012345678",
      )

      console.log("Virtual account creation response:", virtualAccountResponse)

      if (virtualAccountResponse.status === "success" && virtualAccountResponse.data) {
        const accountData = virtualAccountResponse.data

        return NextResponse.json({
          success: true,
          reference: reference,
          amount: activationFee,
          account_number: accountData.account_number,
          account_name: accountData.account_name,
          bank_name: accountData.bank_name,
          expires_at: accountData.expires_at,
          flw_ref: accountData.flw_ref,
          payment_type: "virtual_account",
        })
      }
    } catch (virtualAccountError) {
      console.log("Virtual account creation failed, trying payment link:", virtualAccountError)

      // Fallback to payment link method
      try {
        const paymentResponse = await createBankTransferPayment(
          "app@flbapp.co",
          activationFee,
          reference,
          customerName,
          user.phone || "08012345678",
        )

        console.log("Bank transfer payment response:", paymentResponse)

        if (paymentResponse.status === "success" && paymentResponse.data && paymentResponse.data.link) {
          return NextResponse.json({
            success: true,
            reference: reference,
            amount: activationFee,
            payment_link: paymentResponse.data.link,
            account_number: "Available on payment page",
            account_name: "BST array",
            bank_name: "Multiple Banks Available",
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            flw_ref: paymentResponse.data.id,
            payment_type: "bank_transfer_link",
          })
        }
      } catch (paymentError) {
        console.error("Payment link creation also failed:", paymentError)
      }
    }

    // If both methods fail, delete the transaction and return error
    await sql`
      DELETE FROM transactions 
      WHERE reference = ${reference} AND user_id = ${user.id}
    `

    return NextResponse.json(
      {
        error: "Failed to create payment method. Please try again or contact support.",
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Activation payment error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
