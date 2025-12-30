"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, Gift } from "lucide-react"

interface CountdownTimerProps {
  endTime: string
  onComplete: () => void
  onRefresh?: () => void
}

export function CountdownTimer({ endTime, onComplete, onRefresh }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number
    seconds: number
  }>({ minutes: 0, seconds: 0 })
  const [bonusAmount, setBonusAmount] = useState("300")

  useEffect(() => {
    // Fetch admin settings to show actual bonus amount
    const fetchBonusAmount = async () => {
      try {
        const token = localStorage.getItem("flashbot_token")
        const response = await fetch("/api/user/settings", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          // Get registration bonus from settings, fallback to 300
          const registrationBonus = data.settings?.registration_bonus || "300"
          setBonusAmount(registrationBonus)
        }
      } catch (error) {
        console.error("Error fetching bonus amount:", error)
        // Keep default 300 if fetch fails
      }
    }

    fetchBonusAmount()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const difference = end - now

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        setTimeLeft({ minutes, seconds })
      } else {
        setTimeLeft({ minutes: 0, seconds: 0 })
        onComplete()
        if (onRefresh) {
          onRefresh()
        }
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, onComplete, onRefresh])

  if (timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-4 mb-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <Gift className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-400" />
            <p className="text-green-400 font-semibold text-sm">Registration Bonus Countdown</p>
          </div>
          <p className="text-white text-sm mb-2">
            <strong>₦{Number.parseFloat(bonusAmount).toLocaleString()}</strong> will be credited to your wallet in:
          </p>
          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 rounded-lg px-3 py-1">
              <span className="font-mono font-bold text-green-400 text-lg">
                {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
            <p className="text-gray-300 text-xs">minutes remaining</p>
          </div>
        </div>
      </div>

      <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-blue-400 text-xs">
          <strong>Bonus Info:</strong> This amount will be automatically added to your wallet when the countdown ends.
        </p>
      </div>
    </motion.div>
  )
}
