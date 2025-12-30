"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface DiagnosisData {
  settings_count: number
  topup_settings: {
    payment_amount: any
    credit_amount: any
  }
  recent_topup_transactions: any[]
  all_settings: any[]
}

export default function DiagnosePage() {
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const runDiagnosis = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch("/api/admin/diagnose", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setDiagnosis(data.diagnosis)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to run diagnosis")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnosis()
  }, [])

  const getStatusIcon = (hasError: boolean) => {
    if (hasError) return <XCircle className="w-5 h-5 text-red-400" />
    return <CheckCircle className="w-5 h-5 text-green-400" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">System Diagnosis</h1>
            <p className="text-gray-400">Check system settings and configuration</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={runDiagnosis} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Run Diagnosis
            </Button>
            <Button
              onClick={() => (window.location.href = "/prechy")}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Back to Admin
            </Button>
          </div>
        </div>

        {error && (
          <Card className="bg-red-500/10 border-red-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {diagnosis && (
          <div className="space-y-6">
            {/* Topup Settings Status */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {getStatusIcon(
                    diagnosis.topup_settings.payment_amount.error || diagnosis.topup_settings.credit_amount.error,
                  )}
                  Topup Settings Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">Payment Amount</h3>
                    {diagnosis.topup_settings.payment_amount.error ? (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                        {diagnosis.topup_settings.payment_amount.error}
                      </Badge>
                    ) : (
                      <div>
                        <p className="text-green-400 font-bold text-lg">
                          ₦{Number.parseFloat(diagnosis.topup_settings.payment_amount.setting_value).toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Updated: {new Date(diagnosis.topup_settings.payment_amount.updated_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">Credit Amount</h3>
                    {diagnosis.topup_settings.credit_amount.error ? (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                        {diagnosis.topup_settings.credit_amount.error}
                      </Badge>
                    ) : (
                      <div>
                        <p className="text-green-400 font-bold text-lg">
                          ₦{Number.parseFloat(diagnosis.topup_settings.credit_amount.setting_value).toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Updated: {new Date(diagnosis.topup_settings.credit_amount.updated_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Topup Transactions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Topup Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {diagnosis.recent_topup_transactions.length === 0 ? (
                  <p className="text-gray-400">No topup transactions found</p>
                ) : (
                  <div className="space-y-3">
                    {diagnosis.recent_topup_transactions.map((transaction: any) => (
                      <div key={transaction.id} className="p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">Transaction #{transaction.id}</p>
                            <p className="text-gray-400 text-sm">{transaction.description}</p>
                            <p className="text-gray-500 text-xs">{new Date(transaction.created_at).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-semibold">₦{transaction.amount.toLocaleString()}</p>
                            <Badge
                              className={
                                transaction.status === "completed"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Admin Settings ({diagnosis.settings_count})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagnosis.all_settings.map((setting: any) => (
                    <div key={setting.setting_name} className="p-3 bg-gray-700/30 rounded-lg">
                      <h4 className="text-white font-medium">{setting.setting_name}</h4>
                      <p className="text-green-400">{setting.setting_value}</p>
                      <p className="text-gray-500 text-xs">Updated: {new Date(setting.updated_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
