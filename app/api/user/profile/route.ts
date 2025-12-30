import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    console.log("UserProfile API: Token received:", token ? "Token exists" : "No token")

    if (!token) {
      console.log("UserProfile API: No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    console.log("UserProfile API: User lookup result:", user ? `User ID: ${user.id}` : "No user found")

    if (!user) {
      console.log("UserProfile API: Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Ensure consistent data types and proper formatting
    const userProfile = {
      id: Number(user.id),
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      walletBalance: Number(user.wallet_balance) || 0,
      isActive: Boolean(user.is_active),
      isAdmin: Boolean(user.is_admin),
      registrationCountdownEnd: user.registration_countdown_end,
      phone: user.phone,
      createdAt: user.created_at,
    }

    console.log("UserProfile API: Returning user data:", {
      id: userProfile.id,
      email: userProfile.email,
      balance: userProfile.walletBalance,
      isActive: userProfile.isActive,
    })

    return NextResponse.json({
      success: true,
      user: userProfile,
    })
  } catch (error) {
    console.error("UserProfile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
