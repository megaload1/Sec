import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

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

    const { bankCode, bankName, accountNumber, accountName, amount } = await request.json()

    if (!bankCode || !bankName || !accountNumber || !accountName || !amount) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (amount > user.wallet_balance) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Generate reference
    const reference = `FBT_${Date.now()}_${user.id}`

    // Start transaction
    await sql`BEGIN`

    try {
      // Deduct from user wallet
      await sql`
        UPDATE users 
        SET wallet_balance = wallet_balance - ${amount}
        WHERE id = ${user.id}
      `

      // Create transaction record
      const status = user.is_active ? "completed" : "pending"
      const description = user.is_active
        ? `Transfer to ${accountName} (${accountNumber})`
        : `Transfer to ${accountName} (${accountNumber}) - Account not activated`

      await sql`
        INSERT INTO transactions (
          user_id, type, amount, recipient_account_number, 
          recipient_account_name, recipient_bank_name, status, description, reference
        ) VALUES (
          ${user.id}, 'transfer', ${amount}, ${accountNumber},
          ${accountName}, ${bankName}, ${status}, ${description}, ${reference}
        )
      `

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: user.is_active ? "Transfer completed successfully" : "Transfer pending - Please activate your account",
        status: status,
        reference: reference,
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Send money error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
