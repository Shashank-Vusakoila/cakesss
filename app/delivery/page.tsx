'use client'
import { useEffect, useState, useRef } from 'react'
import { subscribeToOrders, updateOrderStatus } from '@/lib/firebase/firestore'
import { updateDeliveryLocation, clearDeliveryLocation } from '@/lib/firebase/realtime'
import { Order } from '@/types'
import { motion } from 'framer-motion'
import { MapPin, Navigation, StopCircle, RefreshCw, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function DeliveryPartnerPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Only fetch orders that are ready or out for delivery
    const unsub = subscribeToOrders((all) => {
      const active = all.filter(o => o.status === 'ready' || o.status === 'out_for_delivery')
      // Sort: out for delivery first
      active.sort((a, b) => {
        if (a.status === 'out_for_delivery' && b.status !== 'out_for_delivery') return -1
        if (b.status === 'out_for_delivery' && a.status !== 'out_for_delivery') return 1
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
      setOrders(active)
    })
    return () => unsub()
  }, [])

  // Check if we are currently tracking an order on mount (could be persisted in session, but keeping simple)
  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [])

  const startTracking = (orderId: string) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setTrackingId(orderId)
    updateOrderStatus(orderId, 'out_for_delivery')
    toast.success('Started sharing live location')

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation({ lat: latitude, lng: longitude })
        // Send to Firebase Realtime DB
        updateDeliveryLocation(orderId, latitude, longitude)
      },
      (err) => {
        console.error(err)
        toast.error('Failed to get location. Please check permissions.')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (trackingId) {
      clearDeliveryLocation(trackingId)
      setTrackingId(null)
    }
    setLocation(null)
  }

  const markDelivered = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'delivered')
      if (trackingId === orderId) {
        stopTracking()
      }
      toast.success('Order marked as delivered!')
    } catch (e) {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="min-h-screen bg-brand-background pb-20">
      <div className="bg-brand-dark pt-12 pb-6 px-4 shadow-xl">
        <Link href="/admin/dashboard" className="text-white/60 text-sm hover:text-white mb-2 inline-block">
          ← Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Navigation size={28} className="text-brand-primary" />
          Delivery Mode
        </h1>
        <p className="text-white/70 mt-1">Manage active deliveries and share live location.</p>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-6">
        {trackingId && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-brand-primary/10 border border-brand-primary rounded-2xl p-5 mb-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-brand-dark">
              <div className="relative w-4 h-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-brand-primary rounded-full animate-ping opacity-75"></div>
                <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
              </div>
              <p className="font-bold">Sharing Live Location (Order #{orders.find(o => o.id === trackingId)?.orderNumber})</p>
            </div>
            {location && (
              <p className="text-xs text-brand-dark font-mono">
                Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
              </p>
            )}
            <button
              onClick={stopTracking}
              className="bg-white text-red-600 font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors border border-red-100"
            >
              <StopCircle size={18} /> Stop Sharing
            </button>
          </motion.div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-brand-card rounded-3xl shadow-sm border border-brand-border">
            <div className="text-5xl mb-4">🙌</div>
            <h2 className="font-bold text-brand-dark text-xl">All caught up!</h2>
            <p className="text-brand-text-light">No orders waiting for delivery right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className={`bg-brand-card rounded-3xl p-5 shadow-sm border transition-colors ${trackingId === order.id ? 'border-brand-primary ring-4 ring-brand-primary/10' : 'border-brand-border'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-brand-text-light bg-brand-border px-2 py-0.5 rounded uppercase">
                      {order.status === 'out_for_delivery' ? 'Out for Delivery' : 'Ready'}
                    </span>
                    <h3 className="font-bold text-brand-dark text-lg mt-1">#{order.orderNumber}</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-primary">₹{order.total}</p>
                    <p className="text-xs text-brand-text-light">{order.paymentMethod}</p>
                  </div>
                </div>

                <div className="bg-brand-background rounded-2xl p-4 flex gap-3 my-4">
                  <MapPin size={20} className="text-brand-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-brand-dark">{order.customerName}</p>
                    <p className="text-sm text-brand-text-dark mt-0.5 mb-1">{order.customerPhone}</p>
                    <p className="text-xs text-brand-text-light leading-relaxed">{order.customerAddress}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === 'ready' || (order.status === 'out_for_delivery' && trackingId !== order.id) ? (
                    <button
                      onClick={() => startTracking(order.id)}
                      disabled={trackingId !== null}
                      className="flex-1 bg-brand-primary hover:bg-brand-orange-dark text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Navigation size={18} /> Start Delivery
                    </button>
                  ) : (
                    <button
                      onClick={() => markDelivered(order.id)}
                      className="flex-1 bg-brand-primary hover:bg-brand-orange-dark text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
