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

// Create Virtual Account Number using Flutterwave Virtual Account API
export async function createVirtualAccountNumber(
  email: string,
  amount: number,
  reference: string,
  customerName: string,
  phone = "08012345678",
) {
  try {
    const keys = await getFlutterwaveKeys()

    const nameParts = customerName.split(" ")
    const firstName = nameParts[0] || "User"
    const lastName = nameParts.slice(1).join(" ") || "Name"

    const payload = {
      email: email,
      is_permanent: false,
      bvn: "12345678901", // In production, collect real BVN
      tx_ref: reference,
      phonenumber: phone,
      firstname: firstName,
      lastname: lastName,
      narration: `BST array Payment ${reference}`,
      amount: amount,
    }

    console.log("Creating virtual account number:", JSON.stringify(payload, null, 2))

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/virtual-account-numbers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()
    console.log("Virtual account number response:", JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error("Flutterwave createVirtualAccountNumber error:", responseData)
      throw new Error(responseData.message || "Failed to create virtual account number")
    }

    if (responseData.status === "success" && responseData.data) {
      return {
        status: "success",
        data: {
          account_number: responseData.data.account_number,
          account_name: responseData.data.account_name || "BST array",
          bank_name: responseData.data.bank_name || "Wema Bank",
          expires_at: responseData.data.expires_at,
          flw_ref: responseData.data.flw_ref || responseData.data.id,
        },
      }
    }

    return responseData
  } catch (error) {
    console.error("createVirtualAccountNumber error:", error)
    throw error
  }
}

// Create Bank Transfer using Standard Payment API
export async function createBankTransferPayment(
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
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment-callback`,
      payment_options: "banktransfer",
      customer: {
        email: email,
        phonenumber: phone,
        name: customerName,
      },
      customizations: {
        title: "FLASHBOT Payment",
        description: `BST array Payment for ${reference}`,
        logo: "",
      },
      meta: {
        consumer_id: reference,
        consumer_mac: "92a3-912ba-1192a",
      },
    }

    console.log("Creating bank transfer payment:", JSON.stringify(payload, null, 2))

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()
    console.log("Bank transfer payment response:", JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error("Flutterwave createBankTransferPayment error:", responseData)
      throw new Error(responseData.message || "Failed to create bank transfer payment")
    }

    return responseData
  } catch (error) {
    console.error("createBankTransferPayment error:", error)
    throw error
  }
}

// Create Bank Transfer Charge (Alternative method)
export async function createBankTransferCharge(
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
      payment_type: "banktransfer",
      meta: {
        consumer_id: reference,
        consumer_mac: "92a3-912ba-1192a",
      },
    }

    console.log("Creating bank transfer charge:", JSON.stringify(payload, null, 2))

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/charges?type=bank_transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()
    console.log("Bank transfer charge response:", JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error("Flutterwave createBankTransferCharge error:", responseData)
      throw new Error(responseData.message || "Failed to create bank transfer charge")
    }

    return responseData
  } catch (error) {
    console.error("createBankTransferCharge error:", error)
    throw error
  }
}

// Check Payment Status by Reference
export async function checkPaymentStatus(reference: string) {
  try {
    const keys = await getFlutterwaveKeys()

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${reference}`, {
      headers: {
        Authorization: `Bearer ${keys.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
    })

    const responseData = await response.json()
    console.log("Payment status check response:", JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error("Flutterwave checkPaymentStatus error:", responseData)
      throw new Error(responseData.message || "Failed to check payment status")
    }

    return responseData
  } catch (error) {
    console.error("checkPaymentStatus error:", error)
    throw error
  }
}

// Verify Payment by Transaction ID
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
    console.log("Payment verification response:", JSON.stringify(responseData, null, 2))

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

// Get Transaction Status by Reference
export async function getTransactionStatus(reference: string) {
  return checkPaymentStatus(reference)
}

// Legacy compatibility
export const verifyBankTransferPayment = verifyPayment
