import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"

export async function PUT(request: NextRequest) {
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

    const { userId, amount, type } = await request.json()

    if (!userId || !amount || !type || (type !== "credit" && type !== "debit")) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Start transaction
    await sql`BEGIN`

    try {
      // Update wallet balance
      if (type === "credit") {
        await sql`
          UPDATE users 
          SET wallet_balance = wallet_balance + ${amountValue}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
        `
      } else {
        await sql`
          UPDATE users 
          SET wallet_balance = GREATEST(wallet_balance - ${amountValue}, 0), updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
        `
      }

      // Create transaction record
      const reference = `ADMIN_${type.toUpperCase()}_${userId}_${Date.now()}`
      await sql`
        INSERT INTO transactions (
          user_id, type, amount, status, description, reference
        ) VALUES (
          ${userId}, ${type}, ${amountValue}, 'completed', 
          'Admin wallet ${type}', ${reference}
        )
      `

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: `Wallet ${type}ed successfully`,
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Update wallet error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
