"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Download,
  Share,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface Transaction {
  id: number
  user_id: number
  type: string
  amount: number
  recipient_account_number?: string
  recipient_account_name?: string
  recipient_bank_name?: string
  status: string
  description?: string
  reference?: string
  created_at: string
}

interface TransactionReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  userInfo?: {
    firstName: string
    lastName: string
    email: string
  }
}

export function TransactionReceiptModal({ isOpen, onClose, transaction, userInfo }: TransactionReceiptModalProps) {
  const [downloading, setDownloading] = useState(false)

  if (!transaction) return null

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (transaction.status) {
      case "completed":
        return "text-green-400 bg-green-500/10 border-green-500/20"
      case "pending":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
      case "failed":
        return "text-red-400 bg-red-500/10 border-red-500/20"
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20"
    }
  }

  const getTransactionIcon = () => {
    if (transaction.type === "credit") {
      return <ArrowDownLeft className="w-5 h-5 text-green-400" />
    }
    return <ArrowUpRight className="w-5 h-5 text-red-400" />
  }

  const getPendingReason = () => {
    if (transaction.status === "pending") {
      if (transaction.type === "transfer") {
        return "Account not activated. Activate your account to complete transfers."
      }
      if (transaction.type === "activation") {
        return "Waiting for payment confirmation from Flutterwave."
      }
      if (transaction.type === "topup") {
        return "Waiting for payment confirmation from Flutterwave."
      }
    }
    return null
  }

  const handleDownload = async () => {
    setDownloading(true)
    // Simulate download
    setTimeout(() => {
      setDownloading(false)
    }, 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FLASHBOT Transaction Receipt",
          text: `Transaction Receipt - ${formatCurrency(transaction.amount)}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    }
  }

  const isTransferTransaction = transaction.type === "transfer" && transaction.recipient_account_name

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            {/* Smaller container - max height 85vh to fit mobile screens better */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-2 right-2 z-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-1.5 rounded-full h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white flex-shrink-0">
                <div className="text-center">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    {getTransactionIcon()}
                  </div>
                  <h2 className="text-base font-bold mb-1">FLASHBOT</h2>
                  <p className="text-green-100 text-xs">Transaction Receipt</p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 bg-white">
                  {/* Status */}
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center mb-1">{getStatusIcon()}</div>
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
                    >
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-center mb-3">
                    <p className="text-gray-600 text-xs mb-1">Amount</p>
                    <p className="text-xl font-bold text-gray-900">
                      {transaction.type === "credit" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>

                  {/* Transaction Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600 text-xs">Transaction ID</span>
                      <span className="text-gray-900 text-xs font-medium">#{transaction.id}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600 text-xs">Reference</span>
                      <span className="text-gray-900 text-xs font-mono text-right max-w-[120px] truncate">
                        {transaction.reference || "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600 text-xs">Type</span>
                      <span className="text-gray-900 text-xs font-medium capitalize">{transaction.type}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600 text-xs">Date & Time</span>
                      <span className="text-gray-900 text-xs text-right">
                        {new Date(transaction.created_at).toLocaleString("en-NG", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {transaction.recipient_account_name && (
                      <>
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600 text-xs">Recipient</span>
                          <span className="text-gray-900 text-xs font-medium text-right max-w-[140px] truncate">
                            {transaction.recipient_account_name}
                          </span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600 text-xs">Account</span>
                          <span className="text-gray-900 text-xs font-mono">
                            {transaction.recipient_account_number}
                          </span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600 text-xs">Bank</span>
                          <span className="text-gray-900 text-xs text-right max-w-[120px] truncate">
                            {transaction.recipient_bank_name}
                          </span>
                        </div>
                      </>
                    )}

                    {userInfo && (
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600 text-xs">From</span>
                        <span className="text-gray-900 text-xs text-right">
                          {userInfo.firstName} {userInfo.lastName}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1">
                      <span className="text-gray-600 text-xs">Description</span>
                      <span className="text-gray-900 text-xs text-right max-w-[140px] break-words">
                        {transaction.description || "No description"}
                      </span>
                    </div>
                  </div>

                  {/* Pending Reason */}
                  {getPendingReason() && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                      <p className="text-yellow-800 text-xs leading-relaxed">
                        <strong>Pending:</strong> {getPendingReason()}
                      </p>
                    </div>
                  )}

                  {/* CBN Warning Notice - Show for transfer transactions */}
                  {isTransferTransaction && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-800 text-xs leading-relaxed font-semibold mb-1">CBN WARNING NOTICE</p>
                          <p className="text-red-700 text-xs leading-relaxed">
                            This transfer was generated by FLASHBOT AI and is <strong>NOT VERIFIED</strong> by the
                            Central Bank of Nigeria (CBN). Funds may be automatically debited from recipient's account
                            within 48 hours.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General Warning Notice */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3">
                    <p className="text-orange-800 text-xs leading-relaxed">
                      <strong>Notice:</strong> FLASHBOT is not responsible for any financial losses. Use at your own
                      risk.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
                {/* Action Buttons */}
                <div className="flex gap-2 mb-3">
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent text-xs h-8"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {downloading ? "..." : "Download"}
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent text-xs h-8"
                  >
                    <Share className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>

                {/* Footer */}
                <div className="text-center">
                  <p className="text-gray-500 text-xs">FLASHBOT • {new Date().toLocaleDateString("en-NG")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
