"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import { SplashScreen } from "@/components/splash-screen"
import { AuthModal } from "@/components/auth-modal"

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("flashbot_token")
    if (token) {
      // Verify token and redirect
      fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        if (response.ok) {
          response.json().then((data) => {
            if (data.user.isAdmin) {
              window.location.href = "/prechy"
            } else {
              window.location.href = "/dashboard"
            }
          })
        } else {
          localStorage.removeItem("flashbot_token")
        }
      })
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    setShowAuthModal(true)
  }

  const handleAuthSuccess = (token: string) => {
    // Decode token to check if admin
    fetch("/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          if (data.user.isAdmin) {
            window.location.href = "/prechy"
          } else {
            window.location.href = "/dashboard"
          }
        })
      }
    })
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <Zap className="w-8 h-8 text-green-400" />
          </div>
          <span className="text-3xl font-bold text-white">FLASHBOT</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-sm"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Lightning Fast
            <span className="text-green-400 block">Money Transfers</span>
          </h1>
          <p className="text-gray-300 mb-8 text-lg">
            Send money instantly to any Nigerian bank account. Secure and reliable.
          </p>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => {}} onAuthSuccess={handleAuthSuccess} />
    </div>
  )
}
