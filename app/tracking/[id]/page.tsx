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
const Map = dynamic(() => Promise.resolve(({ clientLocation, storeLocation, customerLocation, status }: any) => {
  const { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } = require('react-leaflet')
  const L = require('leaflet')
  require('leaflet/dist/leaflet.css')

  const driverPos: [number, number] | null = clientLocation ? [clientLocation.lat, clientLocation.lng] : null
  const custPos: [number, number] | null = customerLocation ? [customerLocation.lat, customerLocation.lng] : null
  const centerPos: [number, number] = driverPos || storeLocation
  
  const createCustomIcon = (type: 'delivery' | 'bakery' | 'home') => {
    const bgClass = type === 'delivery' ? 'bg-brand-orange text-white' : type === 'bakery' ? 'bg-brand-dark text-white' : 'bg-white text-brand-orange'
    const iconSvg = type === 'delivery' 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`
      : type === 'bakery' 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
    
    return L.divIcon({
      html: `<div class="${bgClass} w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] border-2 ${type === 'home' ? 'border-brand-orange' : 'border-white'} relative z-50">
               ${iconSvg}
               ${type === 'delivery' ? '<div class="absolute inset-0 rounded-full bg-brand-orange animate-ping opacity-50"></div>' : ''}
             </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    })
  }

  function MapUpdater() {
    const map = useMap()
    useEffect(() => {
      if (driverPos && storeLocation && custPos) {
         const bounds = L.latLngBounds([storeLocation, driverPos, custPos])
         map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true, duration: 1.5 })
      } else if (custPos && storeLocation) {
         const bounds = L.latLngBounds([storeLocation, custPos])
         map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true, duration: 1.5 })
      } else {
         map.flyTo(centerPos, 14, { duration: 1.5 })
      }
    }, [map, driverPos, custPos])
    return null
  }

  // Fetch real road route from OSRM
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])

  useEffect(() => {
    if (storeLocation && custPos) {
      // We route from store to customer
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${storeLocation[1]},${storeLocation[0]};${custPos[1]},${custPos[0]}?overview=full&geometries=geojson`)
          const data = await res.json()
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]])
            setRouteCoordinates(coords)
          }
        } catch (err) {
          console.error("Routing error:", err)
        }
      }
      fetchRoute()
    }
  }, [storeLocation, custPos])

  return (
    <MapContainer 
      center={centerPos} 
      zoom={15} 
      className="w-full h-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <MapUpdater />
      
      {/* Real Road Route Line */}
      {routeCoordinates.length > 0 && (
        <>
          <Polyline 
            positions={routeCoordinates} 
            pathOptions={{ color: '#000000', weight: 8, opacity: 0.3, lineCap: 'round', lineJoin: 'round' }} 
          />
          <Polyline 
            positions={routeCoordinates} 
            pathOptions={{ color: '#FC8019', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} 
          />
        </>
      )}

      {/* Markers */}
      <Marker position={storeLocation} icon={createCustomIcon('bakery')}>
        <Popup className="font-sans font-medium border-0 shadow-lg rounded-xl">Bakes & Delights</Popup>
      </Marker>
      
      {custPos && (
        <Marker position={custPos} icon={createCustomIcon('home')}>
          <Popup className="font-sans font-medium border-0 shadow-lg rounded-xl">Delivery Destination</Popup>
        </Marker>
      )}

      {driverPos && (
        <Marker position={driverPos} icon={createCustomIcon('delivery')}>
          <Popup className="font-sans font-medium border-0 shadow-lg rounded-xl">Driver Location</Popup>
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
    const levels: Record<string, number> = { 'pending': 0, 'preparing': 1, 'ready': 2, 'out_for_delivery': 3, 'arrived': 4, 'delivered': 5 }
    return levels[current] >= levels[step]
  }

  const getStatusTitle = (status: string) => {
    switch(status) {
      case 'pending': return 'Order Acknowledged'
      case 'preparing': return 'Baking in Oven'
      case 'ready': return 'Quality Checked'
      case 'out_for_delivery': return 'Delivery Dispatched'
      case 'arrived': return 'Driver Arrived'
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
                  <Truck size={32} className={(order.status === 'out_for_delivery' || order.status === 'arrived') ? 'animate-bounce' : ''} />
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
                  <p className="text-sm font-black text-brand-dark">{
                    (() => {
                      if (order.status === 'delivered') return 'Delivered'
                      if (order.status === 'arrived') return 'Arrived'
                      if (order.status === 'cancelled') return 'Cancelled'
                      let lat1 = STORE_LOCATION[0]
                      let lon1 = STORE_LOCATION[1]
                      if (order.status === 'out_for_delivery' && location) {
                         lat1 = location.lat; lon1 = location.lng
                      }
                      let lat2 = order.customerLat || STORE_LOCATION[0]
                      let lon2 = order.customerLng || STORE_LOCATION[1]
                      
                      const R = 6371; // km
                      const dLat = (lat2 - lat1) * Math.PI / 180;
                      const dLon = (lon2 - lon1) * Math.PI / 180;
                      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                      const distanceKm = R * c; 
                      
                      let baseMins = Math.ceil(distanceKm * 3) // 3 mins per km driving approx
                      if (['pending', 'preparing'].includes(order.status)) baseMins += 20 // prep time
                      if (order.status === 'ready') baseMins += 5 // assignment time
                      
                      return Math.max(5, baseMins) + " MINS"
                    })()
                  }</p>
               </div>
            </div>
         </div>

         {/* Delivery Progress Timeline */}
         <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
               {[
                 { key: 'pending', label: 'Order Confirmed', sub: 'Oven ticket printed', icon: Sparkles },
                 { key: 'preparing', label: 'Baking Now', sub: 'Freshness in progress', icon: ChefHat },
                 { key: 'ready', label: 'Bakes Packaged', sub: 'Final quality seal', icon: Package },
                 { key: 'out_for_delivery', label: 'On Route', sub: 'Delivery in transit', icon: Navigation },
                 { key: 'arrived', label: 'Driver Arrived', sub: 'Ready for pickup', icon: MapPin },
                 { key: 'delivered', label: 'Handover Complete', sub: 'Enjoy your delights!', icon: Heart }
               ].map((step, i, arr) => {
                 const active = isStepActive(order.status, step.key)
                 const current = order.status === step.key
                 return (
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     transition={{ delay: i * 0.1 }}
                     key={step.key} 
                     className={`flex gap-6 relative p-3 rounded-2xl transition-colors ${current ? 'bg-brand-orange/5 border border-brand-orange/20 shadow-sm' : ''}`}
                   >
                      {i < arr.length - 1 && (
                         <div className={`absolute left-[33px] top-12 w-[2px] rounded-full h-8 transition-all duration-1000 ${active && isStepActive(order.status, arr[i+1].key) ? 'bg-brand-success' : 'bg-gray-100'}`} />
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 transition-all duration-700 ${
                         active ? 'bg-brand-dark text-white shadow-md' : 'bg-gray-50 text-gray-300'
                       } ${current ? 'ring-4 ring-brand-orange/20 bg-brand-orange scale-110' : ''}`}>
                         <step.icon size={18} className={current ? 'animate-pulse' : ''} />
                      </div>
                      <div className="flex-1 pt-0.5">
                         <h4 className={`text-sm font-black tracking-tight transition-colors ${current ? 'text-brand-orange' : active ? 'text-brand-dark' : 'text-gray-300'}`}>{step.label}</h4>
                         <p className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${current ? 'text-brand-orange/70' : active ? 'text-gray-400' : 'text-gray-200'}`}>{step.sub}</p>
                      </div>
                      {current && (
                        <div className="w-2 h-2 rounded-full bg-brand-orange self-center animate-ping mr-2" />
                      )}
                   </motion.div>
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
                     A
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
                  <a href="tel:+919701003268" className="w-14 h-14 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-orange hover:scale-110 transition-transform active:scale-95">
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
          customerLocation={order.customerLat && order.customerLng ? { lat: order.customerLat, lng: order.customerLng } : null}
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
