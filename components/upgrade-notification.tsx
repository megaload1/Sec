"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Zap, Clock } from "lucide-react"

interface UpgradeNotificationProps {
  completionTime: string
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
}

export function UpgradeNotification({ completionTime }: UpgradeNotificationProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: false,
  })

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const end = new Date(completionTime).getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isComplete: true,
        })
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          isComplete: false,
        })
      }
    }

    calculateTimeRemaining()
    const timer = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(timer)
  }, [completionTime])

  if (!completionTime) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 backdrop-blur-sm shadow-lg overflow-hidden relative"
    >
      {/* Animated background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 bg-blue-500/20 rounded-lg flex-shrink-0 border border-blue-500/30 animate-pulse">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm sm:text-base mb-1">🚀 System Upgrade in Progress</h3>
            <p className="text-blue-300 text-xs sm:text-sm">
              We're working hard to improve your experience. Service will resume shortly.
            </p>
          </div>
        </div>

        {timeRemaining.isComplete ? (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Upgrade complete! System is back online.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/40 rounded-lg p-4 border border-slate-700/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 font-medium text-xs sm:text-sm">Upgrade Completion In:</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: "Days", value: timeRemaining.days },
                { label: "Hours", value: timeRemaining.hours },
                { label: "Minutes", value: timeRemaining.minutes },
                { label: "Seconds", value: timeRemaining.seconds },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-lg p-2 sm:p-3 border border-blue-500/20 backdrop-blur-sm">
                    <div className="font-mono font-bold text-white text-lg sm:text-xl">
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="text-blue-300 text-xs font-medium mt-1">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-xs leading-relaxed">
                <strong>Note:</strong> During the upgrade period, you may experience temporary service disruptions. We
                apologize for any inconvenience.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
