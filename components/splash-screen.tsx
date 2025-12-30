"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Shield, Lock, Wifi } from "lucide-react"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { text: "Initializing FLASHBOT AI...", icon: Zap },
    { text: "Securing connection...", icon: Lock },
    { text: "Syncing with servers...", icon: Wifi },
    { text: "Loading dashboard...", icon: Shield },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(timer)
  }, [onComplete])

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 1500)

    return () => clearInterval(stepTimer)
  }, [steps.length])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gray-950"
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-md">
          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2,
            }}
            className="relative mb-12"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />

            {/* Main Logo Circle */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 40px rgba(59, 130, 246, 0.3)",
                  "0 0 60px rgba(59, 130, 246, 0.4)",
                  "0 0 40px rgba(59, 130, 246, 0.3)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="relative w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Zap className="w-16 h-16 text-white" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            {/* Spinning Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute inset-0 w-32 h-32"
            >
              <div className="absolute top-0 left-1/2 w-3 h-3 -ml-1.5 bg-blue-500 rounded-full" />
            </motion.div>
          </motion.div>

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl font-bold mb-3 text-white tracking-wide">FLASHBOT</h1>
            <p className="text-gray-400 text-lg">Instant Money Transfer</p>
          </motion.div>

          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="w-full max-w-sm"
          >
            {/* Progress Bar */}
            <div className="relative mb-6">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-600">Loading...</span>
                <span className="text-xs text-blue-400 font-semibold">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Loading Status */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-3 p-4 bg-gray-900 rounded-xl border border-gray-800"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  {(() => {
                    const StepIcon = steps[currentStep].icon
                    return <StepIcon className="w-5 h-5 text-blue-400" />
                  })()}
                </motion.div>
                <p className="text-gray-300 text-sm font-medium">{steps[currentStep].text}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
