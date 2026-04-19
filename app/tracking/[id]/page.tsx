'use client'
import { useEffect, useState } from 'react'
import { subscribeToDeliveryLocation } from '@/lib/firebase/realtime'
import { subscribeToOrders } from '@/lib/firebase/firestore'
import { DeliveryLocation, Order } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Truck, Star, Phone, ChevronLeft, Package, Clock, CheckCircle, ChefHat, Heart, Sparkles, Navigation } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import map components to avoid SSR issues
const Map = dynamic(() => Promise.resolve(({ clientLocation, storeLocation, status }: any) => {
  const { MapContainer, TileLayer, Marker, Popup, useMap } = require('react-leaflet')
  const L = require('leaflet')
  require('leaflet/dist/leaflet.css')

  const centerPos: [number, number] = clientLocation ? [clientLocation.lat, clientLocation.lng] : storeLocation
  
  const createCustomIcon = (type: 'delivery' | 'bakery' | 'home') => {
    const bgClass = type === 'delivery' ? 'bg-brand-orange' : type === 'bakery' ? 'bg-brand-dark' : 'bg-brand-red'
    const emoji = type === 'delivery' ? '🛵' : type === 'bakery' ? '🏪' : '🏠'
    
    return L.divIcon({
      html: `<div class="${bgClass} w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-orange border-2 border-white ring-4 ring-white/20">${emoji}</div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    })
  }

  function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
      map.flyTo(center, map.getZoom(), { duration: 1.5 })
    }, [center, map])
    return null
  }

  return (
    <MapContainer 
      center={centerPos} 
      zoom={15} 
      className="w-full h-full"
      zoomControl={false}
    >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
      <MapUpdater center={centerPos} />
      <Marker position={storeLocation} icon={createCustomIcon('bakery')}>
        <Popup className="font-sans font-medium">B&D Bakery</Popup>
      </Marker>
      {clientLocation && (
        <Marker position={[clientLocation.lat, clientLocation.lng]} icon={createCustomIcon('delivery')}>
          <Popup className="font-sans font-medium">Track your delights!</Popup>
        </Marker>
      )}
      </MapContainer>
    )
  }), { ssr: false })

const STORE_LOCATION: [number, number] = [17.4323611, 78.6057222]

export default function LiveTrackingPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<DeliveryLocation | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubOrder = subscribeToOrders((orders) => {
      const found = orders.find(o => o.id === params.id)
      setOrder(found || null)
      if (loading) setLoading(false)
    })

    const unsubLoc = subscribeToDeliveryLocation(params.id, (loc) => {
      if (loc) setLocation(loc)
    })

    return () => {
      unsubOrder()
      unsubLoc()
    }
  }, [params.id, loading])

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#FAFAF8]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin shadow-xl" />
        <div className="text-center">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange mb-2">Establishing Signal</p>
           <h2 className="text-xl font-black text-brand-dark tracking-tighter">Locating Your Order...</h2>
        </div>
      </div>
    </div>
  )

  if (!order) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FAFAF8] p-6 text-center">
      <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 shadow-card">
        <Package size={40} className="text-gray-200" />
      </div>
      <h2 className="text-3xl font-black text-brand-dark tracking-tight">Transmission Lost</h2>
      <p className="text-gray-400 mt-3 max-w-xs mx-auto font-medium italic italic-font">We can't find this specific order on the radar.</p>
      <Link href="/" className="mt-10 btn-primary">Return to Base</Link>
    </div>
  )

  const isStepActive = (current: string, step: string) => {
    const levels: Record<string, number> = { 'pending': 0, 'preparing': 1, 'ready': 2, 'out_for_delivery': 3, 'delivered': 4 }
    return levels[current] >= levels[step]
  }

  const getStatusTitle = (status: string) => {
    switch(status) {
      case 'pending': return 'Order Acknowledged'
      case 'preparing': return 'Baking in Oven'
      case 'ready': return 'Quality Checked'
      case 'out_for_delivery': return 'Delivery Dispatched'
      case 'delivered': return 'Delivered'
      default: return 'Processing Ticket'
    }
  }

  return (
    <div className="h-screen w-full relative bg-[#FAFAF8] flex flex-col lg:flex-row overflow-hidden font-body selection:bg-brand-orange selection:text-white">
      {/* Sidebar: Order Details & Timeline */}
      <div className="w-full lg:w-[480px] h-[45%] lg:h-full bg-white shadow-2xl z-20 overflow-y-auto custom-scrollbar border-r border-gray-100 flex flex-col">
         {/* Order Status Header */}
         <div className="p-10 border-b border-gray-50 mt-16 lg:mt-0">
            <Link href="/" className="inline-flex items-center gap-3 text-gray-400 hover:text-brand-orange transition-all mb-8 group">
               <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return Home</span>
            </Link>
            
            <div className="flex items-center justify-between mb-4">
               <div>
                  <h1 className="text-4xl font-black text-brand-dark tracking-tighter leading-none mb-2">
                     {getStatusTitle(order.status)}
                  </h1>
                  <p className="text-xs font-bold text-brand-orange uppercase tracking-[0.2em] animate-pulse">
                     Live Signal Connected
                  </p>
               </div>
               <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center shadow-inner">
                  <Truck size={32} className={order.status === 'out_for_delivery' ? 'animate-bounce' : ''} />
               </div>
            </div>
            <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
               <div className="text-left">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                  <p className="text-sm font-mono font-black text-brand-dark">#{order.orderNumber.split('-')[1].toUpperCase()}</p>
               </div>
               <div className="w-px h-8 bg-gray-100" />
               <div className="text-left">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Est. Arrival</p>
                  <p className="text-sm font-black text-brand-dark">25-30 MINS</p>
               </div>
            </div>
         </div>

         {/* Delivery Progress Timeline */}
         <div className="p-10 flex-1">
            <div className="space-y-8">
               {[
                 { key: 'pending', label: 'Order Confirmed', sub: 'Oven ticket printed', icon: Sparkles },
                 { key: 'preparing', label: 'Baking Now', sub: 'Freshness in progress', icon: ChefHat },
                 { key: 'ready', label: 'Bakes Packaged', sub: 'Final quality seal', icon: Package },
                 { key: 'out_for_delivery', label: 'On Route', sub: 'Delivery in transit', icon: Navigation },
                 { key: 'delivered', label: 'Handover Complete', sub: 'Enjoy your delights!', icon: Heart }
               ].map((step, i, arr) => {
                 const active = isStepActive(order.status, step.key)
                 const current = order.status === step.key
                 return (
                   <div key={step.key} className="flex gap-8 relative">
                      {i < arr.length - 1 && (
                         <div className={`absolute left-6 top-12 w-1 rounded-full h-12 transition-all duration-1000 ${active && isStepActive(order.status, arr[i+1].key) ? 'bg-brand-success' : 'bg-gray-100'}`} />
                      )}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 transition-all duration-700 ${
                         active ? 'bg-brand-dark text-white shadow-xl rotate-0' : 'bg-gray-50 text-gray-200 -rotate-12'
                       } ${current ? 'ring-8 ring-brand-orange/10 bg-brand-orange' : ''}`}>
                         <step.icon size={20} className={current ? 'animate-pulse' : ''} />
                      </div>
                      <div className="flex-1 pt-1">
                         <h4 className={`text-base font-black tracking-tight ${active ? 'text-brand-dark' : 'text-gray-300'}`}>{step.label}</h4>
                         <p className={`text-[11px] font-bold tracking-tight uppercase mt-0.5 ${active ? 'text-gray-400' : 'text-gray-100'}`}>{step.sub}</p>
                      </div>
                   </div>
                 )
               })}
            </div>
         </div>

         {/* Delivery Partner Card */}
         {isStepActive(order.status, 'out_for_delivery') && (
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-8 m-8 bg-brand-dark rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={24} className="text-white" /></div>
               <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-brand-orange rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-lg border-2 border-white/20">
                     {order.customerName[0]}
                  </div>
                  <div className="flex-1">
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Delivery Partner</p>
                     <h5 className="text-lg font-black text-white tracking-tight">Akash Kumar</h5>
                     <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-orange/20 rounded-md">
                           <Star size={10} className="text-brand-orange fill-brand-orange" />
                           <span className="text-[10px] font-black text-brand-orange">4.9 TOP PARTNER</span>
                        </div>
                     </div>
                  </div>
                  <a href={`tel:${order.customerPhone}`} className="w-14 h-14 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-orange hover:scale-110 transition-transform active:scale-95">
                     <Phone size={24} />
                  </a>
               </div>
            </motion.div>
         )}
      </div>

      {/* Map Content: B&D Full Screen Map */}
      <div className="flex-1 relative z-0">
        <Map
          clientLocation={location}
          storeLocation={STORE_LOCATION}
          status={order.status}
        />
        
        {/* Mobile View Overlay Status */}
        <div className="lg:hidden absolute top-8 left-6 right-6 z-30">
           <div className="glass border border-white p-6 rounded-3xl shadow-glass flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
                    <Truck size={24} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-brand-dark tracking-tighter leading-none mb-1">{getStatusTitle(order.status)}</h3>
                    <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em]">Signal: Verified 100%</p>
                 </div>
              </div>
              <Link href="/" className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center text-brand-dark border border-white"><ChevronLeft size={20} /></Link>
           </div>
        </div>
      </div>
    </div>
  )
}
