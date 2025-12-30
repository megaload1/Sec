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

    const userId = decoded.userId

    // Get or create conversation for user
    let conversation = await sql`
      SELECT * FROM chat_conversations 
      WHERE user_id = ${userId} AND status = 'open'
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (conversation.length === 0) {
      // Create new conversation
      conversation = await sql`
        INSERT INTO chat_conversations (user_id, status)
        VALUES (${userId}, 'open')
        RETURNING *
      `
    }

    // Get messages with proper user data
    const messages = await sql`
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
      WHERE cm.conversation_id = ${conversation[0].id}
      ORDER BY cm.created_at ASC
    `

    return NextResponse.json({
      conversation: conversation[0],
      messages: messages,
    })
  } catch (error) {
    console.error("Error fetching conversation:", error)
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

    const { message } = await request.json()
    const userId = decoded.userId

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get or create conversation
    let conversation = await sql`
      SELECT * FROM chat_conversations 
      WHERE user_id = ${userId} AND status = 'open'
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (conversation.length === 0) {
      conversation = await sql`
        INSERT INTO chat_conversations (user_id, status)
        VALUES (${userId}, 'open')
        RETURNING *
      `
    }

    // Get user info for proper message display
    const user = await sql`
      SELECT first_name, last_name FROM users WHERE id = ${userId}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Insert user message with proper timestamp
    const newMessage = await sql`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message, created_at)
      VALUES (${conversation[0].id}, 'user', ${userId}, ${message.trim()}, CURRENT_TIMESTAMP)
      RETURNING *, CURRENT_TIMESTAMP as created_at
    `

    // Add user info to the message response
    const messageWithUser = {
      ...newMessage[0],
      first_name: user[0].first_name,
      last_name: user[0].last_name,
    }

    // Update the bot response logic to check for bot_responded
    if (!conversation[0].admin_responded && !conversation[0].bot_responded) {
      setTimeout(async () => {
        try {
          const updatedConv = await sql`
            SELECT admin_responded FROM chat_conversations WHERE id = ${conversation[0].id}
          `

          if (!updatedConv[0]?.admin_responded) {
            await sql`
              INSERT INTO chat_messages (conversation_id, sender_type, message, created_at)
              VALUES (${conversation[0].id}, 'bot', 'Hello! Thank you for contacting FLASHBOT Support. Our team will respond to your message shortly. We are here to help you 24/7.', CURRENT_TIMESTAMP)
            `

            await sql`
              UPDATE chat_conversations 
              SET bot_responded = true, updated_at = CURRENT_TIMESTAMP
              WHERE id = ${conversation[0].id}
            `
          }
        } catch (error) {
          console.error("Error sending bot response:", error)
        }
      }, 10000)
    }

    return NextResponse.json({ message: messageWithUser })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
