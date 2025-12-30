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

    // Verify admin access
    const user = await sql`SELECT is_admin FROM users WHERE id = ${decoded.userId}`
    if (!user[0]?.is_admin) {
      return NextResponse.json({ error: "Support access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const lastMessageId = searchParams.get("lastMessageId")

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    // Get messages with proper user data
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

    // Mark admin messages as read
    await sql`
      UPDATE chat_messages 
      SET is_read = true 
      WHERE conversation_id = ${conversationId} 
      AND sender_type = 'user'
      AND is_read = false
    `

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching admin messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const user = await sql`SELECT is_admin, first_name, last_name FROM users WHERE id = ${decoded.userId}`
    if (!user[0]?.is_admin) {
      return NextResponse.json({ error: "Support access required" }, { status: 403 })
    }

    const { conversationId, message } = await request.json()

    if (!conversationId || !message || message.trim().length === 0) {
      return NextResponse.json({ error: "Conversation ID and message are required" }, { status: 400 })
    }

    // Insert admin message
    const newMessage = await sql`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message, created_at)
      VALUES (${conversationId}, 'admin', ${decoded.userId}, ${message.trim()}, CURRENT_TIMESTAMP)
      RETURNING *, CURRENT_TIMESTAMP as created_at
    `

    // Mark admin as responded
    await sql`
      UPDATE chat_conversations 
      SET admin_responded = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversationId}
    `

    // Add admin info to the message response
    const messageWithAdmin = {
      ...newMessage[0],
      first_name: user[0].first_name,
      last_name: user[0].last_name,
    }

    return NextResponse.json({ message: messageWithAdmin })
  } catch (error) {
    console.error("Error sending admin message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
