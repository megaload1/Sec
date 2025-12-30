"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PaymentCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled">("loading")
  const [message, setMessage] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [paymentType, setPaymentType] = useState<string>("")
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        console.log("PaymentCallback: Starting payment verification...")

        const txRef = searchParams.get("tx_ref")
        const transactionId = searchParams.get("transaction_id")
        const statusParam = searchParams.get("status")

        console.log("PaymentCallback: URL params:", { txRef, transactionId, statusParam })

        // Check if payment was cancelled
        if (statusParam === "cancelled") {
          console.log("PaymentCallback: Payment was cancelled")
          setStatus("cancelled")
          setMessage("Payment was cancelled")
          return
        }

        if (!txRef && !transactionId) {
          console.log("PaymentCallback: No payment reference found")
          setStatus("failed")
          setMessage("Invalid payment reference")
          return
        }

        // Get stored payment info
        const pendingPayment = localStorage.getItem("pending_payment")
        console.log("PaymentCallback: Pending payment data:", pendingPayment)

        if (pendingPayment) {
          const paymentInfo = JSON.parse(pendingPayment)
          setAmount(paymentInfo.amount || 0)
          setPaymentType(paymentInfo.type || "")
          console.log("PaymentCallback: Payment info loaded:", paymentInfo)
        }

        // Verify payment with backend
        const token = localStorage.getItem("flashbot_token")
        console.log("PaymentCallback: Token exists:", token ? "Yes" : "No")

        if (!token) {
          console.log("PaymentCallback: No token found, redirecting to home")
          window.location.href = "/"
          return
        }

        console.log("PaymentCallback: Calling verification API...")
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tx_ref: txRef,
            transaction_id: transactionId,
            status: statusParam,
          }),
        })

        console.log("PaymentCallback: Verification response status:", response.status)
        const data = await response.json()
        console.log("PaymentCallback: Verification response data:", data)

        if (response.ok && data.success) {
          console.log("PaymentCallback: Payment verification successful")
          setStatus("success")
          setMessage(data.message || "Payment completed successfully!")

          // Clear pending payment
          localStorage.removeItem("pending_payment")

          // Auto-redirect to dashboard after 3 seconds
          setTimeout(() => {
            console.log("PaymentCallback: Auto-redirecting to dashboard")
            handleReturnToDashboard()
          }, 3000)
        } else {
          console.log("PaymentCallback: Payment verification failed:", data.error)
          setStatus("failed")
          setMessage(data.error || "Payment verification failed")
        }
      } catch (error) {
        console.error("PaymentCallback: Payment verification error:", error)
        setStatus("failed")
        setMessage("Failed to verify payment. Please contact support.")
      }
    }

    verifyPayment()
  }, [searchParams])

  const handleReturnToDashboard = () => {
    console.log("PaymentCallback: Returning to dashboard...")

    // Ensure token exists before redirecting
    const token = localStorage.getItem("flashbot_token")
    console.log("PaymentCallback: Token check before redirect:", token ? "Token exists" : "No token")

    if (!token) {
      console.log("PaymentCallback: No token, redirecting to home")
      window.location.href = "/"
      return
    }

    console.log("PaymentCallback: Redirecting to dashboard")
    window.location.href = "/dashboard"
  }

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle className="w-16 h-16 text-green-500" />
      case "failed":
      case "cancelled":
        return <XCircle className="w-16 h-16 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-blue-400"
      case "success":
        return "text-green-400"
      case "failed":
      case "cancelled":
        return "text-red-400"
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case "loading":
        return "Verifying Payment..."
      case "success":
        return "Payment Successful!"
      case "failed":
        return "Payment Failed"
      case "cancelled":
        return "Payment Cancelled"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gray-800 border-gray-700 shadow-2xl">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              {getStatusIcon()}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-2xl font-bold mb-4 ${getStatusColor()}`}
            >
              {getStatusTitle()}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 mb-6 leading-relaxed"
            >
              {message}
            </motion.p>

            {amount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6 p-4 bg-gray-700/30 rounded-lg"
              >
                <p className="text-gray-400 text-sm mb-1">
                  {paymentType === "activation" ? "Activation Fee" : "Top-up Amount"}
                </p>
                <p className="text-white text-xl font-bold">₦{amount.toLocaleString()}</p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button
                onClick={handleReturnToDashboard}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 text-base font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {status === "success" ? "Return to Dashboard (Auto-redirect in 3s)" : "Return to Dashboard"}
              </Button>

              {status === "failed" && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent rounded-xl h-12"
                >
                  Try Again
                </Button>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-xs text-gray-500 text-center"
            >
              <p>Need help? Contact our support team</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
