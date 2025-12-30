"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { NotificationModal } from "@/components/notification-modal"

interface NotificationContextType {
  showSuccess: (title: string, message: string) => void
  showError: (title: string, message: string) => void
  showWarning: (title: string, message: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notification, setNotification] = useState<{
    isOpen: boolean
    type: "success" | "error" | "warning"
    title: string
    message: string
    autoClose: boolean
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    autoClose: false,
  })

  const showNotification = useCallback(
    (type: "success" | "error" | "warning", title: string, message: string, autoClose = false) => {
      setNotification({
        isOpen: true,
        type,
        title,
        message,
        autoClose,
      })

      if (autoClose) {
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, isOpen: false }))
        }, 3000)
      }
    },
    [],
  )

  const showSuccess = useCallback(
    (title: string, message: string) => {
      showNotification("success", title, message, true)
    },
    [showNotification],
  )

  const showError = useCallback(
    (title: string, message: string) => {
      showNotification("error", title, message, false)
    },
    [showNotification],
  )

  const showWarning = useCallback(
    (title: string, message: string) => {
      showNotification("warning", title, message, false)
    },
    [showNotification],
  )

  const closeNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showWarning }}>
      {children}
      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
        autoClose={notification.autoClose}
      />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}
