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

    // Get admin settings for activation fee and Flutterwave keys
    const settings = await sql`
      SELECT setting_name, setting_value FROM admin_settings 
      WHERE setting_name IN ('activation_fee', 'flutterwave_public_key', 'flutterwave_secret_key')
    `

    const settingsMap = settings.reduce((acc: any, setting: any) => {
      acc[setting.setting_name] = setting.setting_value
      return acc
    }, {})

    const activationFee = Number.parseFloat(settingsMap.activation_fee || "35000")
    const publicKey = settingsMap.flutterwave_public_key
    const secretKey = settingsMap.flutterwave_secret_key

    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: "Payment system not configured. Please contact admin." }, { status: 500 })
    }

    // Validate amount
    if (!amount || Number.parseFloat(amount) !== activationFee) {
      return NextResponse.json(
        { error: `Invalid amount. Activation fee is ₦${activationFee.toLocaleString()}` },
        { status: 400 },
      )
    }

    // Create transaction reference
    const txRef = `ACTIVATE_${user.id}_${Date.now()}`

    // Initialize Flutterwave payment
    const flutterwavePayload = {
      tx_ref: txRef,
      amount: activationFee,
      currency: "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-callback`,
      payment_options: payment_method === "bank_transfer" ? "banktransfer" : "card,banktransfer",
      customer: {
        email: "app@flbapp.co", // Use app@flbapp.co for all payments
        phone_number: user.phone || "08000000000",
        name: `${user.first_name} ${user.last_name}`,
      },
      customizations: {
        title: "BST array Account Activation",
        description: `Activate your BST array account - ₦${activationFee.toLocaleString()}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
      },
      meta: {
        user_id: user.id,
        payment_type: "activation",
        user_email: user.email,
      },
    }

    console.log("Flutterwave activation payload:", JSON.stringify(flutterwavePayload, null, 2))

    const flutterwaveResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flutterwavePayload),
    })

    const flutterwaveData = await flutterwaveResponse.json()
    console.log("Flutterwave activation response:", JSON.stringify(flutterwaveData, null, 2))

    if (flutterwaveResponse.ok && flutterwaveData.status === "success") {
      // Store transaction in database
      await sql`
        INSERT INTO transactions (
          user_id, type, amount, status, description, reference
        ) VALUES (
          ${user.id}, 'payment', ${activationFee}, 'pending', 
          'Account activation payment', ${txRef}
        )
      `

      return NextResponse.json({
        success: true,
        payment_link: flutterwaveData.data.link,
        reference: txRef,
        amount: activationFee,
      })
    } else {
      console.error("Flutterwave activation error:", flutterwaveData)
      return NextResponse.json(
        {
          error: flutterwaveData.message || "Failed to initialize payment. Please try again.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Activation payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
