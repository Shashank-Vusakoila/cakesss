'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { subscribeToOrders } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import { formatCurrency, getStatusColor, timeAgo, getStatusDescription, getValidImageUrl } from '@/utils'
import Navbar from '@/components/layout/Navbar'
import { CheckCircle2, Clock, ChefHat, Package, MapPin, Truck, ExternalLink, RefreshCw, X } from 'lucide-react'
import Image from 'next/image'

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsub = subscribeToOrders((orders) => {
      const found = orders.find(o => o.id === params.id)
      if (found) {
        setOrder(found)
        setLoading(false)
      } else if (!loading && !found) {
        // order not found after initial load
        setLoading(false)
      }
    })
    return () => unsub()
  }, [params.id, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-text-light font-medium tracking-wide animate-pulse">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😕</div>
        <h2 className="font-display text-2xl font-bold text-brand-dark">Order not found</h2>
        <p className="text-brand-text-light">We couldn&apos;t find this order. It might have been deleted.</p>
        <Link href="/" className="btn-primary mt-4">Return Home</Link>
      </div>
    )
  }

  // Define steps
  // 1: Pending (Placed)
  // 2: Confirmed/Preparing (Baking)
  // 3: Out for Delivery
  // 4: Delivered
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed']
  const currentIdx = statuses.indexOf(order.status)
  
  // Normalize index for our 4-step UI
  let stepIdx = 0
  if (currentIdx >= statuses.indexOf('delivered')) stepIdx = 3
  else if (currentIdx >= statuses.indexOf('out_for_delivery')) stepIdx = 2
  else if (currentIdx >= statuses.indexOf('confirmed')) stepIdx = 1
  else stepIdx = 0

  const steps = [
    { icon: Clock, title: 'Order Placed', desc: 'We have received your order' },
    { icon: ChefHat, title: 'Baking in Progress', desc: 'Preparing with love' },
    { icon: Truck, title: 'Out for Delivery', desc: 'On the way to your doorstep' },
    { icon: CheckCircle2, title: 'Delivered', desc: 'Enjoy your delicious bakes!' },
  ]

  const showTracking = order.status === 'out_for_delivery'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          
          {/* Header Card */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 border border-gray-100 relative overflow-hidden">
             {/* Decorative pattern */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
             
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                <div>
                   <Link href="/" className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-4 inline-block hover:underline">← Return Home</Link>
                   <div className="flex flex-wrap items-center gap-4 mb-2">
                      <h1 className="font-display text-4xl font-black text-gray-900 tracking-tighter">Order #{order.orderNumber.split('-')[1]}</h1>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status).replace('bg-', 'bg-opacity-10 text-').replace('text-', 'border-')} border`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                   </div>
                   <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
                     <Clock size={16} /> Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </p>
                </div>
                <div className="text-left md:text-right">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Value</p>
                   <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{formatCurrency(order.total)}</p>
                   <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mt-2">{order.paymentMethod} • {order.paymentStatus}</p>
                </div>
             </div>
          </div>

          {/* Logic for Live tracking link */}
          {showTracking && (
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }}
               className="mb-8 p-1 bg-gradient-to-r from-brand-primary to-emerald-400 rounded-[2rem] shadow-xl shadow-brand-primary/20"
             >
                <div className="bg-white rounded-[1.8rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                        <Truck size={28} className="animate-bounce-slow" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight">Fresh Bakes Incoming!</h3>
                        <p className="text-gray-400 text-sm font-medium">Your order is out for delivery. Watch it live.</p>
                      </div>
                   </div>
                   <Link href={`/tracking/${order.id}`} className="w-full sm:w-auto bg-gray-900 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                     Track Live Map <ExternalLink size={16} />
                   </Link>
                </div>
             </motion.div>
          )}

          {/* Tracking Pipeline */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 border border-gray-100">
             <div className="flex items-center justify-between mb-12">
                <div>
                   <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1 block">Timeline</span>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{getStatusDescription(order.status)}</h2>
                </div>
                <div className="hidden sm:flex items-center gap-3 py-2 px-4 bg-gray-50 rounded-xl border border-gray-100">
                   <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Updates</span>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 relative">
                {/* Desktop line */}
                <div className="absolute top-[26px] left-[15%] right-[15%] h-1 bg-gray-50 hidden sm:block overflow-hidden rounded-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stepIdx / (steps.length - 1)) * 100}%` }}
                    className="h-full bg-brand-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  />
                </div>

                {steps.map((step, i) => {
                  const isActive = i <= stepIdx;
                  const isCurrent = i === stepIdx;
                  return (
                    <div key={step.title} className="flex sm:flex-col items-center gap-6 sm:text-center relative z-10 group">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-xl ${
                        isActive 
                        ? 'bg-brand-primary text-white scale-110 shadow-brand-primary/20 ring-4 ring-white' 
                        : 'bg-gray-50 text-gray-300 ring-4 ring-white'
                      }`}>
                         <step.icon size={24} className={isCurrent ? 'animate-bounce-slow' : ''} />
                      </div>
                      <div className="flex-1 sm:px-2">
                        <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>{step.title}</p>
                        <p className="text-[11px] font-medium text-gray-400 leading-tight hidden sm:block">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Items List */}
             <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 tracking-tighter mb-8 flex items-center gap-3">
                  <Package size={20} className="text-brand-primary" />
                  Box Contents
                </h3>
                <div className="space-y-8">
                   {order.items.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-6 group">
                        <div className="relative w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                           <Image src={getValidImageUrl(item.image, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80')} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Product</p>
                           <h4 className="text-lg font-black text-gray-900 tracking-tight leading-tight">{item.name}</h4>
                           <p className="text-[11px] font-black text-brand-primary uppercase tracking-widest mt-1">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
                           <p className="text-lg font-black text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                     </div>
                   ))}
                </div>
                
                <div className="mt-10 pt-10 border-t border-gray-50 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-widest">{order.paymentMethod}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Total</p>
                      <p className="text-3xl font-black text-brand-primary tracking-tighter">{formatCurrency(order.total)}</p>
                   </div>
                </div>
             </div>

             {/* Side Details */}
             <div className="space-y-8">
                <div className="bg-gray-900 text-white rounded-[2.5rem] p-10 shadow-2xl">
                   <h3 className="text-xl font-black tracking-tighter mb-8 flex items-center gap-3">
                     <MapPin size={20} className="text-brand-primary" />
                     Shipping
                   </h3>
                   <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Recipient</p>
                        <p className="text-lg font-black">{order.customerName}</p>
                        <p className="text-sm font-medium text-gray-400 mt-1">{order.customerPhone}</p>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Delivery Address</p>
                        <p className="text-sm font-medium text-gray-300 leading-relaxed italic italic-font line-clamp-4">&ldquo; {order.customerAddress || 'No address details provided.'} &rdquo;</p>
                      </div>
                   </div>
                </div>

                {order.notes && (
                  <div className="bg-white rounded-[2rem] p-8 border border-gray-100 italic-font">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kitchen Instruction</p>
                     <p className="text-sm font-bold text-gray-600 leading-relaxed">&ldquo; {order.notes} &rdquo;</p>
                  </div>
                )}
             </div>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
