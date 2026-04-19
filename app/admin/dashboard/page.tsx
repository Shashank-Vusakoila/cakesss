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
    <div className="p-0">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mb-2 block">Overview</span>
          <h1 className="font-display text-4xl font-black text-gray-900 tracking-tighter">Dashboard</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/delivery" className="btn-primary text-xs py-3.5 px-6 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
          <Truck size={16} /> GO TO DELIVERY APP
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-6 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white group hover:bg-brand-primary transition-all duration-500"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-all ${stat.color}`}>
                <stat.icon size={22} className="group-hover:text-white transition-colors" />
              </div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter group-hover:text-white transition-colors">{stat.value}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 group-hover:text-white/70 transition-colors">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent orders */}
        <div className="lg:col-span-2 card p-8 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight">Recent Orders</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Live Feed</p>
            </div>
            <Link href="/admin/orders" className="text-[11px] font-black text-brand-primary uppercase tracking-widest hover:underline px-4 py-2 bg-brand-primary/10 rounded-xl transition-all">View All</Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 group">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-gray-900 shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-all">
                    {order.customerName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{order.customerName}</p>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mt-1">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {timeAgo(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status).replace('bg-', 'bg-opacity-10 text-').replace('text-', 'border-')}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-base font-black text-gray-900 mt-2">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card p-8 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white h-fit">
          <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight mb-8">Alerts</h2>
          <div className="space-y-4">
            {pendingOrders.length > 0 ? (
              pendingOrders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 group hover:bg-amber-100 transition-all">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-900 leading-tight">{order.customerName}</p>
                    <p className="text-[12px] font-bold text-amber-700 mt-1 uppercase tracking-tight">
                      {order.status === 'pending' ? 'Awaiting Accept' : 'In Preparation'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-green-50 rounded-[2rem] border border-green-100">
                <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
                <p className="text-sm font-black text-green-600 uppercase tracking-widest">Clear!</p>
              </div>
            )}
            {pendingOrders.length > 5 && (
              <Link href="/admin/orders" className="text-[11px] font-black text-brand-primary uppercase tracking-widest block text-center pt-4 hover:underline">
                +{pendingOrders.length - 5} MORE ORDERS
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
