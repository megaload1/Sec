"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationModalProps {
  isOpen: boolean
  type: "success" | "error" | "warning"
  title: string
  message: string
  onClose: () => void
  autoClose?: boolean
}

export function NotificationModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  autoClose = false,
}: NotificationModalProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-400" />
      case "error":
        return <XCircle className="w-6 h-6 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />
    }
  }

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/20",
          button: "bg-green-600 hover:bg-green-700",
        }
      case "error":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          button: "bg-red-600 hover:bg-red-700",
        }
      case "warning":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          button: "bg-yellow-600 hover:bg-yellow-700",
        }
    }
  }

  const colors = getColors()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`relative bg-gray-800 border ${colors.border} rounded-2xl shadow-2xl max-w-md w-full p-6`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 ${colors.bg} rounded-lg flex-shrink-0`}>{getIcon()}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
              </div>
              {!autoClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-1 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {!autoClose && (
              <div className="flex justify-end mt-6">
                <Button onClick={onClose} className={`${colors.button} text-white px-6`}>
                  OK
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
