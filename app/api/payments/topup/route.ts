import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

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

    const { amount, payment_method = "card" } = await request.json()

    // Get admin settings for topup amounts and Flutterwave keys
    const settings = await sql`
      SELECT setting_name, setting_value FROM admin_settings 
      WHERE setting_name IN ('topup_payment_amount', 'topup_credit_amount', 'flutterwave_public_key', 'flutterwave_secret_key')
    `

    const settingsMap = settings.reduce((acc: any, setting: any) => {
      acc[setting.setting_name] = setting.setting_value
      return acc
    }, {})

    const paymentAmount = Number.parseFloat(settingsMap.topup_payment_amount || "12500")
    const creditAmount = Number.parseFloat(settingsMap.topup_credit_amount || "200000")
    const publicKey = settingsMap.flutterwave_public_key
    const secretKey = settingsMap.flutterwave_secret_key

    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: "Payment system not configured. Please contact admin." }, { status: 500 })
    }

    // Validate amount
    if (!amount || Number.parseFloat(amount) !== paymentAmount) {
      return NextResponse.json(
        { error: `Invalid amount. Top-up fee is ₦${paymentAmount.toLocaleString()}` },
        { status: 400 },
      )
    }

    // Create transaction reference
    const txRef = `TOPUP_${user.id}_${Date.now()}`

    // Initialize Flutterwave payment
    const flutterwavePayload = {
      tx_ref: txRef,
      amount: paymentAmount,
      currency: "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-callback`,
      payment_options: payment_method === "bank_transfer" ? "banktransfer" : "card,banktransfer",
      customer: {
        email: "app@flbapp.co", // Use app@flbapp.co for all payments
        phone_number: user.phone || "08000000000",
        name: `${user.first_name} ${user.last_name}`,
      },
      customizations: {
        title: "BST array Wallet Top-up",
        description: `Top up your wallet - Pay ₦${paymentAmount.toLocaleString()} get ₦${creditAmount.toLocaleString()}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
      },
      meta: {
        user_id: user.id,
        payment_type: "topup",
        credit_amount: creditAmount,
        user_email: user.email,
      },
    }

    console.log("Flutterwave topup payload:", JSON.stringify(flutterwavePayload, null, 2))

    const flutterwaveResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flutterwavePayload),
    })

    const flutterwaveData = await flutterwaveResponse.json()
    console.log("Flutterwave topup response:", JSON.stringify(flutterwaveData, null, 2))

    if (flutterwaveResponse.ok && flutterwaveData.status === "success") {
      // Store transaction in database
      await sql`
        INSERT INTO transactions (
          user_id, type, amount, status, description, reference
        ) VALUES (
          ${user.id}, 'payment', ${paymentAmount}, 'pending', 
          'Wallet top-up payment', ${txRef}
        )
      `

      return NextResponse.json({
        success: true,
        payment_link: flutterwaveData.data.link,
        reference: txRef,
        amount: paymentAmount,
        credit_amount: creditAmount,
      })
    } else {
      console.error("Flutterwave topup error:", flutterwaveData)
      return NextResponse.json(
        {
          error: flutterwaveData.message || "Failed to initialize payment. Please try again.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Topup payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
