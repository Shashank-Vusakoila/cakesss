'use client'
import { useState, useEffect } from 'react'
import { subscribeToOrders, updateOrderStatus } from '@/lib/firebase/firestore'
import { Order, OrderStatus } from '@/types'
import { formatCurrency, getStatusColor, timeAgo } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, ExternalLink, ChevronDown } from 'lucide-react'
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
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} orders total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/delivery" className="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-2">
            <ExternalLink size={14} /> Open Delivery Partner App
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-3 mb-6">
        <div className="relative w-full xl:w-64 flex-shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9 h-full"
            placeholder="Search name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
          {['all', ...STATUS_OPTIONS].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all border ${
                statusFilter === s
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-4 sm:p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                       <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold">{order.orderNumber}</span>
                      <span className={`badge border text-[10px] ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                      {order.status === 'out_for_delivery' && (
                        <Link href={`/tracking/${order.id}`} className="badge border border-blue-200 bg-blue-50 text-blue-600 text-[10px] items-center gap-1 hover:bg-blue-100">
                          <MapPin size={10} /> Track Live
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{order.customerName}</p>
                      <span className="text-gray-400 text-sm">•</span>
                      <p className="text-sm text-gray-500">{order.customerPhone}</p>
                    </div>
                    {order.customerAddress && (
                      <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{order.customerAddress}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {order.items.map((item, j) => (
                        <span key={j} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium border border-gray-200">
                          {item.quantity} × {item.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{timeAgo(order.createdAt)}</p>
                  </div>

                  {/* Right: price & status */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-4 flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <div className="text-left lg:text-right">
                      <p className="font-bold text-gray-800 text-lg">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-gray-400 capitalize">{order.paymentMethod}</p>
                    </div>

                    {/* Status selector */}
                    <div className="relative mt-auto">
                      <select
                        value={order.status}
                        onChange={e => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                        disabled={updating === order.id || order.status === 'completed' || order.status === 'cancelled'}
                        className={`appearance-none pl-3 pr-8 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all focus:outline-none disabled:cursor-not-allowed ${getStatusColor(order.status)}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-white text-gray-800 font-medium">{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
