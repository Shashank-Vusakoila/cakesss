'use client'
import { useState, useEffect } from 'react'
import { getOrders } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import { formatCurrency, getStatusColor, timeAgo } from '@/utils'
import { motion } from 'framer-motion'
import { TrendingUp, ShoppingBag, Clock, CheckCircle, AlertCircle, Truck } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrders().then(o => { setOrders(o); setLoading(false) })
  }, [])

  const today = new Date().toDateString()
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today)
  const todayRevenue = todayOrders.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'completed').reduce((s, o) => s + o.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing')
  const completedToday = todayOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length

  const stats = [
    { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: TrendingUp, color: 'bg-green-50 text-green-600', change: '' },
    { label: "Today's Orders", value: todayOrders.length, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600', change: '' },
    { label: 'Pending Orders', value: pendingOrders.length, icon: Clock, color: 'bg-amber-50 text-amber-600', change: '' },
    { label: 'Completed Today', value: completedToday, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', change: '' },
  ]

  const recentOrders = orders.slice(0, 8)

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/delivery" className="btn-primary text-sm flex items-center gap-2">
          <Truck size={16} /> Open Delivery App
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-brand-primary font-medium hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {timeAgo(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge border text-[10px] ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-sm font-bold text-gray-700 mt-1">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Active Alerts</h2>
          <div className="space-y-3">
            {pendingOrders.length > 0 ? (
              pendingOrders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-start gap-3 p-3 rounded-xl bg-brand-background border border-brand-primary/10">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-brand-dark">{order.customerName}</p>
                    <p className="text-xs text-brand-primary mt-0.5">
                      {order.status === 'pending' ? 'Awaiting preparation' : 'Being prepared'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle size={28} className="mx-auto mb-2 text-green-400" />
                <p className="text-sm">All caught up!</p>
              </div>
            )}
            {pendingOrders.length > 5 && (
              <Link href="/admin/orders" className="text-xs text-brand-primary font-medium block text-center pt-1">
                +{pendingOrders.length - 5} more orders
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
