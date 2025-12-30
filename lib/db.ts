import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

export interface User {
  id: number
  email: string
  password_hash: string
  first_name: string
  last_name: string
  wallet_balance: number
  is_active: boolean
  is_admin: boolean
  registration_countdown_end: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
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

export interface AdminSetting {
  id: number
  setting_name: string
  setting_value: string
  updated_at: string
}
