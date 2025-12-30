import { NextResponse } from "next/server"
import { getBankList } from "@/lib/flutterwave-bank"

export async function GET() {
  try {
    const response = await getBankList()

    if (response.status === "success") {
      return NextResponse.json({
        success: true,
        banks: response.data,
      })
    } else {
      return NextResponse.json(
        {
          error: "Failed to fetch banks",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Banks API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
