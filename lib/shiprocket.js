// Shiprocket API integration utilities

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD

let tokenCache = null
let tokenExpiry = null

/**
 * Get Shiprocket authentication token
 * @returns {Promise<string|null>} Authentication token or null if failed
 */
export async function getShiprocketToken() {
    try {
        // Check if we have a valid cached token
        if (tokenCache && tokenExpiry && Date.now() < tokenExpiry) {
            return tokenCache
        }

        if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
            console.error('Shiprocket credentials not configured')
            return null
        }

        const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: SHIPROCKET_EMAIL,
                password: SHIPROCKET_PASSWORD
            })
        })

        const data = await response.json()

        if (!response.ok || !data.token) {
            console.error('Shiprocket login failed:', data)
            return null
        }

        // Cache token for 24 hours (Shiprocket tokens are valid for 24 hours)
        tokenCache = data.token
        tokenExpiry = Date.now() + (24 * 60 * 60 * 1000) - 60000 // 24 hours minus 1 minute buffer

        return tokenCache
    } catch (error) {
        console.error('Error getting Shiprocket token:', error)
        return null
    }
}

/**
 * Create shipment in Shiprocket
 * @param {Object} shipmentData - Shipment data
 * @returns {Promise<Object>} Shiprocket response
 */
export async function createShipment(shipmentData) {
    const token = await getShiprocketToken()
    if (!token) {
        throw new Error('Failed to get Shiprocket token')
    }

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shipmentData)
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(`Shiprocket API error: ${data.message || 'Unknown error'}`)
    }

    return data
}

/**
 * Generate shipping label
 * @param {Array<number>} shipmentIds - Array of shipment IDs
 * @returns {Promise<Object>} Label generation response
 */
export async function generateLabel(shipmentIds) {
    const token = await getShiprocketToken()
    if (!token) {
        throw new Error('Failed to get Shiprocket token')
    }

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            shipment_id: shipmentIds
        })
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(`Shiprocket label generation failed: ${data.message || 'Unknown error'}`)
    }

    return data
}

/**
 * Track shipment
 * @param {string} awb - Airway bill number
 * @returns {Promise<Object>} Tracking information
 */
export async function trackShipment(awb) {
    const token = await getShiprocketToken()
    if (!token) {
        throw new Error('Failed to get Shiprocket token')
    }

    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(`Shiprocket tracking failed: ${data.message || 'Unknown error'}`)
    }

    return data
}

/**
 * Cancel shipment
 * @param {Array<number>} shipmentIds - Array of shipment IDs to cancel
 * @returns {Promise<Object>} Cancellation response
 */
export async function cancelShipment(shipmentIds) {
    const token = await getShiprocketToken()
    if (!token) {
        throw new Error('Failed to get Shiprocket token')
    }

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/cancel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            ids: shipmentIds
        })
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(`Shiprocket cancellation failed: ${data.message || 'Unknown error'}`)
    }

    return data
}