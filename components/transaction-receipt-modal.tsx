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
  Copy,
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

  const getStatusColor = () => {
    switch (transaction.status) {
      case "completed":
        return "#00D094"
      case "pending":
        return "#FFA500"
      case "failed":
        return "#FF6B6B"
      default:
        return "#999999"
    }
  }

  const getStatusLabel = () => {
    switch (transaction.status) {
      case "completed":
        return "Successful"
      case "pending":
        return "Pending"
      case "failed":
        return "Failed"
      default:
        return transaction.status
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
    }, 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "BST array Transaction Receipt",
          text: `Transaction Receipt - ${formatCurrency(transaction.amount)}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    }
  }

  const formattedDate = new Date(transaction.created_at).toLocaleString("en-NG", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-[#121212] rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <button onClick={onClose} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <h1 className="text-sm font-medium text-white/80">Transaction Details</h1>
                <div className="w-6 h-6 bg-[#7E3AF2] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  {/* Main Card */}
                  <div className="bg-[#1E1E1E] rounded-xl pt-6 pb-4 px-4 flex flex-col items-center mb-4">
                    <p className="text-[#D1D1D1] text-xs font-medium mb-3 uppercase tracking-wide">
                      {transaction.type === "transfer" 
                        ? `Transfer to ${transaction.recipient_account_name || "Recipient"}` 
                        : transaction.type === "topup" 
                        ? "Wallet Top-up" 
                        : "Transaction"}
                    </p>
                    <div className="flex items-center mb-1">
                      <span className="text-lg font-bold mr-0.5">₦</span>
                      <span className="text-2xl font-bold">{(transaction.amount / 1).toLocaleString("en-NG")}</span>
                    </div>
                    <span className="text-xs font-semibold mb-6" style={{ color: getStatusColor() }}>
                      {getStatusLabel()}
                    </span>

                    {/* Timeline - Status Based */}
                    <div className="flex w-full mb-6 px-2">
                      <div className="flex-1 flex flex-col items-center">
                        <div className="flex items-center w-full mb-2">
                          <div className="flex-grow border-t border-white/20"></div>
                          <div 
                            className="w-3 h-3 rounded-full flex items-center justify-center mx-1 flex-shrink-0"
                            style={{ backgroundColor: getStatusColor() }}
                          >
                            {transaction.status === "completed" && (
                              <CheckCircle className="w-2 h-2 text-[#121212]" />
                            )}
                            {transaction.status === "pending" && (
                              <Clock className="w-2 h-2 text-[#121212]" />
                            )}
                            {transaction.status === "failed" && (
                              <XCircle className="w-2 h-2 text-[#121212]" />
                            )}
                          </div>
                          <div className="flex-grow border-t border-white/20"></div>
                        </div>
                        <span className="text-xs text-[#999999] text-center">
                          {transaction.status === "completed" && "Payment successful"}
                          {transaction.status === "pending" && "Payment pending"}
                          {transaction.status === "failed" && "Payment failed"}
                        </span>
                        <span className="text-[10px] text-[#666666] mt-1">{formattedDate}</span>
                      </div>
                    </div>

                    {/* Notice - Status Based */}
                    <div className="bg-[#181818] border border-white/10 rounded-lg p-3 w-full text-xs leading-relaxed mb-4">
                      <p className="text-[#888888]">
                        {transaction.status === "completed" && (
                          <>The recipient account is expected to be credited within 5 minutes, subject to notification by the bank. If you have any questions, contact support.</>
                        )}
                        {transaction.status === "pending" && (
                          <>This transaction is still pending. Please wait for confirmation from the bank. This may take a few minutes. Do not attempt to send the same amount again.</>
                        )}
                        {transaction.status === "failed" && (
                          <>This transaction failed. Your account has not been debited. Please try again or contact support if the issue persists.</>
                        )}
                      </p>
                    </div>

                    {/* Amount Breakdown */}
                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#999999]">Amount</span>
                        <span className="font-medium text-white">₦{(transaction.amount / 1).toLocaleString("en-NG")}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#999999]">Fee</span>
                        <span className="font-medium text-white">₦0.00</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-white/10 pt-2 mt-2">
                        <span className="text-[#999999]">Amount Paid</span>
                        <span className="font-medium text-white">₦{(transaction.amount / 1).toLocaleString("en-NG")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details Section */}
                  <div className="bg-[#1E1E1E] rounded-xl p-4">
                    <h2 className="text-white font-semibold text-sm mb-4">Transaction Details</h2>
                    <div className="space-y-3">
                      {transaction.recipient_account_name && (
                        <div className="flex justify-between items-start text-xs">
                          <span className="text-[#999999]">Recipient Details</span>
                          <div className="text-right">
                            <p className="font-medium leading-tight text-white">{transaction.recipient_account_name}</p>
                            <p className="text-[#888888] text-[10px]">
                              {transaction.recipient_bank_name} | {transaction.recipient_account_number}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#999999]">Transaction No.</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-right">{transaction.reference || `TXN-${transaction.id}`}</span>
                          <Copy className="w-3 h-3 text-[#888888] cursor-pointer hover:text-white" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#999999]">Payment Method</span>
                        <div className="flex items-center gap-1 font-medium text-white">
                          <span>Wallet</span>
                          <ArrowUpRight className="w-3 h-3 text-[#888888]" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#999999]">Date & Time</span>
                        <span className="font-medium text-white">{formattedDate}</span>
                      </div>
                      {transaction.description && (
                        <div className="flex justify-between items-start text-xs">
                          <span className="text-[#999999]">Description</span>
                          <span className="font-medium text-white text-right max-w-[150px]">{transaction.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-[#121212]/95 border-t border-white/10 flex gap-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 py-2.5 rounded-full bg-[#2a2a2a] text-white/70 hover:text-white font-bold text-sm transition-colors"
                >
                  {downloading ? "..." : "Report Issue"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 rounded-full bg-[#00D094] text-[#121212] font-bold text-sm shadow-lg hover:bg-[#00E5A8] transition-colors"
                >
                  Share Receipt
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
