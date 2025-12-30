import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Verify admin access
    const user = await sql`SELECT is_admin FROM users WHERE id = ${decoded.userId}`
    if (!user[0]?.is_admin) {
      return NextResponse.json({ error: "Support access required" }, { status: 403 })
    }

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    // Check if conversation is already closed
    const conversation = await sql`
      SELECT status FROM chat_conversations WHERE id = ${conversationId}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (conversation[0].status === "closed") {
      return NextResponse.json({ error: "Conversation is already closed" }, { status: 400 })
    }

    // Close conversation
    await sql`
      UPDATE chat_conversations 
      SET status = 'closed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversationId}
    `

    // Send closing message only once
    await sql`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message, created_at)
      VALUES (${conversationId}, 'admin', ${decoded.userId}, 'This conversation has been closed. If you need further assistance, please start a new chat.', CURRENT_TIMESTAMP)
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error closing conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
