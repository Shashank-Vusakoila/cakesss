'use client'
import { useEffect, useState, useRef } from 'react'
import { subscribeToOrders, updateOrderStatus } from '@/lib/firebase/firestore'
import { updateDeliveryLocation, clearDeliveryLocation } from '@/lib/firebase/realtime'
import { Order } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, StopCircle, User, Phone, Package, Truck, Home, CheckCircle, ExternalLink, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function DeliveryPartnerPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    const unsub = subscribeToOrders((all) => {
      const active = all.filter(o => o.status === 'ready' || o.status === 'out_for_delivery')
      active.sort((a, b) => {
        if (a.status === 'out_for_delivery' && b.status !== 'out_for_delivery') return -1
        if (b.status === 'out_for_delivery' && a.status !== 'out_for_delivery') return 1
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
      setOrders(active)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const startTracking = (orderId: string) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }

    setTrackingId(orderId)
    updateOrderStatus(orderId, 'out_for_delivery')
    toast.success('Started live delivery')

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation({ lat: latitude, lng: longitude })
        updateDeliveryLocation(orderId, latitude, longitude)
      },
      (err) => toast.error('Location error'),
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
      if (trackingId === orderId) stopTracking()
      toast.success('Delivered!')
    } catch (e) {
      toast.error('Failed to update')
    }
  }

  const openNavigation = (order: Order) => {
    let url = ''
    if (order.customerLat && order.customerLng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${order.customerLat},${order.customerLng}`
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.customerAddress || '')}`
    }
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Focused Header */}
      <div className="bg-white px-4 pt-12 pb-8 border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1 block">Logistics</span>
            <h1 className="font-display text-3xl font-black text-gray-900 tracking-tighter">Delivery Partner</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <Link href="/admin/dashboard" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
              <Home size={18} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {trackingId && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-10 p-6 bg-brand-primary rounded-[2rem] text-white shadow-xl shadow-brand-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Navigation size={20} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Active Task</p>
                  <p className="font-black">Sharing Live Location</p>
                </div>
              </div>
              <button onClick={stopTracking} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all border border-white/20">
                <StopCircle size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-10 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <button className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Active Tasks</button>
          <button className="flex-1 py-3 text-gray-400 text-[10px] font-black uppercase tracking-widest">History</button>
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array(2).fill(0).map((_, i) => <div key={i} className="skeleton h-64 rounded-[2.5rem]" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={32} className="text-gray-200" />
            </div>
            <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight">Everything Delivered</h3>
            <p className="text-gray-400 mt-4 max-w-xs mx-auto font-medium">No active deliveries at the moment. Take a break!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map(order => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
                  trackingId === order.id ? 'border-brand-primary ring-4 ring-brand-primary/5 shadow-2xl shadow-brand-primary/10' : 'border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                }`}
              >
                <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                   <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm font-black text-gray-900">
                      #{order.orderNumber.split('-')[1]}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                      <p className="text-sm font-black text-gray-900">{order.customerName}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    order.status === 'out_for_delivery' ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-8">
                  <div className="flex flex-col gap-8 mb-10">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 flex-shrink-0">
                        <User size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact Details</p>
                        <p className="text-lg font-black text-gray-900 tracking-tight">{order.customerPhone}</p>
                        <a href={`tel:${order.customerPhone}`} className="text-[10px] font-black text-brand-primary uppercase tracking-widest mt-2 block hover:underline">Click To Call</a>
                      </div>
                      <a href={`tel:${order.customerPhone}`} className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                        <Phone size={20} />
                      </a>
                    </div>

                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <MapPin size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery Address</p>
                        <p className="text-gray-900 font-bold leading-relaxed line-clamp-2">{order.customerAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => openNavigation(order)}
                      className="col-span-1 py-4 bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-blue-100 flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                    >
                      <Navigation size={14} /> Navigate
                    </button>
                    <a 
                      href={`tel:${order.customerPhone}`}
                      className="col-span-1 py-4 bg-green-50 text-green-600 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-green-100 flex items-center justify-center gap-2 hover:bg-green-100 transition-all"
                    >
                      <Phone size={14} /> Call Now
                    </a>

                    {order.status === 'out_for_delivery' ? (
                      <button
                        onClick={() => markDelivered(order.id)}
                        className="col-span-2 py-5 bg-brand-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <CheckCircle size={20} /> Mark Delivered
                      </button>
                    ) : (
                      <button
                        onClick={() => startTracking(order.id)}
                        disabled={trackingId !== null}
                        className="col-span-2 py-5 bg-gray-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                      >
                        <Truck size={20} /> Pick Up Order
                      </button>
                    )}
                    <Link href={`/tracking/${order.id}`} className="col-span-2 text-center py-2 text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-brand-primary transition-colors flex items-center justify-center gap-2">
                       Customer View <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
