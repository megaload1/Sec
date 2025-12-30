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

    // Check if countdown has ended
    if (!user.registration_countdown_end) {
      return NextResponse.json({ error: "No countdown active" }, { status: 400 })
    }

    const countdownEnd = new Date(user.registration_countdown_end)
    const now = new Date()

    if (now < countdownEnd) {
      return NextResponse.json({ error: "Countdown not yet complete" }, { status: 400 })
    }

    // Use a more specific check to prevent duplicate bonuses
    const existingBonus = await sql`
      SELECT id FROM transactions 
      WHERE user_id = ${user.id} 
      AND type = 'credit' 
      AND (description LIKE '%Registration bonus%' OR description LIKE '%Welcome bonus%')
      AND status = 'completed'
      LIMIT 1
    `

    if (existingBonus.length > 0) {
      console.log("Bonus already credited for user:", user.id)

      // Clear the countdown even if bonus was already credited
      await sql`
        UPDATE users 
        SET registration_countdown_end = NULL 
        WHERE id = ${user.id}
      `

      return NextResponse.json({
        success: true,
        message: "Welcome bonus already credited",
        alreadyCredited: true,
        show_reload_button: true,
      })
    }

    // Get registration bonus amount from admin settings
    const bonusSettings = await sql`
      SELECT setting_value FROM admin_settings 
      WHERE setting_name = 'registration_bonus'
    `

    const bonusAmount = bonusSettings.length > 0 ? Number.parseFloat(bonusSettings[0].setting_value) : 300

    // Start database transaction to ensure atomicity
    await sql`BEGIN`

    try {
      // First, mark that we're processing the bonus by clearing countdown
      await sql`
        UPDATE users 
        SET registration_countdown_end = NULL 
        WHERE id = ${user.id}
      `

      // Double-check no bonus was created during this transaction
      const doubleCheck = await sql`
        SELECT id FROM transactions 
        WHERE user_id = ${user.id} 
        AND type = 'credit' 
        AND (description LIKE '%Registration bonus%' OR description LIKE '%Welcome bonus%')
        AND status = 'completed'
        LIMIT 1
      `

      if (doubleCheck.length > 0) {
        await sql`ROLLBACK`
        return NextResponse.json({
          success: true,
          message: "Welcome bonus already credited",
          alreadyCredited: true,
          show_reload_button: true,
        })
      }

      // Create unique reference to prevent duplicates
      const uniqueRef = `WELCOME_BONUS_${user.id}_${Date.now()}`

      // Credit the bonus amount
      await sql`
        UPDATE users 
        SET wallet_balance = wallet_balance + ${bonusAmount}
        WHERE id = ${user.id}
      `

      // Create transaction record with unique reference
      await sql`
        INSERT INTO transactions (
          user_id, type, amount, status, description, reference
        ) VALUES (
          ${user.id}, 'credit', ${bonusAmount}, 'completed', 
          'Registration bonus - Welcome to Flashbot!', ${uniqueRef}
        )
      `

      await sql`COMMIT`

      console.log(`Welcome bonus of ₦${bonusAmount} credited successfully to user ${user.id}`)

      // Get updated user balance
      const updatedUser = await sql`
        SELECT wallet_balance FROM users WHERE id = ${user.id}
      `

      return NextResponse.json({
        success: true,
        message: `Welcome bonus of ₦${bonusAmount} credited successfully!`,
        bonusAmount: bonusAmount,
        newBalance: updatedUser[0].wallet_balance,
        show_reload_button: true,
      })
    } catch (error) {
      await sql`ROLLBACK`
      console.error("Transaction failed:", error)
      throw error
    }
  } catch (error) {
    console.error("Countdown complete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
