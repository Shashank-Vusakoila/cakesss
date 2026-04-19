'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeToOrders } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import { formatCurrency, getStatusColor, timeAgo, getValidImageUrl } from '@/utils'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ChevronRight, Clock, MapPin, Package, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function OrderHistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false)
      return
    }

    const unsub = subscribeToOrders((allOrders) => {
      const userOrders = allOrders.filter(o => o.userId === user.uid)
      setOrders(userOrders)
      setLoading(false)
    })

    return () => unsub()
  }, [user, authLoading])

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
  )

  if (authLoading || (loading && !orders.length)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">Loading your bakes...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag size={40} className="text-gray-200" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Login to see orders</h2>
        <p className="text-gray-400 mt-2 max-w-xs font-medium">Please sign in to view your order history and track active orders.</p>
        <Link href="/login" className="mt-8 bg-brand-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 transition-transform">Sign In Now</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-body">
      <Navbar />
      
      <main className="max-w-[1240px] mx-auto px-4 pt-32 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mb-2 block">Your Account</span>
            <h1 className="font-display text-4xl font-black text-gray-900 tracking-tighter">My Orders</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Showing {orders.length} orders placed so far</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID or item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] bg-white border border-gray-100 shadow-sm focus:border-brand-primary/20 focus:ring-4 focus:ring-brand-primary/5 focus:outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-gray-200" />
            </div>
            <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight">No Bakes Yet?</h3>
            <p className="text-gray-400 mt-4 max-w-xs mx-auto font-medium">Your delicious journey is just one click away. Start ordering now!</p>
            <Link href="/menu" className="mt-8 inline-block bg-brand-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 transition-transform">Explore Menu</Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-bold text-gray-400">No matching orders found</p>
            <button onClick={() => setSearch('')} className="mt-4 text-brand-primary font-bold underline">Clear search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {filteredOrders.map((order, idx) => {
                const isActive = !['delivered', 'completed', 'cancelled'].includes(order.status)
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500"
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Left: Thumbnail and Summary */}
                      <div className="p-8 lg:p-10 flex-1">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order #{order.orderNumber.split('-')[1]}</span>
                          <div className="w-1 h-1 rounded-full bg-gray-200" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <div className="w-1 h-1 rounded-full bg-gray-200" />
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${
                             isActive ? 'bg-orange-50 text-brand-primary border-orange-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                          }`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                            <Image 
                              src={getValidImageUrl(order.items[0]?.image, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80')} 
                              alt={order.items[0]?.name || 'Cake'} 
                              fill 
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-2 truncate">
                              {order.items.map(i => i.name).join(', ')}
                            </h3>
                            <p className="text-sm font-bold text-gray-400 mb-6 italic italic-font">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {formatCurrency(order.total)}
                            </p>
                            
                            <div className="flex items-center gap-4">
                              <Link 
                                href={isActive ? `/tracking/${order.id}` : `/order/${order.id}`}
                                className="px-8 py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                              >
                                {isActive ? 'Track Live' : 'View Details'} <ChevronRight size={14} />
                              </Link>
                              
                              {!isActive && (
                                <Link 
                                  href="/menu"
                                  className="px-8 py-3 bg-gray-50 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all"
                                >
                                  Reorder
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Summary Box (B&D Layout) */}
                      <div className="bg-gray-50/50 p-8 lg:p-10 lg:w-72 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col justify-center">
                         <div className="space-y-4">
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                               <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-brand-primary animate-pulse' : 'bg-gray-300'}`} />
                                  <p className="text-xs font-black text-gray-700 uppercase tracking-widest">{isActive ? 'In Progress' : 'Completed'}</p>
                               </div>
                            </div>
                            <div className="h-px bg-gray-200" />
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivered To</p>
                               <p className="text-xs font-bold text-gray-600 line-clamp-2">{order.customerAddress || 'No address'}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
