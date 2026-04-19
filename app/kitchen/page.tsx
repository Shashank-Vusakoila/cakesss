'use client'
import { useState, useEffect } from 'react'
import { subscribeToOrders, updateOrderStatus } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, CheckCircle, Flame, Sparkles, RefreshCw, Bell } from 'lucide-react'
import { timeAgo } from '@/utils'
import toast from 'react-hot-toast'

function getUrgency(createdAt: Date): 'low' | 'medium' | 'high' {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000
  if (mins > 20) return 'high'
  if (mins > 10) return 'medium'
  return 'low'
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const unsub = subscribeToOrders(o => {
      setOrders(o.filter(ord => ord.status === 'pending' || ord.status === 'preparing'))
      setLoading(false)
    })
    const ticker = setInterval(() => setNow(new Date()), 30000)
    return () => { unsub(); clearInterval(ticker) }
  }, [])

  const handleStatus = async (orderId: string, status: 'preparing' | 'ready') => {
    setUpdating(orderId)
    try {
      await updateOrderStatus(orderId, status)
      const message = status === 'ready' ? 'Order ready for pickup! 🧁' : 'Oven fired up! Preparation started 👨‍🍳'
      toast.success(message, {
        style: {
          background: '#1A0A00',
          color: '#FFFFFF',
          borderRadius: '16px',
          fontWeight: '900',
          textTransform: 'uppercase',
          fontSize: '12px',
          letterSpacing: '0.1em',
        }
      })
    } catch {
      toast.error('Kitchen error! Please retry.')
    } finally {
      setUpdating(null)
    }
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const preparingCount = orders.filter(o => o.status === 'preparing').length

  return (
    <div className="min-h-screen bg-[#FAFAF8] selection:bg-brand-orange selection:text-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 py-6 px-8 sticky top-0 z-30 shadow-glass">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-brand-orange rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-brand-orange/20 text-white">
              <ChefHat size={30} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-1">
                 <Sparkles size={12} /> Live Kitchen Display
              </div>
              <h1 className="text-3xl font-black text-brand-dark tracking-tighter">Production Deck</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-10">
               <div className="text-right">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">New Orders</p>
                 <div className="flex items-center justify-end gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-xl font-black text-amber-500 tracking-tight">{pendingCount} TICKETS</p>
                 </div>
               </div>
               <div className="w-px h-12 bg-gray-100" />
               <div className="text-right">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Active Prep</p>
                 <div className="flex items-center justify-end gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                    <p className="text-xl font-black text-brand-orange tracking-tight">{preparingCount} TICKETS</p>
                 </div>
               </div>
            </div>
            
            <div className="bg-brand-dark rounded-2xl p-4 flex items-center gap-4 text-white shadow-xl min-w-[140px] justify-center">
               <Bell size={20} className="text-brand-orange" />
               <span className="font-mono text-lg font-black tracking-widest">
                 {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
               </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-96 rounded-[3rem]" />)}
          </div>
        ) : orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-[50vh] gap-8"
          >
            <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center shadow-card border border-gray-100">
              <CheckCircle size={56} className="text-brand-orange" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-black text-brand-dark tracking-tight mb-3">Kitchen Is Clear!</h2>
              <p className="text-gray-400 text-lg font-medium max-w-sm italic italic-font">All bakes are out of the oven. Take a breath, chef.</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            <AnimatePresence>
              {orders.map((order, idx) => {
                const urgency = getUrgency(order.createdAt)
                const minsAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
                const isPreparing = order.status === 'preparing'

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`card overflow-hidden border-2 relative ${
                      isPreparing ? 'kds-card-preparing border-brand-orange/20 shadow-orange' : 'kds-card-pending border-gray-100'
                    }`}
                  >
                    {/* Urgency Overlay */}
                    {urgency === 'high' && (
                       <div className="bg-brand-red text-white text-[9px] font-black uppercase tracking-[0.3em] text-center py-2 animate-pulse">
                          CRITICAL: {minsAgo} MINS OVERDUE
                       </div>
                    )}

                    <div className="p-8">
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between mb-8">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-dark text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
                               {order.tableNumber || 'DL'}
                            </div>
                            <div>
                               <h3 className="text-xl font-black text-brand-dark tracking-tighter leading-tight truncate max-w-[120px]">{order.customerName}</h3>
                               <p className="text-[10px] font-bold text-gray-400 font-mono mt-1 pt-1 border-t border-gray-50">#{order.orderNumber.split('-')[1].toUpperCase()}</p>
                            </div>
                         </div>
                         <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                           isPreparing ? 'bg-orange-50 text-brand-orange border-brand-orange/20' : 'bg-gray-50 text-gray-400 border-gray-100'
                         }`}>
                            {order.status}
                         </div>
                      </div>

                      {/* Items Body */}
                      <div className="space-y-4 mb-10 min-h-[140px]">
                         {order.items.map((item, i) => (
                           <div key={i} className="flex items-center gap-4 group">
                             <div className={`w-10 h-10 rounded-[1.25rem] flex items-center justify-center font-black text-xs transition-all ${
                               isPreparing ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-400'
                             }`}>
                               {item.quantity}x
                             </div>
                             <p className="text-base font-black text-brand-dark tracking-tight leading-tight">{item.name}</p>
                           </div>
                         ))}
                      </div>

                      {order.notes && (
                        <div className="mb-8 p-5 bg-brand-cream/50 rounded-2xl border border-brand-orange/10 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 opacity-10"><Sparkles size={16} /></div>
                           <p className="text-[11px] font-bold text-brand-orange uppercase tracking-widest mb-2 opacity-60">Chef Notes</p>
                           <p className="text-sm font-black text-brand-dark leading-relaxed font-body">
                             &ldquo; {order.notes} &rdquo;
                           </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        {order.status === 'pending' ? (
                          <button
                            onClick={() => handleStatus(order.id, 'preparing')}
                            disabled={updating === order.id}
                            className="w-full btn-primary py-5 text-[10px] uppercase tracking-[0.2em] font-black flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                            <Flame size={18} className="animate-pulse" /> START BAKE
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatus(order.id, 'ready')}
                            disabled={updating === order.id}
                            className="w-full bg-[#FAFAF8] text-brand-dark border-2 border-brand-orange/30 py-5 text-[10px] uppercase tracking-[0.2em] font-black rounded-3xl hover:bg-white hover:border-brand-orange transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                          >
                            <CheckCircle size={18} className="text-brand-orange group-hover:scale-125 transition-transform" /> MARK READY
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
