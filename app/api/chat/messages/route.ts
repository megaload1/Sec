import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const lastMessageId = searchParams.get("lastMessageId")

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    // Verify user has access to this conversation
    const userId = decoded.userId
    const conversation = await sql`
      SELECT * FROM chat_conversations 
      WHERE id = ${conversationId} AND user_id = ${userId}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get new messages since lastMessageId with proper user data
    let messages
    if (lastMessageId) {
      messages = await sql`
        SELECT 
          cm.*,
          CASE 
            WHEN cm.sender_type = 'user' THEN u.first_name
            WHEN cm.sender_type = 'admin' THEN au.first_name
            ELSE NULL
          END as first_name,
          CASE 
            WHEN cm.sender_type = 'user' THEN u.last_name
            WHEN cm.sender_type = 'admin' THEN au.last_name
            ELSE NULL
          END as last_name
        FROM chat_messages cm
        LEFT JOIN users u ON cm.sender_id = u.id AND cm.sender_type = 'user'
        LEFT JOIN users au ON cm.sender_id = au.id AND cm.sender_type = 'admin'
        WHERE cm.conversation_id = ${conversationId} AND cm.id > ${lastMessageId}
        ORDER BY cm.created_at ASC
      `
    } else {
      messages = await sql`
        SELECT 
          cm.*,
          CASE 
            WHEN cm.sender_type = 'user' THEN u.first_name
            WHEN cm.sender_type = 'admin' THEN au.first_name
            ELSE NULL
          END as first_name,
          CASE 
            WHEN cm.sender_type = 'user' THEN u.last_name
            WHEN cm.sender_type = 'admin' THEN au.last_name
            ELSE NULL
          END as last_name
        FROM chat_messages cm
        LEFT JOIN users u ON cm.sender_id = u.id AND cm.sender_type = 'user'
        LEFT JOIN users au ON cm.sender_id = au.id AND cm.sender_type = 'admin'
        WHERE cm.conversation_id = ${conversationId}
        ORDER BY cm.created_at ASC
      `
    }

    // Mark messages as read for user
    await sql`
      UPDATE chat_messages 
      SET is_read = true 
      WHERE conversation_id = ${conversationId} 
      AND sender_type != 'user'
      AND is_read = false
    `

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
