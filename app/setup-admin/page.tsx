"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SetupAdmin() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [setupKey, setSetupKey] = useState("")

  const createAdmin = async () => {
    if (!setupKey.trim()) {
      setMessage("❌ Please enter the setup key")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      console.log("[v0] Attempting to create admin with setup key")

      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupKey }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Admin created successfully:", data.user)
        setMessage("✅ Admin user created successfully! You can now login with admin@flashbot.com / flashbot123")
        setSetupKey("")
      } else {
        console.log("[v0] Admin creation failed:", data.error)
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Setup error:", error)
      setMessage("❌ Network error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && setupKey && !loading) {
      createAdmin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-center">Admin Setup</CardTitle>
          <p className="text-gray-400 text-sm text-center mt-2">Initialize the admin account for FLASHBOT</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
            <p className="text-blue-300 text-xs">
              This one-time setup creates the admin account with email: <strong>admin@flashbot.com</strong> and
              password: <strong>flashbot123</strong>
            </p>
          </div>

          <div>
            <Label htmlFor="setupKey" className="text-gray-300">
              Setup Key
            </Label>
            <Input
              id="setupKey"
              type="text"
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              onKeyPress={handleKeyPress}
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-500"
              placeholder="Enter setup key"
              disabled={loading}
            />
            <p className="text-gray-500 text-xs mt-2 font-mono">setup-flashbot-admin-2024</p>
          </div>

          <Button
            onClick={createAdmin}
            disabled={loading || !setupKey}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? "Creating Admin..." : "Create Admin Account"}
          </Button>

          {message && (
            <div
              className={`p-3 rounded-lg text-white text-sm ${
                message.includes("✅")
                  ? "bg-green-900/30 border border-green-700"
                  : "bg-red-900/30 border border-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="text-center pt-2">
            <Button
              onClick={() => (window.location.href = "/prechy")}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-200 bg-transparent text-sm"
            >
              Go to Admin Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
