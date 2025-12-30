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

    const admin = await getUserFromToken(token)
    if (!admin || !admin.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await sql`
      SELECT id, first_name, last_name, email FROM users WHERE id = ${userId}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if there's already an open conversation with this user
    let conversation = await sql`
      SELECT * FROM chat_conversations 
      WHERE user_id = ${userId} AND status = 'open'
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (conversation.length === 0) {
      // Create new conversation
      conversation = await sql`
        INSERT INTO chat_conversations (user_id, status, admin_responded)
        VALUES (${userId}, 'open', true)
        RETURNING *
      `
    }

    // Send initial admin message
    await sql`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message, created_at)
      VALUES (${conversation[0].id}, 'admin', ${admin.id}, 'Hello! This is FLASHBOT Support. How can we help you today?', CURRENT_TIMESTAMP)
    `

    // Update conversation timestamp
    await sql`
      UPDATE chat_conversations 
      SET updated_at = CURRENT_TIMESTAMP, admin_responded = true
      WHERE id = ${conversation[0].id}
    `

    return NextResponse.json({
      success: true,
      conversation: conversation[0],
      message: "Chat started successfully",
    })
  } catch (error) {
    console.error("Error starting chat:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
