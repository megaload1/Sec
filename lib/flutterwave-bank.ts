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

    const responseData = await response.json()

    if (!response.ok) {
      console.error("Flutterwave verifyAccountNumber error:", responseData)

      // Return structured error response instead of throwing
      return {
        status: "error",
        message: responseData.message || "Account verification failed",
        data: null,
      }
    }

    // Return successful response
    return {
      status: "success",
      message: "Account verified successfully",
      data: responseData.data,
    }
  } catch (error: any) {
    console.error("verifyAccountNumber error:", error)

    // Return structured error response for network/connection issues
    return {
      status: "error",
      message: error.message || "Network error occurred during verification",
      data: null,
    }
  }
}

// Bank Transfer ONLY Payment - No other methods
export async function createBankTransferOnlyPayment(
  email: string,
  amount: number,
  reference: string,
  customerName: string,
  phone = "08012345678",
) {
  try {
    const keys = await getFlutterwaveKeys()

    const payload = {
      tx_ref: reference,
      amount: amount,
      currency: "NGN",
      email: email,
      phone_number: phone,
      fullname: customerName,
      // ONLY bank transfer - no other payment methods
      payment_type: "banktransfer",
      meta: {
        consumer_id: reference,
        consumer_mac: "92a3-912ba-1192a",
        payment_method: "banktransfer_only",
      },
      customizations: {
        title: "FLASHBOT Bank Transfer",
        description: "Complete payment via Bank Transfer only",
        logo: "https://your-logo-url.com/logo.png",
      },
    }

    console.log("Creating BANK TRANSFER ONLY payment:", JSON.stringify(payload, null, 2))

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/charges?type=bank_transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()
    console.log("Bank transfer only response:", JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error("Flutterwave createBankTransferOnlyPayment error:", responseData)
      throw new Error(responseData.message || "Failed to create bank transfer payment")
    }

    return responseData
  } catch (error) {
    console.error("createBankTransferOnlyPayment error:", error)
    throw error
  }
}

// Alternative: Use hosted payment but restrict to bank transfer only
export async function createHostedBankTransferOnly(
  email: string,
  amount: number,
  reference: string,
  customerName: string,
  phone = "08012345678",
  redirectUrl: string,
) {
  try {
    const keys = await getFlutterwaveKeys()

    const payload = {
      tx_ref: reference,
      amount: amount,
      currency: "NGN",
      redirect_url: redirectUrl,
      // ONLY bank transfer payment method
      payment_options: "banktransfer",
      payment_plan: "",
      meta: {
        consumer_id: reference,
        consumer_mac: "92a3-912ba-1192a",
        payment_method: "banktransfer_only",
      },
      customer: {
        email: email,
        phonenumber: phone,
        name: customerName,
      },
      customizations: {
        title: "FLASHBOT Bank Transfer",
        description: "Pay via Bank Transfer - Account details will be provided",
        logo: "https://your-logo-url.com/logo.png",
      },
      // Force bank transfer only
      configurations: {
        session_duration: 15, // 15 minutes session
        max_retry_attempt: 3,
      },
    }

    console.log("Creating hosted BANK TRANSFER ONLY payment:", JSON.stringify(payload, null, 2))

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()
    console.log("Hosted bank transfer only response:", JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error("Flutterwave createHostedBankTransferOnly error:", responseData)
      throw new Error(responseData.message || `HTTP ${response.status}: Failed to create bank transfer payment`)
    }

    return responseData
  } catch (error) {
    console.error("createHostedBankTransferOnly error:", error)
    throw error
  }
}

export async function verifyPayment(transactionId: string) {
  try {
    const keys = await getFlutterwaveKeys()

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`, {
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
    })

    const responseData = await response.json()
    console.log("Verify payment response:", JSON.stringify(responseData, null, 2))

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

export async function getTransactionStatus(reference: string) {
  try {
    const keys = await getFlutterwaveKeys()

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${reference}`, {
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
    })

    const responseData = await response.json()
    console.log("Transaction status response:", JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error("Flutterwave getTransactionStatus error:", responseData)
      throw new Error(responseData.message || "Failed to get transaction status")
    }

    return responseData
  } catch (error) {
    console.error("getTransactionStatus error:", error)
    throw error
  }
}

// Legacy compatibility - now uses bank transfer only
export const createHostedPayment = createHostedBankTransferOnly
export const createBankTransferPayment = createBankTransferOnlyPayment
export const verifyBankTransferPayment = verifyPayment
