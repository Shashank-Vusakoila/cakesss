'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { subscribeToOrders } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import { formatCurrency, getStatusColor, timeAgo, getStatusDescription } from '@/utils'
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
    <div className="min-h-screen bg-brand-background pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="glass shadow-card rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <Link href="/" className="text-brand-primary text-sm hover:underline font-medium mb-3 inline-block">← Back to Home</Link>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-dark">Order {order.orderNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-brand-text-light mt-2 text-sm flex items-center gap-1.5">
                  <Clock size={14} /> Placed {timeAgo(order.createdAt)}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-brand-text-light mb-1">Total Amount</p>
                <p className="font-bold text-2xl text-brand-primary">{formatCurrency(order.total)}</p>
                <p className="text-xs text-brand-text-light mt-1 capitalize">{order.paymentMethod} • {order.paymentStatus}</p>
              </div>
            </div>
          </div>

          {/* Tracking Pipeline */}
          {(order.status !== 'cancelled') ? (
            <div className="bg-brand-card shadow-card rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-brand-border pb-6">
                <div>
                  <h2 className="font-semibold text-brand-dark flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                    Live Status
                  </h2>
                  <p className="text-xl font-bold text-brand-primary mt-1">
                    {getStatusDescription(order.status)}
                  </p>
                </div>
                {order.status === 'preparing' && (
                  <div className="flex items-center gap-3 bg-brand-primary/10 px-4 py-2 rounded-2xl border border-brand-primary/20">
                    <ChefHat className="text-brand-primary animate-bounce" size={20} />
                    <span className="text-sm font-semibold text-brand-primary">Our bakers are on it!</span>
                  </div>
                )}
              </div>
              
              {showTracking && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-10 bg-brand-primary p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                      <MapPin size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Your order is on the way!</h3>
                      <p className="text-white/80 text-sm">Track your delivery partner live on the map.</p>
                    </div>
                  </div>
                  <Link href={`/tracking/${order.id}`} className="w-full md:w-auto bg-white text-brand-primary font-bold px-6 py-3 rounded-full hover:bg-brand-card transition-colors flex items-center justify-center gap-2">
                    Live Tracking <ExternalLink size={18} />
                  </Link>
                </motion.div>
              )}

              <div className="relative">
                {/* Connecting line */}
                <div className="absolute top-6 left-[20px] right-[20px] h-1 bg-brand-border rounded-full hidden md:block" />
                <div 
                  className="absolute top-6 left-[20px] h-1 bg-brand-primary rounded-full transition-all duration-1000 hidden md:block"
                  style={{ width: `${(stepIdx / (steps.length - 1)) * 100}%` }}
                />

                <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                  {steps.map((step, i) => {
                    const isActive = i <= stepIdx;
                    const isCurrent = i === stepIdx;
                    return (
                      <div key={step.title} className="flex md:flex-col items-center gap-4 md:text-center group">
                        <div className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                          ${isActive ? 'bg-brand-primary text-white shadow-md outline outline-4 outline-white' : 'bg-brand-border text-brand-text-light outline outline-4 outline-white'}
                          ${isCurrent ? 'scale-110' : ''}
                        `}>
                          <step.icon size={20} className={isCurrent ? 'animate-pulse' : ''} />
                          {isCurrent && (
                            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                            </span>
                          )}
                        </div>
                        <div className="flex-1 md:w-32">
                          <h3 className={`font-semibold text-sm ${isActive ? 'text-brand-dark' : 'text-brand-text-light'}`}>{step.title}</h3>
                          <p className="text-xs text-brand-text-light mt-1 md:mx-auto line-clamp-2">{step.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-6 mb-6">
              <h2 className="text-red-600 font-bold text-lg mb-1 flex items-center gap-2">
                <X size={20} /> Order Cancelled
              </h2>
              <p className="text-red-500/80 text-sm">This order has been cancelled.</p>
            </div>
          )}

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-brand-dark mb-4 pb-3 border-b border-brand-border flex items-center gap-2">
                <Package size={18} /> Items
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <Image src={item.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100'} alt={item.name} width={50} height={50} className="rounded-lg object-cover w-12 h-12" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-brand-dark line-clamp-1">{item.name}</p>
                      <p className="text-xs text-brand-text-light">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm text-brand-dark">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-brand-dark mb-4 pb-3 border-b border-brand-border flex items-center gap-2">
                <MapPin size={18} /> Delivery Details
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-brand-text-light mb-1">Customer</p>
                  <p className="font-medium text-brand-dark">{order.customerName}</p>
                  <p className="text-brand-text-light">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-brand-text-light mb-1">Address</p>
                  <p className="text-brand-dark leading-relaxed">{order.customerAddress || 'No address provided'}</p>
                </div>
                {order.notes && (
                  <div>
                    <p className="text-brand-text-light mb-1">Notes</p>
                    <p className="text-brand-dark bg-brand-primary/5 p-3 rounded-xl inline-block mt-1">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
