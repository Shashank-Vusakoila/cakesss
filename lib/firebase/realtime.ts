import { ref, set, onValue, off } from 'firebase/database'
import { rtdb } from './config'
import { DeliveryLocation } from '@/types'

// Write delivery partner's current location
export function updateDeliveryLocation(orderId: string, lat: number, lng: number) {
  const locationRef = ref(rtdb, `deliveryLocations/${orderId}`)
  return set(locationRef, {
    lat,
    lng,
    updatedAt: Date.now(),
  })
}

// Subscribe to live location updates for an order
export function subscribeToDeliveryLocation(
  orderId: string,
  callback: (location: DeliveryLocation | null) => void
) {
  const locationRef = ref(rtdb, `deliveryLocations/${orderId}`)
  const handler = onValue(locationRef, (snapshot) => {
    const data = snapshot.val()
    callback(data || null)
  })
  // Return unsubscribe function
  return () => off(locationRef)
}

// Clear delivery location when delivered
export function clearDeliveryLocation(orderId: string) {
  const locationRef = ref(rtdb, `deliveryLocations/${orderId}`)
  return set(locationRef, null)
}
