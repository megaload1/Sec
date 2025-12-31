"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Wallet,
  Send,
  CreditCard,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Power,
  RefreshCw,
  Bell,
  Receipt,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Settings,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CountdownTimer } from "@/components/countdown-timer"
import { SendMoneyModal } from "@/components/send-money-modal"
import { PaymentModal } from "@/components/payment-modal"
import { formatCurrency, safeNumber } from "@/lib/utils"
import { TransactionReceiptModal } from "@/components/transaction-receipt-modal"
import { CBNWarningNotification } from "@/components/cbn-warning-notification"
import { ChatWidget } from "@/components/chat-widget"
import { SettingsModal } from "@/components/settings-modal"
import { UpgradeNotification } from "@/components/upgrade-notification"
import { useNotification } from "@/contexts/notification-context"

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  walletBalance: number
  isActive: boolean
  isAdmin: boolean
  registrationCountdownEnd: string | null
}

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

interface AdminSettings {
  topup_payment_amount: string
  topup_credit_amount: string
  activation_fee: string
}

interface DashboardState {
  upgradeNotificationEnabled: boolean
  upgradeCompletionTime: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [paymentType, setPaymentType] = useState<"activation" | "topup">("activation")
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    topup_payment_amount: "12500",
    topup_credit_amount: "200000",
    activation_fee: "35000",
  })
  const [revertingTransactions, setRevertingTransactions] = useState<Set<number>>(new Set())
  const [reloading, setReloading] = useState(false)
  const [upgradeNotification, setUpgradeNotification] = useState<DashboardState>({
    upgradeNotificationEnabled: false,
    upgradeCompletionTime: "",
  })

  const { showSuccess, showError } = useNotification()

  useEffect(() => {
    const token = localStorage.getItem("flashbot_token")
    if (!token) {
      window.location.href = "/"
      return
    }
    initializeDashboard()
  }, [])

  const initializeDashboard = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchUserData(), fetchTransactions(), fetchAdminSettings(), fetchUpgradeStatus()])
    } catch (error) {
      console.error("Dashboard: Error initializing dashboard:", error)
      showError("Loading Error", "Failed to load dashboard data. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) {
        window.location.href = "/"
        return
      }

      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        localStorage.removeItem("flashbot_token")
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Dashboard: Error fetching user data:", error)
      showError("Connection Error", "Failed to load user data. Please check your connection.")
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) return

      const response = await fetch("/api/user/transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error("Dashboard: Error fetching transactions:", error)
      showError("Connection Error", "Failed to load transaction history.")
    }
  }

  const fetchAdminSettings = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) return

      const response = await fetch("/api/user/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAdminSettings({
          topup_payment_amount: data.settings.topup_payment_amount || "12500",
          topup_credit_amount: data.settings.topup_credit_amount || "200000",
          activation_fee: data.settings.activation_fee || "35000",
        })
      }
    } catch (error) {
      console.error("Dashboard: Error fetching admin settings:", error)
    }
  }

  const fetchUpgradeStatus = async () => {
    try {
      const response = await fetch("/api/upgrade-status")
      if (response.ok) {
        const data = await response.json()
        setUpgradeNotification({
          upgradeNotificationEnabled: data.upgrade_notification_enabled,
          upgradeCompletionTime: data.upgrade_completion_time,
        })
      }
    } catch (error) {
      console.error("Error fetching upgrade status:", error)
    }
  }

  const handleCountdownComplete = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch("/api/countdown-complete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        await Promise.all([fetchUserData(), fetchTransactions()])
        if (data.bonusAmount && data.bonusAmount > 0) {
          showSuccess("Welcome Bonus Credited!", `₦${data.bonusAmount.toLocaleString()} has been added to your wallet.`)
        }
      }
    } catch (error) {
      console.error("Dashboard: Error completing countdown:", error)
    }
  }

  const handleReloadDashboard = async () => {
    setReloading(true)
    try {
      await Promise.all([fetchUserData(), fetchTransactions()])
      showSuccess("Dashboard Refreshed", "Your data has been updated successfully.")
    } catch (error) {
      console.error("Dashboard: Error reloading dashboard:", error)
      showError("Refresh Failed", "Failed to refresh dashboard data.")
    } finally {
      setReloading(false)
    }
  }

  const handleRevertTransaction = async (transactionId: number) => {
    if (revertingTransactions.has(transactionId)) return

    setRevertingTransactions((prev) => new Set(prev).add(transactionId))

    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch(`/api/user/transactions/${transactionId}/revert`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess(
          "Transaction Reverted",
          data.message || `₦${data.amount_returned?.toLocaleString()} has been returned to your wallet.`,
        )
        await Promise.all([fetchUserData(), fetchTransactions()])
      } else {
        showError("Revert Failed", data.error || "Failed to revert transaction. Please try again.")
      }
    } catch (error) {
      console.error("Dashboard: Error reverting transaction:", error)
      showError("Connection Error", "Failed to revert transaction due to connection issues. Please try again.")
    } finally {
      setRevertingTransactions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(transactionId)
        return newSet
      })
    }
  }

  const handleActivateAccount = () => {
    setPaymentType("activation")
    setShowPaymentModal(true)
  }

  const handleTopUpWallet = () => {
    setPaymentType("topup")
    setShowPaymentModal(true)
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (type === "credit") return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
    if (type === "debit" || type === "transfer") return <ArrowUpRight className="w-4 h-4 text-rose-400" />
    return <RefreshCw className="w-4 h-4 text-slate-400" />
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
      failed: { label: "Failed", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
      reverted: { label: "Reverted", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={`${config.className} text-xs px-2 py-1`}>{config.label}</Badge>
  }

  const getPendingReason = (transaction: Transaction) => {
    if (transaction.status === "pending" && transaction.type === "transfer") {
      return "Account not active"
    }
    return null
  }

  const canRevertTransaction = (transaction: Transaction) => {
    return (
      transaction.status === "pending" &&
      transaction.type === "transfer" &&
      !user?.isActive &&
      !transaction.description?.includes("REVERTED")
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-12 h-12 border-4 border-slate-700 border-t-slate-400 rounded-full mx-auto mb-4"
          />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-rose-400 mb-4">Error loading user data</p>
          <Button onClick={() => (window.location.href = "/")} className="bg-slate-700 hover:bg-slate-600 text-white">
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const topupPaymentAmount = safeNumber(adminSettings.topup_payment_amount)
  const topupCreditAmount = safeNumber(adminSettings.topup_credit_amount)
  const activationFee = safeNumber(adminSettings.activation_fee)

  const totalSent = transactions
    .filter((t) => (t.type === "transfer" || t.type === "debit") && t.status === "completed")
    .reduce((sum, t) => sum + safeNumber(t.amount), 0)

  const totalReceived = transactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + safeNumber(t.amount), 0)

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      <CBNWarningNotification />

      {/* Header - CHANGE: reduced height and padding for mobile compactness */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 h-14 sm:h-16">
        <div className="flex items-center justify-between px-3 sm:px-4 h-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-semibold text-white truncate">Welcome, {user.firstName}</h1>
              <Badge
                className={`text-xs mt-0.5 inline-block ${
                  user.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {user.isActive ? "● Active" : "● Inactive"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1.5 sm:p-2 relative h-8 w-8 sm:h-9 sm:w-9"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1.5 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem("flashbot_token")
                window.location.href = "/"
              }}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
            >
              <Power className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - CHANGE: reduced spacing and padding for mobile devices */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-24">
        {/* Upgrade Notification */}
        {upgradeNotification.upgradeNotificationEnabled && upgradeNotification.upgradeCompletionTime && (
          <UpgradeNotification completionTime={upgradeNotification.upgradeCompletionTime} />
        )}

        {/* Countdown Timer */}
        {user.registrationCountdownEnd && (
          <CountdownTimer endTime={user.registrationCountdownEnd} onComplete={handleCountdownComplete} />
        )}

        {/* Premium Wallet Card - CHANGE: reduced padding and font sizes */}
        <Card className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 border-slate-700/50 shadow-xl backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 opacity-[0.02]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="p-2 sm:p-2.5 bg-slate-700/50 rounded-lg sm:rounded-xl backdrop-blur-sm border border-slate-600/30 flex-shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">Available Balance</p>
                  <p className="text-slate-500 text-xs">Ready to transfer</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
                <Button
                  onClick={handleReloadDashboard}
                  disabled={reloading}
                  size="sm"
                  className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 border-0 h-8 sm:h-9 px-2 sm:px-3 backdrop-blur-sm text-xs"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 ${reloading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{reloading ? "Updating..." : "Refresh"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-1.5 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
                >
                  {showBalance ? (
                    <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-8 tracking-tight">
              {showBalance ? formatCurrency(safeNumber(user.walletBalance)) : "••••••••"}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Button
                onClick={() => setShowSendModal(true)}
                disabled={!user.isActive && user.walletBalance === 0}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white h-10 sm:h-12 font-medium text-sm sm:text-base"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Send Money</span>
                <span className="sm:hidden">Send</span>
              </Button>
              <Button
                onClick={handleTopUpWallet}
                className="w-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 border border-slate-600/30 h-10 sm:h-12 font-medium text-sm sm:text-base backdrop-blur-sm"
              >
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Top Up</span>
                <span className="sm:hidden">Top Up</span>
              </Button>
            </div>

            <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-500/5 via-amber-500/5 to-transparent rounded-lg sm:rounded-xl border border-amber-500/10 backdrop-blur-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-md sm:rounded-lg flex-shrink-0 border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs sm:text-sm font-medium">Top-Up Offer</p>
                  <p className="text-slate-400 text-xs">
                    Pay ₦{topupPaymentAmount.toLocaleString()} → Get ₦{topupCreditAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Activation - Updated Design */}
        {!user.isActive && (
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40 border-slate-700/30 shadow-lg backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.02]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: "24px 24px",
                }}
              />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl flex-shrink-0 border border-amber-500/20">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-2">Account Activation Required</h3>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                    Unlock unlimited transfers to all Nigerian banks and enjoy seamless transactions.
                  </p>
                  <Button
                    onClick={handleActivateAccount}
                    className="bg-slate-700/70 hover:bg-slate-600/70 text-slate-100 border border-slate-600/30 font-medium backdrop-blur-sm"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Activate Account (₦{activationFee.toLocaleString()})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid - CHANGE: reduced gap and padding for mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "Total Sent", value: totalSent, icon: TrendingUp, color: "rose" },
            { label: "Total Received", value: totalReceived, icon: TrendingDown, color: "emerald" },
            { label: "Transactions", value: transactions.length, icon: Activity, color: "slate", isCount: true },
          ].map((stat, index) => (
            <Card key={index} className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm shadow-lg">
              <CardContent className="p-2.5 sm:p-4 text-center">
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0`}
                >
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}-400`} />
                </div>
                <p className="text-slate-400 text-xs mb-1 font-medium">{stat.label}</p>
                <p className="text-white font-semibold text-sm sm:text-base">
                  {stat.isCount ? stat.value : formatCurrency(stat.value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transactions */}
        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-4 border-b border-slate-800/50">
            <CardTitle className="text-white flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                  <Clock className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-slate-300 mb-1 font-medium">No transactions yet</p>
                <p className="text-slate-500 text-sm">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {transactions
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="p-2.5 bg-slate-800/50 rounded-xl flex-shrink-0 border border-slate-700/50">
                        {getTransactionIcon(transaction.type, transaction.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate">
                              {transaction.description || `${transaction.type} transaction`}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {new Date(transaction.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {transaction.recipient_account_name && (
                              <p className="text-slate-500 text-xs truncate">
                                To: {transaction.recipient_account_name}
                              </p>
                            )}
                            {getPendingReason(transaction) && (
                              <p className="text-amber-400 text-xs mt-1">⚠ {getPendingReason(transaction)}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p
                              className={`font-semibold text-sm mb-1.5 ${
                                transaction.type === "credit" ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {transaction.type === "credit" ? "+" : "-"}
                              {formatCurrency(safeNumber(transaction.amount))}
                            </p>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-3">
                          <div className="flex items-center gap-1">
                            {canRevertTransaction(transaction) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRevertTransaction(transaction.id)}
                                disabled={revertingTransactions.has(transaction.id)}
                                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-2 h-8"
                                title="Revert Transaction"
                              >
                                {revertingTransactions.has(transaction.id) ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTransaction(transaction)
                              setShowReceiptModal(true)
                            }}
                            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 p-2 flex items-center gap-1.5 h-8"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Receipt</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                {transactions.length > 5 && (
                  <div className="p-4 text-center bg-slate-800/20">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700/50 text-slate-300 hover:bg-slate-800/50 bg-transparent"
                    >
                      View All {transactions.length} Transactions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <SendMoneyModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        userBalance={user.walletBalance}
        onSuccess={() => {
          fetchUserData()
          fetchTransactions()
        }}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={paymentType === "activation" ? activationFee : topupPaymentAmount}
        type={paymentType}
        onSuccess={() => {
          fetchUserData()
          fetchTransactions()
        }}
      />

      <TransactionReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        transaction={selectedTransaction}
        userInfo={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }}
        onSuccess={fetchUserData}
      />

      <ChatWidget />
    </div>
  )
}
