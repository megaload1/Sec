import { type NextRequest, NextResponse } from "next/server"
import { verifyAccountNumber } from "@/lib/flutterwave-bank"

export async function POST(request: NextRequest) {
  try {
    const { accountNumber, bankCode } = await request.json()

    // Validate input parameters
    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        {
          error: "Account number and bank code are required",
        },
        { status: 400 },
      )
    }

    // Validate account number format
    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        {
          error: "Account number must be exactly 10 digits",
        },
        { status: 400 },
      )
    }

    // Validate bank code format
    if (!bankCode || bankCode.length < 3) {
      return NextResponse.json(
        {
          error: "Please select a valid bank",
        },
        { status: 400 },
      )
    }

    const response = await verifyAccountNumber(accountNumber, bankCode)

    if (response.status === "success" && response.data) {
      return NextResponse.json({
        success: true,
        account_name: response.data.account_name,
        account_number: response.data.account_number,
      })
    } else {
      // Handle specific Flutterwave error responses
      const errorMessage = response.message || "Account verification failed"

      if (
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.errorMessage().includes("not found") ||
        errorMessage.errorMessage().includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error: "Invalid account number or bank combination. Please check and try again.",
          },
          { status: 400 },
        )
      }

      if (errorMessage.errorMessage().includes("network") || errorMessage.errorMessage().includes("timeout")) {
        return NextResponse.json(
          {
            error: "Network error occurred. Please check your connection and try again.",
          },
          { status: 503 },
        )
      }

      return NextResponse.json(
        {
          error: "Account could not be verified. Please check the account details and try again.",
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("Account verification error:", error)

    // Handle specific error types
    if (error.message?.includes("Flutterwave API keys not configured")) {
      return NextResponse.json(
        {
          error: "Service temporarily unavailable. Please try again later.",
        },
        { status: 503 },
      )
    }

    if (error.message?.includes("fetch") || error.message?.includes("network")) {
      return NextResponse.json(
        {
          error: "Network connection failed. Please check your internet and try again.",
        },
        { status: 503 },
      )
    }

    if (error.message?.includes("timeout")) {
      return NextResponse.json(
        {
          error: "Request timed out. Please try again.",
        },
        { status: 408 },
      )
    }

    // Generic fallback for unknown errors
    return NextResponse.json(
      {
        error: "Account verification failed. Please try again or contact support if the problem persists.",
      },
      { status: 400 },
    )
  }
}
