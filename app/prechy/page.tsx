"use client"

import type React from "react"
import { AdminChatPanel } from "@/components/admin-chat-panel"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, Shield, AlertCircle, Key, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Settings,
  Trash2,
  UserCheck,
  UserX,
  Plus,
  Minus,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { formatCurrency, safeNumber } from "@/lib/utils"

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  wallet_balance: number
  is_active: boolean
  is_admin: boolean
  created_at: string
}

interface Transaction {
  id: number
  user_id: number
  type: string
  amount: number
  status: string
  description: string
  created_at: string
}

interface AdminSettings {
  registration_bonus: string
  countdown_minutes: string
  activation_fee: string
  topup_amount: string
  topup_payment_amount?: string
  topup_credit_amount?: string
  upgrade_notification_enabled?: string
  upgrade_completion_time?: string
}

interface FlutterwaveSettings {
  flutterwave_secret_key: string
  flutterwave_public_key: string
  flutterwave_encryption_key: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loginLoading, setLoginLoading] = useState(false)

  // Admin dashboard state
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settings, setSettings] = useState<AdminSettings>({
    registration_bonus: "300",
    countdown_minutes: "5",
    activation_fee: "1000",
    topup_amount: "10000",
    upgrade_notification_enabled: "false",
    upgrade_completion_time: "",
  })
  const [flutterwaveSettings, setFlutterwaveSettings] = useState<FlutterwaveSettings>({
    flutterwave_secret_key: "",
    flutterwave_public_key: "",
    flutterwave_encryption_key: "",
  })
  const [activeTab, setActiveTab] = useState("users")
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const transactionsPerPage = 50

  // Add state for editing transactions
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState({ status: "", admin_note: "" })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user.isAdmin) {
          setIsAuthenticated(true)
          fetchAdminData()
        } else {
          localStorage.removeItem("flashbot_token")
          setLoading(false)
        }
      } else {
        localStorage.removeItem("flashbot_token")
        setLoading(false)
      }
    } catch (error) {
      console.error("Auth check error:", error)
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setErrors({})

    try {
      console.log("Attempting admin login with:", formData.email)

      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("Login response:", data)

      if (!response.ok) {
        setErrors({ general: data.error || "Login failed" })
        return
      }

      localStorage.setItem("flashbot_token", data.token)
      setIsAuthenticated(true)
      fetchAdminData()
    } catch (error) {
      console.error("Login error:", error)
      setErrors({ general: "Network error. Please try again." })
    } finally {
      setLoginLoading(false)
    }
  }

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")

      // Fetch users
      const usersResponse = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
      }

      // Fetch ALL transactions (no limit)
      const transactionsResponse = await fetch("/api/admin/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData.transactions)
      }

      // Fetch settings
      const settingsResponse = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSettings({
          ...settingsData.settings,
          topup_payment_amount: settingsData.settings.topup_payment_amount || "10000",
          topup_credit_amount: settingsData.settings.topup_credit_amount || "9500",
          upgrade_notification_enabled: settingsData.settings.upgrade_notification_enabled || "false", // Ensure this is set
          upgrade_completion_time: settingsData.settings.upgrade_completion_time || "", // Ensure this is set
        })
      }

      // Fetch Flutterwave settings
      const flutterwaveResponse = await fetch("/api/admin/flutterwave", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (flutterwaveResponse.ok) {
        const flutterwaveData = await flutterwaveResponse.json()
        setFlutterwaveSettings(flutterwaveData.settings)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch("/api/admin/users/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, isActive }),
      })

      if (response.ok) {
        fetchAdminData()
      }
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }

  const updateUserWallet = async (userId: number, amount: number, type: "credit" | "debit") => {
    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch("/api/admin/users/wallet", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, amount, type }),
      })

      if (response.ok) {
        fetchAdminData()
      }
    } catch (error) {
      console.error("Error updating wallet:", error)
    }
  }

  const updateSettings = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")

      const allSettings = {
        ...settings,
        topup_payment_amount: settings.topup_payment_amount || "10000",
        topup_credit_amount: settings.topup_credit_amount || "9500",
        upgrade_notification_enabled: settings.upgrade_notification_enabled || "false",
        upgrade_completion_time: settings.upgrade_completion_time || "",
      }

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(allSettings),
      })

      if (response.ok) {
        alert("Settings updated successfully!")
      }
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  }

  const updateFlutterwaveSettings = async () => {
    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch("/api/admin/flutterwave", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(flutterwaveSettings),
      })

      if (response.ok) {
        alert("Flutterwave settings updated successfully!")
      }
    } catch (error) {
      console.error("Error updating Flutterwave settings:", error)
    }
  }

  const deleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchAdminData()
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const revertTransaction = async (transactionId: number) => {
    if (!confirm("Are you sure you want to revert this transaction?")) return

    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch(`/api/admin/transactions/${transactionId}/revert`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchAdminData()
        alert("Transaction reverted successfully!")
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error reverting transaction:", error)
      alert("Error reverting transaction")
    }
  }

  const updateTransactionStatus = async () => {
    if (!editingTransaction) return

    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch(`/api/admin/transactions/${editingTransaction.id}/update`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: editForm.status,
          admin_note: editForm.admin_note,
        }),
      })

      if (response.ok) {
        fetchAdminData()
        setShowEditModal(false)
        setEditingTransaction(null)
        setEditForm({ status: "", admin_note: "" })
        alert("Transaction updated successfully!")
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error updating transaction:", error)
      alert("Error updating transaction")
    }
  }

  const startChatWithUser = async (userId: number) => {
    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch("/api/admin/chat/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Switch to chat tab after starting conversation
        setActiveTab("chat")
        // Refresh admin data to show new conversation
        fetchAdminData()
      }
    } catch (error) {
      console.error("Error starting chat:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <Shield className="w-8 h-8 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-white text-xl">Admin Access</CardTitle>
              <p className="text-gray-400 text-sm">Enter your admin credentials</p>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-xs">
                  <strong>Default Login:</strong>
                  <br />
                  Email: admin@flashbot.com
                  <br />
                  Password: flashbot123
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl text-sm flex items-center gap-3 bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors.general}
                  </motion.div>
                )}

                <div>
                  <Label htmlFor="email" className="text-gray-300 text-sm">
                    Admin Email
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-xl h-12"
                      placeholder="admin@flashbot.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-300 text-sm">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-xl h-12"
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white h-10 w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 text-base font-medium"
                >
                  {loginLoading ? "Signing In..." : "Admin Login"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  onClick={() => (window.location.href = "/")}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent text-sm"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.is_active).length
  const totalBalance = users.reduce((sum, u) => sum + safeNumber(u.wallet_balance), 0)
  const totalTransactions = transactions.length

  // Calculate proper statistics with safe number handling
  const totalSent = transactions
    .filter((t) => (t.type === "transfer" || t.type === "debit") && t.status === "completed")
    .reduce((sum, t) => sum + safeNumber(t.amount), 0)

  const totalReceived = transactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + safeNumber(t.amount), 0)

  const indexOfLastTransaction = currentPage * transactionsPerPage
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Add function to open the edit transaction modal
  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setEditForm({ status: transaction.status, admin_note: "" }) // Reset admin note on open
    setShowEditModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-2 sm:p-4">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">FLASHBOT Admin Panel</h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage users, transactions, and system settings</p>
          </div>
          <Button
            onClick={() => {
              localStorage.removeItem("flashbot_token")
              window.location.href = "/"
            }}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm w-fit"
          >
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Total Users</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg">
                  <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Active Users</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">{activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Total Balance</p>
                  <p className="text-sm sm:text-2xl font-bold text-white">{formatCurrency(totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-purple-500/10 rounded-lg">
                  <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Transactions</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">{totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row for Mobile */}
        <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg">
                  <ArrowUpRight className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Total Sent</p>
                  <p className="text-sm sm:text-xl font-bold text-white">{formatCurrency(totalSent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg">
                  <ArrowDownLeft className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Total Received</p>
                  <p className="text-sm sm:text-xl font-bold text-white">{formatCurrency(totalReceived)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 border-gray-700 grid grid-cols-5 w-full text-xs sm:text-sm">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              Users
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gray-700">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
              Settings
            </TabsTrigger>
            <TabsTrigger value="flutterwave" className="data-[state=active]:bg-gray-700">
              Flutterwave
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-gray-700">
              Live Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 sm:mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-white text-sm sm:text-base">User Management</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left text-gray-300 py-2 sm:py-3">User</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3">Email</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3">Balance</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3">Status</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700/50">
                          <td className="py-2 sm:py-4">
                            <div>
                              <p className="text-white font-medium text-xs sm:text-sm">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-gray-400 text-xs">ID: {user.id}</p>
                            </div>
                          </td>
                          <td className="py-2 sm:py-4 text-gray-300 text-xs sm:text-sm">{user.email}</td>
                          <td className="py-2 sm:py-4 text-white font-semibold text-xs sm:text-sm">
                            {formatCurrency(safeNumber(user.wallet_balance))}
                          </td>
                          <td className="py-2 sm:py-4">
                            <Badge
                              variant={user.is_active ? "default" : "secondary"}
                              className={`text-xs ${
                                user.is_active
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-2 sm:py-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserStatus(user.id, !user.is_active)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700 p-1 sm:p-2"
                              >
                                {user.is_active ? (
                                  <UserX className="w-3 h-3 sm:w-4 sm:h-4" />
                                ) : (
                                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const amount = prompt("Enter amount to credit:")
                                  if (amount) updateUserWallet(user.id, Number.parseFloat(amount), "credit")
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700 p-1 sm:p-2"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const amount = prompt("Enter amount to debit:")
                                  if (amount) updateUserWallet(user.id, Number.parseFloat(amount), "debit")
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700 p-1 sm:p-2"
                              >
                                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startChatWithUser(user.id)}
                                className="border-blue-600 text-blue-400 hover:bg-blue-700 p-1 sm:p-2"
                                title="Start Chat"
                              >
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              {!user.is_admin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteUser(user.id)}
                                  className="border-red-600 text-red-400 hover:bg-red-700 p-1 sm:p-2"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-4 sm:mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-white text-sm sm:text-base">
                  All Transactions ({totalTransactions})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left text-gray-300 py-2 sm:py-3">ID</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3">User</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3">Type</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3">Amount</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3">Status</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3">Date</th>
                        <th className="text-left text-gray-300 py-2 sm:py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTransactions.map((transaction) => {
                        const user = users.find((u) => u.id === transaction.user_id)
                        const isUserInactive = user && !user.is_active
                        const canRevert =
                          transaction.status === "pending" && isUserInactive && transaction.type === "transfer"

                        const getPendingReason = () => {
                          if (transaction.status === "pending") {
                            if (transaction.type === "transfer") {
                              return "User account not activated"
                            }
                            if (transaction.type === "activation" || transaction.type === "topup") {
                              return "Awaiting payment confirmation"
                            }
                          }
                          return null
                        }

                        return (
                          <tr key={transaction.id} className="border-b border-gray-700/50">
                            <td className="py-2 sm:py-4 text-gray-300 text-xs sm:text-sm">#{transaction.id}</td>
                            <td className="py-2 sm:py-4 text-white text-xs sm:text-sm">
                              {user ? `${user.first_name} ${user.last_name}` : "Unknown"}
                            </td>
                            <td className="py-2 sm:py-4">
                              <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                                {transaction.type}
                              </Badge>
                            </td>
                            <td className="py-2 sm:py-4 text-white font-semibold text-xs sm:text-sm">
                              {formatCurrency(safeNumber(transaction.amount))}
                            </td>
                            <td className="py-2 sm:py-4">
                              <div className="space-y-1">
                                <Badge
                                  variant={transaction.status === "completed" ? "default" : "secondary"}
                                  className={`text-xs ${
                                    transaction.status === "completed"
                                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  }`}
                                >
                                  {transaction.status}
                                </Badge>
                                {getPendingReason() && <p className="text-xs text-gray-500">{getPendingReason()}</p>}
                              </div>
                            </td>
                            <td className="py-2 sm:py-4 text-gray-300 text-xs sm:text-sm">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2 sm:py-4 flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(transaction)}
                                className="border-blue-600 text-blue-400 hover:bg-blue-700 text-xs p-1 sm:p-2"
                              >
                                Edit
                              </Button>
                              {canRevert && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => revertTransaction(transaction.id)}
                                  className="border-red-600 text-red-400 hover:bg-red-700 text-xs p-1 sm:p-2"
                                >
                                  Revert
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-center">
                  {Array.from({ length: Math.ceil(transactions.length / transactionsPerPage) }, (_, i) => (
                    <Button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      className="mx-1"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 sm:mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-white text-sm sm:text-base">System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="registrationBonus" className="text-gray-300 text-sm">
                      Registration Bonus (₦)
                    </Label>
                    <Input
                      id="registrationBonus"
                      type="number"
                      value={settings.registration_bonus}
                      onChange={(e) => setSettings((prev) => ({ ...prev, registration_bonus: e.target.value }))}
                      className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="countdownMinutes" className="text-gray-300 text-sm">
                      Countdown Minutes
                    </Label>
                    <Input
                      id="countdownMinutes"
                      type="number"
                      value={settings.countdown_minutes}
                      onChange={(e) => setSettings((prev) => ({ ...prev, countdown_minutes: e.target.value }))}
                      className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="activationFee" className="text-gray-300 text-sm">
                      Activation Fee (₦)
                    </Label>
                    <Input
                      id="activationFee"
                      type="number"
                      value={settings.activation_fee}
                      onChange={(e) => setSettings((prev) => ({ ...prev, activation_fee: e.target.value }))}
                      className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="topupPaymentAmount" className="text-gray-300 text-sm">
                      Top-up Payment Amount (₦)
                    </Label>
                    <Input
                      id="topupPaymentAmount"
                      type="number"
                      value={settings.topup_payment_amount || "10000"}
                      onChange={(e) => setSettings((prev) => ({ ...prev, topup_payment_amount: e.target.value }))}
                      className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="topupCreditAmount" className="text-gray-300 text-sm">
                      Top-up Credit Amount (₦)
                    </Label>
                    <Input
                      id="topupCreditAmount"
                      type="number"
                      value={settings.topup_credit_amount || "9500"}
                      onChange={(e) => setSettings((prev) => ({ ...prev, topup_credit_amount: e.target.value }))}
                      className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                    />
                    <p className="text-gray-500 text-xs mt-1">Amount credited to user wallet after payment</p>
                  </div>

                  <div>
                    <Label htmlFor="upgradeNotification" className="text-gray-300 text-sm">
                      Enable System Upgrade Notification
                    </Label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        id="upgradeNotification"
                        type="checkbox"
                        checked={settings.upgrade_notification_enabled === "true"}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            upgrade_notification_enabled: e.target.checked ? "true" : "false",
                          }))
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 cursor-pointer accent-green-600"
                      />
                      <span className="text-gray-400 text-sm">
                        {settings.upgrade_notification_enabled === "true" ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="upgradeTime" className="text-gray-300 text-sm">
                      Upgrade Completion Date & Time
                    </Label>
                    <Input
                      id="upgradeTime"
                      type="datetime-local"
                      value={
                        settings.upgrade_completion_time
                          ? new Date(settings.upgrade_completion_time).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const localDateTime = e.target.value
                        if (localDateTime) {
                          const date = new Date(localDateTime)
                          setSettings((prev) => ({ ...prev, upgrade_completion_time: date.toISOString() }))
                        }
                      }}
                      className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                    />
                    <p className="text-gray-500 text-xs mt-1">Set when the system upgrade will be completed</p>
                  </div>
                </div>

                <Button onClick={updateSettings} className="bg-green-600 hover:bg-green-700 text-white text-sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Update Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flutterwave" className="mt-4 sm:mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base">
                  <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                  Flutterwave API Configuration
                </CardTitle>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Configure your Flutterwave API keys for payment processing
                </p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-gray-300 text-sm">Show API Keys</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                  >
                    {showApiKeys ? (
                      <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="secretKey" className="text-gray-300 text-sm">
                      Secret Key
                    </Label>
                    <Input
                      id="secretKey"
                      type={showApiKeys ? "text" : "password"}
                      value={flutterwaveSettings.flutterwave_secret_key}
                      onChange={(e) =>
                        setFlutterwaveSettings((prev) => ({ ...prev, flutterwave_secret_key: e.target.value }))
                      }
                      className="mt-1 bg-gray-700 border-gray-600 text-white font-mono text-xs sm:text-sm"
                      placeholder="FLWSECK_TEST-..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="publicKey" className="text-gray-300 text-sm">
                      Public Key
                    </Label>
                    <Input
                      id="publicKey"
                      type={showApiKeys ? "text" : "password"}
                      value={flutterwaveSettings.flutterwave_public_key}
                      onChange={(e) =>
                        setFlutterwaveSettings((prev) => ({ ...prev, flutterwave_public_key: e.target.value }))
                      }
                      className="mt-1 bg-gray-700 border-gray-600 text-white font-mono text-xs sm:text-sm"
                      placeholder="FLWPUBK_TEST-..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="encryptionKey" className="text-gray-300 text-sm">
                      Encryption Key
                    </Label>
                    <Input
                      id="encryptionKey"
                      type={showApiKeys ? "text" : "password"}
                      value={flutterwaveSettings.flutterwave_encryption_key}
                      onChange={(e) =>
                        setFlutterwaveSettings((prev) => ({ ...prev, flutterwave_encryption_key: e.target.value }))
                      }
                      className="mt-1 bg-gray-700 border-gray-600 text-white font-mono text-xs sm:text-sm"
                      placeholder="FLWSECK_TEST..."
                    />
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
                  <p className="text-yellow-400 text-xs sm:text-sm">
                    <strong>Important:</strong> These API keys are stored securely and used for payment processing. Make
                    sure to use your live keys for production.
                  </p>
                </div>

                <Button
                  onClick={updateFlutterwaveSettings}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Update Flutterwave Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-4 sm:mt-6">
            <AdminChatPanel />
          </TabsContent>
        </Tabs>

        {showEditModal && editingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Edit Transaction #{editingTransaction.id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="reverted">Reverted</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Admin Note</Label>
                  <textarea
                    value={editForm.admin_note}
                    onChange={(e) => setEditForm({ ...editForm, admin_note: e.target.value })}
                    placeholder="Add a note to this transaction..."
                    className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingTransaction(null)
                    }}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button onClick={updateTransactionStatus} className="bg-blue-600 hover:bg-blue-700">
                    Update Transaction
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
