"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Clock, CreditCard, Building2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface VirtualAccountModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  type: "activation" | "topup"
  onSuccess: () => void
}

interface VirtualAccountData {
  account_number: string
  bank_name: string
  account_name: string
  reference: string
}

export function VirtualAccountModal({ isOpen, onClose, amount, type, onSuccess }: VirtualAccountModalProps) {
  const [loading, setLoading] = useState(false)
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccountData | null>(null)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "card">("bank_transfer")
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      generateVirtualAccount()
      setTimeLeft(900) // Reset timer
    }
  }, [isOpen, type])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isOpen && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onClose()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isOpen, timeLeft, onClose])

  useEffect(() => {
    let statusInterval: NodeJS.Timeout
    if (isOpen && virtualAccount && paymentMethod === "bank_transfer") {
      // Check payment status every 10 seconds
      statusInterval = setInterval(() => {
        checkPaymentStatus()
      }, 10000)
    }
    return () => clearInterval(statusInterval)
  }, [isOpen, virtualAccount, paymentMethod])

  const generateVirtualAccount = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("flashbot_token")
      const endpoint = type === "activation" ? "/api/payments/activation" : "/api/payments/topup"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          payment_method: paymentMethod,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (paymentMethod === "bank_transfer" && data.virtual_account) {
          setVirtualAccount(data.virtual_account)
        } else if (paymentMethod === "card" && data.payment_link) {
          // Redirect to Flutterwave for card payment
          window.location.href = data.payment_link
        }
      } else {
        setError(data.error || "Failed to generate payment details")
      }
    } catch (error) {
      console.error("Error generating virtual account:", error)
      setError("Failed to generate payment details")
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!virtualAccount || checkingPayment) return

    setCheckingPayment(true)
    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch("/api/payments/check-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reference: virtualAccount.reference,
        }),
      })

      const data = await response.json()

      if (response.ok && data.status === "successful") {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error("Error checking payment status:", error)
    } finally {
      setCheckingPayment(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handlePaymentMethodChange = (method: "bank_transfer" | "card") => {
    setPaymentMethod(method)
    setVirtualAccount(null)
    setError(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {type === "activation" ? "Activate Account" : "Top Up Wallet"}
              </h2>
              <p className="text-gray-400 text-sm">
                {type === "activation" ? "Pay to activate your account" : "Add funds to your wallet"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="text-white font-medium">Choose Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={paymentMethod === "bank_transfer" ? "default" : "outline"}
                  onClick={() => handlePaymentMethodChange("bank_transfer")}
                  className={`h-12 ${
                    paymentMethod === "bank_transfer"
                      ? "bg-green-600 hover:bg-green-700"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Bank Transfer
                </Button>
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  onClick={() => handlePaymentMethodChange("card")}
                  className={`h-12 ${
                    paymentMethod === "card"
                      ? "bg-green-600 hover:bg-green-700"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Card Payment
                </Button>
              </div>
              <p className="text-gray-400 text-xs text-center">
                You can change payment method by clicking the buttons above
              </p>
            </div>

            {/* Amount Display */}
            <Card className="bg-gray-700/50 border-gray-600">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Amount to Pay</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(amount)}</p>
                  {type === "topup" && (
                    <p className="text-green-400 text-sm mt-1">You'll receive more than what you pay!</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">
                Time remaining: <strong>{formatTime(timeLeft)}</strong>
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Generating payment details...</p>
              </div>
            ) : paymentMethod === "bank_transfer" && virtualAccount ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-white font-medium mb-2">Transfer to this account</h3>
                  <p className="text-gray-400 text-sm">
                    Make a transfer of exactly {formatCurrency(amount)} to the account below
                  </p>
                </div>

                <Card className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{virtualAccount.account_number}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(virtualAccount.account_number)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Bank Name</span>
                      <span className="text-white">{virtualAccount.bank_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Account Name</span>
                      <span className="text-white">{virtualAccount.account_name}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  {checkingPayment ? (
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-blue-400 text-sm">
                    {checkingPayment ? "Checking payment..." : "Waiting for payment confirmation"}
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-gray-400 text-xs">Payment will be automatically detected once confirmed</p>
                </div>
              </div>
            ) : paymentMethod === "bank_transfer" && !loading ? (
              <div className="text-center">
                <Button onClick={generateVirtualAccount} className="bg-green-600 hover:bg-green-700 text-white">
                  Generate Account Details
                </Button>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
