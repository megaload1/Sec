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
    { text: "Initializing...", icon: Zap },
    { text: "Securing connection...", icon: Lock },
    { text: "Loading your wallet...", icon: Wifi },
    { text: "Ready to transact...", icon: Shield },
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
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: "hsl(0, 0%, 5%)" }}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 20% 50%, hsl(200, 100%, 40%) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, hsl(160, 70%, 40%) 0%, transparent 50%)`,
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
            <motion.div
              animate={{
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full blur-3xl"
            />

            {/* Main Logo Circle */}
            <motion.div
              className="relative w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center shadow-2xl"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Zap className="w-16 h-16 text-white" strokeWidth={2} />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              NEXUS PAY
            </h1>
            <p className="text-gray-300 text-base font-light">Modern Money, Instant Transfers</p>
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
              <div className="h-1 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">Setting up your wallet</span>
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
                className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  {(() => {
                    const StepIcon = steps[currentStep].icon
                    return <StepIcon className="w-5 h-5 text-cyan-400" />
                  })()}
                </motion.div>
                <p className="text-gray-200 text-sm font-medium">{steps[currentStep].text}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
