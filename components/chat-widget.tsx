"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  status: string
  admin_responded: boolean
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
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
    if (!isOpen) return

    const hasNewMessages = messages.length > prevMessageCountRef.current
    if (hasNewMessages && isAtBottomRef.current) {
      scrollToBottom()
    }
    prevMessageCountRef.current = messages.length
  }, [messages, isOpen])

  const fetchConversation = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) return

      const response = await fetch("/api/chat/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversation(data.conversation)
        setMessages(data.messages)

        const unread = data.messages.filter(
          (msg: Message) => (msg.sender_type === "admin" || msg.sender_type === "bot") && !isOpen,
        ).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error("Error fetching conversation:", error)
    }
  }

  const pollForNewMessages = async () => {
    if (!conversation || !isOpen) return

    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) return

      const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : 0

      const response = await fetch(
        `/api/chat/messages?conversationId=${conversation.id}&lastMessageId=${lastMessageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        if (data.messages.length > 0) {
          setMessages((prev) => [...prev, ...data.messages])
        }
      }
    } catch (error) {
      console.error("Error polling messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return

    setLoading(true)
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) return

      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")

        setTimeout(() => scrollToBottom(), 0)

        if (!conversation) {
          await fetchConversation()
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const openChat = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setUnreadCount(0)
    isAtBottomRef.current = true

    if (conversation?.status === "closed") {
      setConversation(null)
      setMessages([])
    }

    fetchConversation()
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const minimizeChat = () => {
    setIsMinimized(true)
  }

  useEffect(() => {
    if (isOpen && conversation) {
      pollIntervalRef.current = setInterval(pollForNewMessages, 2000)
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }
      }
    }
  }, [isOpen, conversation, messages])

  useEffect(() => {
    fetchConversation()
  }, [])

  const getSenderName = (message: Message) => {
    if (message.sender_type === "user") return "You"
    if (message.sender_type === "bot") return "FLASHBOT Assistant"
    if (message.sender_type === "admin") {
      return message.first_name && message.last_name ? `${message.first_name} ${message.last_name}` : "Support"
    }
    return "Support"
  }

  const getSenderColor = (message: Message) => {
    if (message.sender_type === "user") return "bg-blue-600"
    if (message.sender_type === "bot") return "bg-purple-600"
    if (message.sender_type === "admin") return "bg-green-600"
    return "bg-gray-600"
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

  return (
    <>
      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-20 right-4 z-50 w-80 h-96 max-h-[80vh]"
          >
            <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    FLASHBOT Support
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Online</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={minimizeChat}
                      className="text-gray-400 hover:text-white p-1 h-6 w-6"
                    >
                      <Minimize2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeChat}
                      className="text-gray-400 hover:text-white p-1 h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-3 min-h-0">
                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0"
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                      <p>Start a conversation with our support team!</p>
                      <p className="text-xs mt-1">We're here to help you 24/7</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            message.sender_type === "user"
                              ? "bg-blue-600 text-white"
                              : message.sender_type === "bot"
                                ? "bg-purple-600 text-white"
                                : "bg-green-600 text-white"
                          }`}
                        >
                          <div className="text-xs opacity-75 mb-1">{getSenderName(message)}</div>
                          <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                          <div className="text-xs opacity-75 mt-1">{formatTime(message.created_at)}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2 flex-shrink-0">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
                    disabled={loading || conversation?.status === "closed"}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim() || conversation?.status === "closed"}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {conversation?.status === "closed" && (
                  <div className="text-center text-yellow-400 text-xs mt-2">
                    This conversation has been closed. Click the chat button to start a new conversation.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Chat */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-20 right-4 z-50"
          >
            <Button
              onClick={() => setIsMinimized(false)}
              className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 px-4 py-2 rounded-lg shadow-lg"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Support Chat
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">{unreadCount}</Badge>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button with Revolving Text */}
      {!isOpen && !isMinimized && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="fixed bottom-4 right-4 z-50">
          <div className="relative">
            {/* Revolving Text */}
            <div className="absolute inset-0 w-20 h-20 pointer-events-none">
              <svg className="w-full h-full animate-spin" style={{ animationDuration: "8s" }}>
                <defs>
                  <path id="circle-path" d="M 40 40 m -30 0 a 30 30 0 1 1 60 0 a 30 30 0 1 1 -60 0" />
                </defs>
                <text className="text-[8px] fill-green-400 font-medium tracking-wider">
                  <textPath href="#circle-path" startOffset="0%">
                    LIVE CHAT • LIVE CHAT • LIVE CHAT •
                  </textPath>
                </text>
              </svg>
            </div>

            {/* Chat Button */}
            <Button
              onClick={openChat}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 shadow-lg relative z-10 transition-all duration-300 hover:scale-110"
            >
              <MessageCircle className="w-6 h-6" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 py-0 min-w-[20px] h-5 z-20">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </>
  )
}
