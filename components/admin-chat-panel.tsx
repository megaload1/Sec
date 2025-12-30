"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, X, Users, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Message {
  id: number
  sender_type: "user" | "admin" | "bot"
  sender_id?: number
  message: string
  created_at: string
  first_name?: string
  last_name?: string
}

interface Conversation {
  id: number
  user_id: number
  status: string
  admin_responded: boolean
  last_message_at: string
  first_name: string
  last_name: string
  email: string
  unread_count: number
  last_message: string
}

export function AdminChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const prevMessageCountRef = useRef(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleScroll = () => {
    if (!messagesContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    isAtBottomRef.current = isAtBottom
  }

  useEffect(() => {
    const hasNewMessages = messages.length > prevMessageCountRef.current
    if (hasNewMessages && isAtBottomRef.current) {
      scrollToBottom()
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  useEffect(() => {
    if (selectedConversation) {
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(selectedConversation.id)
      }, 3000)

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }
      }
    }
  }, [selectedConversation])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 10000) // Refresh conversations every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) return

      const response = await fetch("/api/admin/chat/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) return

      const response = await fetch(`/api/admin/chat/messages?conversationId=${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
        isAtBottomRef.current = true
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || loading || !selectedConversation) return

    setLoading(true)
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) return

      const response = await fetch("/api/admin/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          message: newMessage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
        setTimeout(() => scrollToBottom(), 0)
        fetchConversations() // Refresh conversations list
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const closeConversation = async (conversationId: number) => {
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) return

      const response = await fetch("/api/admin/chat/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId }),
      })

      if (response.ok) {
        fetchConversations()
        if (selectedConversation?.id === conversationId) {
          fetchMessages(conversationId)
        }
      }
    } catch (error) {
      console.error("Error closing conversation:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }

  const getSenderName = (message: Message) => {
    if (message.sender_type === "user") {
      return message.first_name && message.last_name ? `${message.first_name} ${message.last_name}` : "User"
    }
    if (message.sender_type === "bot") return "FLASHBOT Assistant"
    if (message.sender_type === "admin") {
      return message.first_name && message.last_name ? `${message.first_name} ${message.last_name}` : "Support"
    }
    return "Support"
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      }
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString()
      }
      return date.toLocaleDateString()
    } catch (error) {
      return new Date().toLocaleDateString()
    }
  }

  const openConversations = conversations.filter((c) => c.status === "open")
  const closedConversations = conversations.filter((c) => c.status === "closed")

  return (
    <Card className="bg-gray-800 border-gray-700 h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-400" />
          Live Chat Support
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{openConversations.length} Active</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div className="w-1/3 flex flex-col min-h-0">
          <Tabs defaultValue="open" className="flex-1 flex flex-col">
            <TabsList className="bg-gray-700 border-gray-600">
              <TabsTrigger value="open" className="data-[state=active]:bg-gray-600">
                Open ({openConversations.length})
              </TabsTrigger>
              <TabsTrigger value="closed" className="data-[state=active]:bg-gray-600">
                Closed ({closedConversations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="flex-1 overflow-y-auto mt-2">
              <div className="space-y-2">
                {openConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? "bg-blue-600/20 border border-blue-500/30"
                        : "bg-gray-700/50 hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium text-sm">
                        {conversation.first_name} {conversation.last_name}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge className="bg-red-500 text-white text-xs px-1 py-0">{conversation.unread_count}</Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mb-1">{conversation.email}</p>
                    <p className="text-gray-300 text-xs truncate">{conversation.last_message || "No messages yet"}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-gray-500 text-xs">{formatDate(conversation.last_message_at)}</p>
                      {!conversation.admin_responded && (
                        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">New</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {openConversations.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No active conversations</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="closed" className="flex-1 overflow-y-auto mt-2">
              <div className="space-y-2">
                {closedConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? "bg-blue-600/20 border border-blue-500/30"
                        : "bg-gray-700/50 hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium text-sm">
                        {conversation.first_name} {conversation.last_name}
                      </p>
                      <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs">Closed</Badge>
                    </div>
                    <p className="text-gray-400 text-xs mb-1">{conversation.email}</p>
                    <p className="text-gray-300 text-xs truncate">{conversation.last_message || "No messages yet"}</p>
                    <div className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(conversation.last_message_at)}
                    </div>
                  </div>
                ))}
                {closedConversations.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No closed conversations</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg mb-3">
                <div>
                  <p className="text-white font-medium">
                    {selectedConversation.first_name} {selectedConversation.last_name}
                  </p>
                  <p className="text-gray-400 text-sm">{selectedConversation.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      selectedConversation.status === "open"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    }
                  >
                    {selectedConversation.status}
                  </Badge>
                  {selectedConversation.status === "open" && (
                    <Button
                      onClick={() => closeConversation(selectedConversation.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-700"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Close
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.sender_type === "admin"
                          ? "bg-blue-600 text-white"
                          : message.sender_type === "bot"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-600 text-white"
                      }`}
                    >
                      <div className="text-xs opacity-75 mb-1">{getSenderName(message)}</div>
                      <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                      <div className="text-xs opacity-75 mt-1">{formatTime(message.created_at)}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedConversation.status === "open" && (
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
