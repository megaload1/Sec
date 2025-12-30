"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, Search, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Bank {
  id: number
  code: string
  name: string
}

interface SendMoneyModalProps {
  isOpen: boolean
  onClose: () => void
  userBalance: number
  onSuccess: () => void
}

export function SendMoneyModal({ isOpen, onClose, userBalance, onSuccess }: SendMoneyModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankSearchQuery, setBankSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    amount: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchBanks()
    }
  }, [isOpen])

  // Filter banks based on search query
  const filteredBanks = useMemo(() => {
    if (!bankSearchQuery.trim()) return banks

    const query = bankSearchQuery.toLowerCase()
    return banks.filter((bank) => bank.name.toLowerCase().includes(query) || bank.code.toLowerCase().includes(query))
  }, [banks, bankSearchQuery])

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/banks")
      if (response.ok) {
        const data = await response.json()
        setBanks(data.banks || [])
      }
    } catch (error) {
      console.error("Error fetching banks:", error)
    }
  }

  const verifyAccount = async () => {
    if (formData.accountNumber.length !== 10) {
      setErrors({ accountNumber: "Account number must be 10 digits" })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: formData.accountNumber,
          bankCode: formData.bankCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Use the specific error message from the API
        setErrors({ accountNumber: data.error || "Failed to verify account" })
        return
      }

      if (data.success && data.account_name) {
        setFormData((prev) => ({ ...prev, accountName: data.account_name }))
        setStep(2)
      } else {
        setErrors({ accountNumber: "Account could not be verified. Please check the details." })
      }
    } catch (error) {
      console.error("Account verification error:", error)
      setErrors({ accountNumber: "Network error. Please check your connection and try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMoney = async () => {
    const amount = Number.parseFloat(formData.amount)

    if (!amount || amount <= 0) {
      setErrors({ amount: "Please enter a valid amount" })
      return
    }

    if (amount > userBalance) {
      setErrors({ amount: "Insufficient balance" })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/send-money", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("flashbot_token")}`,
        },
        body: JSON.stringify({
          bankCode: formData.bankCode,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          amount: amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || "Failed to send money" })
        return
      }

      setStep(4)
      onSuccess()
    } catch (error) {
      setErrors({ general: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setFormData({
      bankCode: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
      amount: "",
    })
    setErrors({})
    setBankSearchQuery("")
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white">
                  {step === 1
                    ? "Enter Account Details"
                    : step === 2
                      ? "Enter Amount"
                      : step === 3
                        ? "Confirm Transfer"
                        : "Transfer Complete"}
                </h2>
                <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* CBN Warning - Show on all steps */}
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      <strong>CBN WARNING</strong>
                    </div>
                    <p className="leading-relaxed">
                      Funds generated by FLASHBOT AI, not CBN verified. May be auto-debited from recipient within 48hrs.
                    </p>
                  </div>

                  {errors.general && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
                      {errors.general}
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bank" className="text-gray-300">
                          Select Bank
                        </Label>

                        {/* Bank Search Input */}
                        <div className="relative mt-1 mb-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="text"
                            placeholder="Search banks..."
                            value={bankSearchQuery}
                            onChange={(e) => setBankSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-10"
                          />
                        </div>

                        <Select
                          value={formData.bankCode}
                          onValueChange={(value) => {
                            const selectedBank = banks.find((bank) => bank.code === value)
                            setFormData((prev) => ({
                              ...prev,
                              bankCode: value,
                              bankName: selectedBank?.name || "",
                            }))
                            setBankSearchQuery("") // Clear search after selection
                          }}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Choose a bank" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                            {filteredBanks.length === 0 ? (
                              <div className="p-3 text-gray-400 text-sm text-center">
                                {bankSearchQuery ? `No banks found for "${bankSearchQuery}"` : "No banks available"}
                              </div>
                            ) : (
                              filteredBanks.map((bank) => (
                                <SelectItem
                                  key={bank.id}
                                  value={bank.code}
                                  className="text-white hover:bg-gray-600 focus:bg-gray-600"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{bank.name}</span>
                                    <span className="text-xs text-gray-400">{bank.code}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>

                        {bankSearchQuery && (
                          <p className="text-gray-500 text-xs mt-1">
                            Showing {filteredBanks.length} of {banks.length} banks
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="accountNumber" className="text-gray-300">
                          Account Number
                        </Label>
                        <Input
                          id="accountNumber"
                          type="text"
                          maxLength={10}
                          value={formData.accountNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "")
                            setFormData((prev) => ({ ...prev, accountNumber: value }))
                            setErrors((prev) => ({ ...prev, accountNumber: "" }))
                          }}
                          className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          placeholder="0123456789"
                        />
                        {errors.accountNumber && <p className="text-red-400 text-sm mt-1">{errors.accountNumber}</p>}
                      </div>

                      <Button
                        onClick={verifyAccount}
                        disabled={!formData.bankCode || formData.accountNumber.length !== 10 || loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {loading ? "Verifying..." : "Verify Account"}
                      </Button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-700/50 rounded-lg">
                        <p className="text-gray-300 text-sm">Account Details</p>
                        <p className="text-white font-medium">{formData.accountName}</p>
                        <p className="text-gray-400 text-sm">
                          {formData.accountNumber} • {formData.bankName}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="amount" className="text-gray-300">
                          Amount to Send
                        </Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₦</span>
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            max={userBalance}
                            value={formData.amount}
                            onChange={(e) => {
                              setFormData((prev) => ({ ...prev, amount: e.target.value }))
                              setErrors((prev) => ({ ...prev, amount: "" }))
                            }}
                            className="pl-8 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                        {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount}</p>}
                        <p className="text-gray-400 text-xs mt-1">Available balance: ₦{userBalance.toLocaleString()}</p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setStep(1)}
                          variant="outline"
                          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => setStep(3)}
                          disabled={!formData.amount || Number.parseFloat(formData.amount) <= 0}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-700/50 rounded-lg space-y-3">
                        <h3 className="text-white font-medium">Confirm Transfer</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Recipient:</span>
                            <span className="text-white">{formData.accountName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Account:</span>
                            <span className="text-white">{formData.accountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Bank:</span>
                            <span className="text-white">{formData.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-white font-medium">
                              ₦{Number.parseFloat(formData.amount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <p className="text-yellow-400 text-xs">
                          Please ensure all details are correct. This action cannot be undone.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setStep(2)}
                          variant="outline"
                          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleSendMoney}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {loading ? "Sending..." : "Send Money"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <ArrowRight className="w-8 h-8 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-2">Transfer Initiated</h3>
                        <p className="text-gray-400 text-sm">
                          Your transfer of ₦{Number.parseFloat(formData.amount).toLocaleString()} to{" "}
                          {formData.accountName} has been initiated.
                        </p>
                      </div>

                      {/* Final CBN Warning */}
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-xs">
                          <strong>Remember:</strong> This transfer uses FLASHBOT AI. Funds may be reversed within 48
                          hours as they are not CBN verified.
                        </p>
                      </div>

                      <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Done
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
