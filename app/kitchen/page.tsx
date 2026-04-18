'use client'
import { useState, useEffect } from 'react'
import { subscribeToOrders, updateOrderStatus } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, CheckCircle, Flame, TableProperties, RefreshCw } from 'lucide-react'
import { timeAgo } from '@/utils'
import toast from 'react-hot-toast'

function getUrgency(createdAt: Date): 'low' | 'medium' | 'high' {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000
  if (mins > 20) return 'high'
  if (mins > 10) return 'medium'
  return 'low'
}

const urgencyStyles = {
  low: 'border-l-4 border-green-400',
  medium: 'border-l-4 border-yellow-400',
  high: 'border-l-4 border-red-500 animate-pulse-slow',
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
      if (status === 'ready') toast.success('Order marked as ready! 🎉')
      if (status === 'preparing') toast.success('Order is being prepared 👨‍🍳')
    } catch {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const pending = orders.filter(o => o.status === 'pending')
  const preparing = orders.filter(o => o.status === 'preparing')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-orange to-brand-red rounded-xl flex items-center justify-center">
            <ChefHat size={22} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">Kitchen Display</h1>
            <p className="text-xs text-gray-400">Bakes & Delights</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span className="text-gray-300">{pending.length} Pending</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-gray-300">{preparing.length} Preparing</span>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={32} className="animate-spin text-brand-orange" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-300">All Clear!</h2>
            <p className="text-gray-500">No active orders. Kitchen is ready.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {orders.map(order => {
                const urgency = getUrgency(order.createdAt)
                const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className={`bg-gray-800 rounded-2xl overflow-hidden ${urgencyStyles[urgency]}`}
                  >
                    {/* Card header */}
                    <div className="px-5 pt-4 pb-3 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {order.tableNumber ? (
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-orange to-brand-red rounded-xl flex items-center justify-center">
                              <span className="font-bold text-lg">{order.tableNumber}</span>
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                              <TableProperties size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white">{order.customerName}</p>
                            <p className="text-xs text-gray-400 font-mono">{order.orderNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                            urgency === 'high' ? 'bg-red-900/50 text-red-400' :
                            urgency === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-green-900/50 text-green-400'
                          }`}>
                            <Clock size={11} />
                            {mins}m ago
                          </div>
                          <span className={`text-xs mt-1 block font-semibold ${
                            order.status === 'preparing' ? 'text-blue-400' : 'text-yellow-400'
                          }`}>
                            {order.status === 'preparing' ? '👨‍🍳 Preparing' : '⏳ Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="p-5">
                      <div className="space-y-3 mb-5">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              order.status === 'preparing' ? 'bg-blue-600' : 'bg-yellow-600'
                            }`}>
                              ×{item.quantity}
                            </div>
                            <span className="text-white font-medium">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-xl">
                          <p className="text-xs text-yellow-300">
                            <span className="font-bold">Note: </span>{order.notes}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatus(order.id, 'preparing')}
                            disabled={updating === order.id}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 text-sm"
                          >
                            <Flame size={16} />
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleStatus(order.id, 'ready')}
                            disabled={updating === order.id}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 text-sm"
                          >
                            <CheckCircle size={16} />
                            Mark as Ready
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
      </div>
    </div>
  )
}
