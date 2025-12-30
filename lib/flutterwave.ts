import { sql } from "./db"

// Get Flutterwave keys from admin settings
async function getFlutterwaveKeys() {
  const settings = await sql`
    SELECT setting_name, setting_value FROM admin_settings
    WHERE setting_name IN ('flutterwave_secret_key', 'flutterwave_public_key', 'flutterwave_encryption_key')
  `

  const keys = settings.reduce((acc: any, setting) => {
    acc[setting.setting_name] = setting.setting_value
    return acc
  }, {})

  if (!keys.flutterwave_secret_key || !keys.flutterwave_public_key) {
    throw new Error("Flutterwave API keys not configured. Please contact admin.")
  }

  return keys
}

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"

export async function getBankList() {
  try {
    const keys = await getFlutterwaveKeys()

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/banks/NG`, {
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Flutterwave getBankList error:", errorData)
      throw new Error(errorData.message || "Failed to fetch banks")
    }

    return response.json()
  } catch (error) {
    console.error("getBankList error:", error)
    throw error
  }
}

export async function verifyAccountNumber(accountNumber: string, bankCode: string) {
  try {
    const keys = await getFlutterwaveKeys()

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/accounts/resolve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_number: accountNumber,
        account_bank: bankCode,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Flutterwave verifyAccountNumber error:", errorData)
      throw new Error(errorData.message || "Failed to verify account")
    }

    return response.json()
  } catch (error) {
    console.error("verifyAccountNumber error:", error)
    throw error
  }
}

// Legacy compatibility functions
export const createHostedPayment = async () => {
  throw new Error("Hosted payments are no longer supported. Use virtual accounts instead.")
}

export const createHostedBankTransferOnly = async () => {
  throw new Error("Hosted payments are no longer supported. Use virtual accounts instead.")
}

export const createBankTransferOnlyPayment = async () => {
  throw new Error("Hosted payments are no longer supported. Use virtual accounts instead.")
}

export const verifyBankTransferPayment = async (transactionId: string) => {
  try {
    const keys = await getFlutterwaveKeys()

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`, {
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
    })

    const responseData = await response.json()
    console.log("Payment verification:", JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error("Flutterwave verifyPayment error:", responseData)
      throw new Error(responseData.message || "Failed to verify payment")
    }

    return responseData
  } catch (error) {
    console.error("verifyPayment error:", error)
    throw error
  }
}
