"use client"

import type React from "react"

import { useState } from "react"
import { X, User, Lock, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotification } from "@/contexts/notification-context"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    firstName: string
    lastName: string
    email: string
  }
  onSuccess: () => void
}

export function SettingsModal({ isOpen, onClose, user, onSuccess }: SettingsModalProps) {
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { showSuccess, showError } = useNotification()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim()) {
      showError("Validation Error", "First name and last name are required")
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      showError("Validation Error", "New passwords do not match")
      return
    }

    if (newPassword && newPassword.length < 6) {
      showError("Validation Error", "Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem("flashbot_token")
      const response = await fetch("/api/user/profile/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess("Profile Updated", "Your profile has been updated successfully")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        onSuccess()
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        showError("Update Failed", data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Settings: Error updating profile:", error)
      showError("Connection Error", "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800/50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800/50 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-white">Account Settings</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Personal Information</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm text-slate-300">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600"
                placeholder="Enter first name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm text-slate-300">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600"
                placeholder="Enter last name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-slate-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">Email cannot be changed</p>
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Change Password</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm text-slate-300">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600"
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm text-slate-300">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600"
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-slate-300">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-slate-600"
                placeholder="Confirm new password"
              />
            </div>

            <p className="text-xs text-slate-500">Leave password fields empty to keep current password</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-700/50 text-slate-300 hover:bg-slate-800/50 bg-transparent"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-slate-700 hover:bg-slate-600 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
