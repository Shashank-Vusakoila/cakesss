'use client'
import { useState, useEffect } from 'react'
import { subscribeToOrders, updateOrderStatus } from '@/lib/firebase/firestore'
import { Order, OrderStatus } from '@/types'
import { formatCurrency, getStatusColor } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, ExternalLink, ChevronDown, Truck, Star, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled']

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeToOrders(o => {
      setOrders(o)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = orders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  // Sort: pending/preparing/ready first, then out_for_delivery, then recent
  filtered.sort((a, b) => {
    const activeA = !['delivered', 'completed', 'cancelled'].includes(a.status)
    const activeB = !['delivered', 'completed', 'cancelled'].includes(b.status)
    if (activeA && !activeB) return -1
    if (!activeA && activeB) return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    setUpdating(orderId)
    try {
      await updateOrderStatus(orderId, status)
      toast.success(`Order updated to ${status.replace(/_/g, ' ')}`)
    } catch {
      toast.error('Failed to update order')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="p-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
        <div>
          <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mb-2 block">Management</span>
          <h1 className="font-display text-4xl font-black text-gray-900 tracking-tighter">Orders</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">{filtered.length} total orders found</p>
        </div>
        <Link href="/delivery" className="btn-primary text-xs py-3.5 px-6 shadow-[0_10px_30px_rgba(16,185,129,0.25)] flex items-center gap-2">
          <Truck size={16} /> GO TO DELIVERY APP
        </Link>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 mb-10">
        <div className="relative w-full xl:w-80">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] bg-white border border-gray-100 shadow-sm focus:border-brand-primary/20 focus:ring-4 focus:ring-brand-primary/5 focus:outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
            placeholder="Search name or order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              statusFilter === 'all'
                ? 'bg-brand-primary text-white shadow-lg'
                : 'bg-white text-gray-500 border border-gray-100 shadow-sm'
            }`}
          >
            All Orders
          </button>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === s
                  ? 'bg-brand-primary text-white shadow-lg'
                  : 'bg-white text-gray-500 border border-gray-100 shadow-sm'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-40 rounded-[2.5rem]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <div className="text-6xl mb-6">📦</div>
          <h3 className="font-display text-3xl font-black text-gray-900 tracking-tight">No Orders Found</h3>
          <p className="text-gray-400 mt-4 max-w-xs mx-auto font-medium">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {filtered.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500"
              >
                <div className="flex flex-col xl:flex-row xl:items-center gap-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-900 text-xl shadow-sm border border-gray-100 group-hover:bg-brand-primary group-hover:text-white transition-all duration-500">
                    {order.customerName[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{order.orderNumber.split('-')[1]}</span>
                      <div className="w-1 h-1 rounded-full bg-gray-200" />
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getStatusColor(order.paymentStatus).replace('bg-', 'bg-opacity-10 text-').replace('text-', 'border-')}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-2">{order.customerName}</h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1.5"><Phone size={14} className="text-gray-300" /> {order.customerPhone}</span>
                      {order.customerAddress && (
                        <span className="flex items-center gap-1.5 max-w-xs truncate"><MapPin size={14} className="text-gray-300" /> {order.customerAddress}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6">
                      {order.items.map((item, j) => (
                        <span key={j} className="text-[10px] font-black uppercase tracking-tight bg-gray-50 text-gray-500 px-3 py-1.5 rounded-xl border border-gray-100 group-hover:bg-white group-hover:border-gray-200 transition-all">
                          {item.quantity} × {item.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-4 border-t xl:border-t-0 xl:border-l border-gray-50 pt-6 xl:pt-0 xl:pl-8 flex-shrink-0">
                    <div className="text-left xl:text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-2xl font-black text-gray-900 tracking-tighter">{formatCurrency(order.total)}</p>
                    </div>

                    <div className="relative group/select">
                      <select
                        value={order.status}
                        onChange={e => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                        disabled={updating === order.id || order.status === 'completed' || order.status === 'cancelled'}
                        className={`appearance-none pl-5 pr-12 py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${getStatusColor(order.status).replace('bg-', 'bg-opacity-10 text-').replace('text-', 'border-')}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
