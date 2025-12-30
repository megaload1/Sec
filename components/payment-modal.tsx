"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CreditCard, Building2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  type: "activation" | "topup"
  onSuccess: () => void
}

export function PaymentModal({ isOpen, onClose, amount, type, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank_transfer">("bank_transfer")
  const [showFlutterwaveModal, setShowFlutterwaveModal] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setError("")
      setPaymentData(null)
      setShowFlutterwaveModal(false)
    }
  }, [isOpen])

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) {
        setError("Please login again to continue")
        setLoading(false)
        return
      }

      const endpoint = type === "activation" ? "/api/payments/activate" : "/api/payments/topup"

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

      if (response.ok && data.success) {
        setPaymentData(data)

        // Store payment info for callback verification
        localStorage.setItem(
          "pending_payment",
          JSON.stringify({
            type,
            amount,
            reference: data.reference,
            payment_method: paymentMethod,
          }),
        )

        if (data.payment_link) {
          // Redirect to Flutterwave payment page
          window.location.href = data.payment_link
        } else {
          setError("Payment initialization failed")
        }
      } else {
        setError(data.error || "Payment initialization failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Ensure we don't lose user state when closing
    const token = localStorage.getItem("flashbot_token")
    if (!token) {
      // If token is missing, redirect to home
      window.location.href = "/"
      return
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {type === "activation" ? "Activate Account" : "Top Up Wallet"}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Amount Display */}
              <Card className="bg-gray-700/30 border-gray-600">
                <CardContent className="p-4 text-center">
                  <p className="text-gray-400 text-sm mb-2">
                    {type === "activation" ? "Activation Fee" : "Payment Amount"}
                  </p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(amount)}</p>
                  {type === "topup" && (
                    <p className="text-green-400 text-sm mt-2">You'll receive more than this amount in your wallet!</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <p className="text-gray-300 font-medium">Choose Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={paymentMethod === "bank_transfer" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`h-16 flex flex-col items-center gap-2 ${
                      paymentMethod === "bank_transfer"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs">Bank Transfer</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "card" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("card")}
                    className={`h-16 flex flex-col items-center gap-2 ${
                      paymentMethod === "card"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Card Payment</span>
                  </Button>
                </div>
                <p className="text-gray-500 text-xs text-center">You can change payment method on the next page</p>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 text-base font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatCurrency(amount)}`
                )}
              </Button>

              {/* Info */}
              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>Secure payment powered by Flutterwave</p>
                <p>Your payment information is encrypted and secure</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
