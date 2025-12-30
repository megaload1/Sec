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

    // Verify support access
    const user = await sql`SELECT is_admin FROM users WHERE id = ${decoded.userId}`
    if (!user[0]?.is_admin) {
      return NextResponse.json({ error: "Support access required" }, { status: 403 })
    }

    // Get all conversations with user info and unread count
    const conversations = await sql`
      SELECT 
        cc.*,
        u.first_name,
        u.last_name,
        u.email,
        (
          SELECT COUNT(*) 
          FROM chat_messages cm 
          WHERE cm.conversation_id = cc.id 
          AND cm.sender_type = 'user' 
          AND cm.is_read = false
        ) as unread_count,
        (
          SELECT cm.message 
          FROM chat_messages cm 
          WHERE cm.conversation_id = cc.id 
          ORDER BY cm.created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT cm.created_at 
          FROM chat_messages cm 
          WHERE cm.conversation_id = cc.id 
          ORDER BY cm.created_at DESC 
          LIMIT 1
        ) as last_message_time
      FROM chat_conversations cc
      JOIN users u ON cc.user_id = u.id
      ORDER BY cc.updated_at DESC
    `

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching admin conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
