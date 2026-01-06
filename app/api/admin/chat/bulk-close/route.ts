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

    const { conversationIds } = await request.json()

    if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
      return NextResponse.json({ error: "Conversation IDs are required" }, { status: 400 })
    }

    // Close all conversations
    for (const conversationId of conversationIds) {
      // Check if conversation exists and is open
      const conversation = await sql`
        SELECT status FROM chat_conversations WHERE id = ${conversationId}
      `

      if (conversation.length === 0) continue
      if (conversation[0].status === "closed") continue

      // Close conversation
      await sql`
        UPDATE chat_conversations 
        SET status = 'closed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${conversationId}
      `

      // Send closing message
      await sql`
        INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message, created_at)
        VALUES (${conversationId}, 'admin', ${decoded.userId}, 'This conversation has been closed. If you need further assistance, please start a new chat.', CURRENT_TIMESTAMP)
      `
    }

    return NextResponse.json({ success: true, closedCount: conversationIds.length })
  } catch (error) {
    console.error("Error bulk closing conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
