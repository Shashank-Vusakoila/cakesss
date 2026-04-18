'use client'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Navbar from '@/components/layout/Navbar'
import { subscribeToDeliveryLocation } from '@/lib/firebase/realtime'
import { subscribeToOrders } from '@/lib/firebase/firestore'
import { DeliveryLocation, Order } from '@/types'
import { motion } from 'framer-motion'
import { MapPin, Truck, Cake, ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Quick hack for leaflet icons in Next.js
const customMarker = new L.Icon({
  iconUrl: '/truck-icon.png', // We'll make a custom component or use a divIcon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

// Using DivIcons for custom styling without needing image files
const createCustomIcon = (type: 'delivery' | 'bakery' | 'home') => {
  const bgClass = type === 'delivery' ? 'bg-brand-primary' : type === 'bakery' ? 'bg-brand-primary' : 'bg-blue-500'
  const emoji = type === 'delivery' ? '🛵' : type === 'bakery' ? '🏪' : '🏠'
  
  return L.divIcon({
    html: `<div class="${bgClass} w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-white ring-2 ring-black/10">${emoji}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  })
}

// Map updater component to re-center when location changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.5 })
  }, [center, map])
  return null
}

const BAKERY_LOC: [number, number] = [17.5113, 78.8823] // Approx coordinates for Bhuvangiri

export default function LiveTrackingPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<DeliveryLocation | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Get Order info
    const unsubOrder = subscribeToOrders((orders) => {
      const found = orders.find(o => o.id === params.id)
      setOrder(found || null)
      if (loading) setLoading(false)
    })

    // 2. Sub to Realtime DB location
    const unsubLoc = subscribeToDeliveryLocation(params.id, (loc) => {
      setLocation(loc)
    })

    return () => {
      unsubOrder()
      unsubLoc()
    }
  }, [params.id, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-background">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent flex items-center justify-center rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center gap-4">
        <h2 className="font-bold text-2xl text-brand-dark">Order not found</h2>
        <Link href="/" className="btn-primary">Return Home</Link>
      </div>
    )
  }

  const isDelivered = order.status === 'delivered' || order.status === 'completed'
  // Default to bakery if location is null initially
  const centerPos: [number, number] = location ? [location.lat, location.lng] : BAKERY_LOC

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />
      
      {/* Map Section */}
      <div className="flex-1 relative mt-[84px] z-0">
        {typeof window !== 'undefined' && (
          <MapContainer 
            center={centerPos} 
            zoom={15} 
            className="w-full h-full absolute inset-0 z-0 border-b border-brand-border shadow-sm"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapUpdater center={centerPos} />

            {/* Bakery Marker */}
            <Marker position={BAKERY_LOC} icon={createCustomIcon('bakery')}>
              <Popup className="font-sans font-medium text-brand-dark">Bakes & Delights</Popup>
            </Marker>

            {/* Live Delivery Marker */}
            {location && !isDelivered && (
              <Marker position={[location.lat, location.lng]} icon={createCustomIcon('delivery')}>
                <Popup className="font-sans font-medium text-brand-dark">Your order is here!</Popup>
              </Marker>
            )}

            {/* (In a real app, we'd also geocode the customer address and show a home marker here) */}
          </MapContainer>
        )}
      </div>

      {/* Info Panel Floating overlay for desktop, bottom sheet for mobile */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-8 md:left-8 md:right-auto md:w-96 z-10"
      >
        <div className="bg-brand-card p-6 rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl border border-brand-border">
          <div className="w-12 h-1 bg-brand-border rounded-full mx-auto mb-6 md:hidden" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-semibold text-brand-text-light mb-1">ORDER #{order.orderNumber}</p>
              <h2 className="font-display font-bold text-2xl text-brand-dark tracking-tight">
                {isDelivered ? 'Delivered' : 'On the Way'}
              </h2>
            </div>
            {isDelivered ? (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <span className="text-2xl">🎉</span>
              </div>
            ) : location ? (
              <div className="w-12 h-12 bg-brand-primary/10 border border-brand-primary rounded-full flex items-center justify-center">
                <div className="relative">
                  <div className="w-3 h-3 bg-brand-primary rounded-full"></div>
                  <div className="absolute inset-0 bg-brand-primary rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
                <Truck size={20} />
              </div>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary flex-shrink-0">
                <MapPin size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-brand-text-light font-medium">DELIVERY ADDRESS</p>
                <p className="text-sm font-semibold text-brand-dark line-clamp-2">{order.customerAddress}</p>
              </div>
            </div>

            <div className="h-px bg-brand-border w-full" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-border rounded-xl flex items-center justify-center text-brand-text-light flex-shrink-0">
                💬
              </div>
              <div>
                <p className="text-xs text-brand-text-light font-medium">LIVE STATUS</p>
                <p className="text-sm font-semibold text-brand-dark">
                  {isDelivered ? 'Enjoy your bakes!' : location ? 'Delivery partner is sharing location.' : 'Waiting for partner to start tracking...'}
                </p>
              </div>
            </div>
          </div>

          <Link href={`/order/${order.id}`} className="w-full flex items-center justify-center gap-2 bg-brand-border hover:bg-brand-border/80 text-brand-dark font-bold py-3.5 rounded-xl transition-colors">
            <ArrowLeft size={18} /> View Order Details
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
