"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (token: string) => void
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : mode === "register" ? "/api/auth/register" : "/api/auth/forgot-password"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || "An error occurred" })
        return
      }

      if (mode === "forgot") {
        setErrors({ general: "Password reset instructions sent to your email" })
        return
      }

      localStorage.setItem("flashbot_token", data.token)
      onAuthSuccess(data.token)
    } catch (error) {
      setErrors({ general: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      confirmPassword: "",
    })
    setErrors({})
  }

  const switchMode = (newMode: typeof mode) => {
    setMode(newMode)
    resetForm()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
        >
          <div className="fixed inset-0 bg-black/40" />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "hsl(0, 0%, 10%)" }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl"
                >
                  <User className="w-6 h-6 text-cyan-400" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center">
                {mode === "login" ? "Welcome Back" : mode === "register" ? "Create Account" : "Reset Password"}
              </h2>
              <p className="text-gray-400 text-center text-sm mt-2">
                {mode === "login"
                  ? "Sign in to your account"
                  : mode === "register"
                    ? "Join FLASHBOT today"
                    : "Enter your email"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg text-sm flex items-center gap-3 ${
                    errors.general.includes("sent")
                      ? "bg-green-500/10 text-green-400 border border-green-500/30"
                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.general}
                </motion.div>
              )}

              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-300 text-sm mb-2 block">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="pl-10 border-white/10 text-white placeholder-gray-500 rounded-lg h-11 focus:border-cyan-400 focus:ring-cyan-400/30"
                        style={{ backgroundColor: "hsl(0, 0%, 15%)" }}
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-300 text-sm mb-2 block">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <Input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="pl-10 border-white/10 text-white placeholder-gray-500 rounded-lg h-11 focus:border-cyan-400 focus:ring-cyan-400/30"
                        style={{ backgroundColor: "hsl(0, 0%, 15%)" }}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-gray-300 text-sm mb-2 block">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="pl-10 border-white/10 text-white placeholder-gray-500 rounded-lg h-11 focus:border-cyan-400 focus:ring-cyan-400/30"
                    style={{ backgroundColor: "hsl(0, 0%, 15%)" }}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div>
                  <Label htmlFor="password" className="text-gray-300 text-sm mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10 border-white/10 text-white placeholder-gray-500 rounded-lg h-11 focus:border-cyan-400 focus:ring-cyan-400/30"
                      style={{ backgroundColor: "hsl(0, 0%, 15%)" }}
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-cyan-400 h-10 w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {mode === "register" && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-300 text-sm mb-2 block">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10 border-white/10 text-white placeholder-gray-500 rounded-lg h-11 focus:border-cyan-400 focus:ring-cyan-400/30"
                      style={{ backgroundColor: "hsl(0, 0%, 15%)" }}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white rounded-lg h-11 text-base font-semibold transition-all duration-200"
              >
                {loading
                  ? "Processing..."
                  : mode === "login"
                    ? "Sign In"
                    : mode === "register"
                      ? "Create Account"
                      : "Send Reset Link"}
              </Button>

              <div className="text-center space-y-3 text-sm pt-2">
                {mode === "login" && (
                  <>
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-cyan-400 hover:text-cyan-300 block w-full transition-colors"
                    >
                      Forgot your password?
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-white/10"></div>
                      <span className="text-gray-500">or</span>
                      <div className="flex-1 h-px bg-white/10"></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="text-cyan-400 hover:text-cyan-300 block w-full transition-colors"
                    >
                      Create new account
                    </button>
                  </>
                )}

                {mode === "register" && (
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Already have an account? Sign in
                  </button>
                )}

                {mode === "forgot" && (
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Back to login
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
