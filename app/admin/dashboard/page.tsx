'use client'
import { useState, useEffect } from 'react'
import { getOrders, getMenuItems } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import { formatCurrency, getStatusColor, timeAgo } from '@/utils'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import {
  TrendingUp, ShoppingBag, Clock, CheckCircle, AlertCircle,
  Truck, Users, ChefHat, ArrowUpRight, ArrowRight, Activity,
  Package, IndianRupee, Flame, BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [menuCount, setMenuCount] = useState(0)

  useEffect(() => {
    Promise.all([
      getOrders(),
      getMenuItems()
    ]).then(([o, items]) => {
      setOrders(o)
      setMenuCount(items.length)
      setLoading(false)
    })
  }, [])

  const today = new Date().toDateString()
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today)
  const todayRevenue = todayOrders.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'completed').reduce((s, o) => s + o.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing')
  const completedToday = todayOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length
  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'completed').reduce((s, o) => s + o.total, 0)
  const uniqueCustomers = new Set(orders.map(o => o.userId)).size

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const stats = [
    { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: IndianRupee, gradient: 'from-emerald-500 to-teal-600', lightBg: 'bg-emerald-50', lightText: 'text-emerald-600' },
    { label: "Today's Orders", value: todayOrders.length, icon: ShoppingBag, gradient: 'from-blue-500 to-indigo-600', lightBg: 'bg-blue-50', lightText: 'text-blue-600' },
    { label: 'Pending Orders', value: pendingOrders.length, icon: Clock, gradient: 'from-amber-500 to-orange-600', lightBg: 'bg-amber-50', lightText: 'text-amber-600' },
    { label: 'Completed Today', value: completedToday, icon: CheckCircle, gradient: 'from-violet-500 to-purple-600', lightBg: 'bg-violet-50', lightText: 'text-violet-600' },
  ]

  const recentOrders = orders.slice(0, 6)

  return (
    <div className="p-0 space-y-8">
      {/* PREMIUM ADMIN WELCOME BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-10"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-6 right-8 opacity-[0.03]">
          <ChefHat size={200} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
              <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em]">System Online</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black text-white tracking-tighter leading-none mb-2">
              {greeting()}, <span className="text-brand-primary">{profile?.name || user?.displayName || 'Admin'}</span>
            </h1>
            <p className="text-white/40 text-sm font-medium max-w-md">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/admin/orders" className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 backdrop-blur-sm">
              <Package size={14} /> Manage Orders
            </Link>
            <Link href="/delivery" className="flex items-center gap-2 px-5 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-primary/30">
              <Truck size={14} /> Delivery App
            </Link>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="relative z-10 mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Total Orders</p>
            <p className="text-2xl font-black text-white tracking-tighter">{orders.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Customers</p>
            <p className="text-2xl font-black text-white tracking-tighter">{uniqueCustomers}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Menu Items</p>
            <p className="text-2xl font-black text-white tracking-tighter">{menuCount}</p>
          </div>
        </div>
      </motion.div>

      {/* STATS CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-36 rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden bg-white rounded-[1.5rem] p-6 border border-gray-100/80 shadow-[0_4px_24px_rgb(0,0,0,0.03)] group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500"
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 ${stat.lightBg} rounded-2xl flex items-center justify-center ${stat.lightText}`}>
                  <stat.icon size={22} />
                </div>
                <div className={`w-8 h-8 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0`}>
                  <ArrowUpRight size={14} className="text-white" />
                </div>
              </div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter mb-1">{stat.value}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
              
              {/* Decorative gradient line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            </motion.div>
          ))}
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {[
          { label: 'Add Menu Item', href: '/admin/menu', icon: ChefHat, color: 'text-[#FF6B2C] bg-[#FFF5F0] border-transparent hover:bg-[#FFEAE0]' },
          { label: 'View Analytics', href: '/admin/analytics', icon: BarChart3, color: 'text-[#8B5CF6] bg-[#F8F5FF] border-transparent hover:bg-[#F3E8FF]' },
          { label: 'Kitchen Display', href: '/kitchen', icon: Flame, color: 'text-[#EA580C] bg-[#FFF5F0] border-transparent hover:bg-[#FFEAE0]' },
          { label: 'All Orders', href: '/admin/orders', icon: Package, color: 'text-[#2563EB] bg-[#F4F8FF] border-transparent hover:bg-[#E0E7FF]' },
        ].map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Link
              href={action.href}
              className={`flex items-center gap-4 px-6 py-5 rounded-[1.25rem] border transition-all cursor-pointer shadow-sm hover:shadow-md ${action.color}`}
            >
              <action.icon size={20} className="flex-shrink-0" />
              <span className="text-sm font-[800] tracking-tight">{action.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100/80 shadow-[0_4px_24px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity size={16} className="text-brand-primary" />
                <h2 className="font-display text-xl font-black text-gray-900 tracking-tight">Recent Orders</h2>
              </div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Live Feed — Auto-updating</p>
            </div>
            <Link href="/admin/orders" className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline px-4 py-2.5 bg-brand-primary/5 rounded-xl transition-all hover:bg-brand-primary/10">View All</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-18 rounded-2xl" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No orders yet</p>
              <p className="text-xs text-gray-300 mt-2">Orders will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 group cursor-pointer"
                >
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center font-black text-gray-900 shadow-sm text-sm group-hover:bg-brand-primary group-hover:text-white transition-all">
                    {order.customerName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{order.customerName}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {timeAgo(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      order.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      order.status === 'preparing' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      order.status === 'ready' ? 'bg-violet-50 text-violet-600 border border-violet-100' :
                      order.status === 'out_for_delivery' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                      order.status === 'delivered' || order.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' :
                      'bg-gray-50 text-gray-600 border border-gray-100'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-sm font-black text-gray-900 mt-1.5">{formatCurrency(order.total)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts & Activity */}
        <div className="space-y-6">
          {/* Pending Alerts */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100/80 shadow-[0_4px_24px_rgb(0,0,0,0.03)]">
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${pendingOrders.length > 0 ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
              <h2 className="font-display text-xl font-black text-gray-900 tracking-tight">
                {pendingOrders.length > 0 ? 'Action Required' : 'All Clear'}
              </h2>
            </div>
            <div className="space-y-3">
              {pendingOrders.length > 0 ? (
                pendingOrders.slice(0, 4).map(order => (
                  <div key={order.id} className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 group hover:bg-amber-50 transition-all">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-amber-900 leading-tight truncate">{order.customerName}</p>
                      <p className="text-[10px] font-bold text-amber-600 mt-0.5 uppercase tracking-tight">
                        {order.status === 'pending' ? 'Awaiting Accept' : 'In Preparation'}
                      </p>
                    </div>
                    <span className="text-xs font-black text-amber-700">{formatCurrency(order.total)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-green-50/50 rounded-[1.5rem] border border-green-100/50">
                  <CheckCircle size={36} className="mx-auto mb-3 text-green-500" />
                  <p className="text-xs font-black text-green-600 uppercase tracking-widest">No Pending Orders</p>
                  <p className="text-[10px] text-green-400 mt-1 font-medium">Everything is up to date</p>
                </div>
              )}
              {pendingOrders.length > 4 && (
                <Link href="/admin/orders" className="text-[10px] font-black text-brand-primary uppercase tracking-widest block text-center pt-3 hover:underline">
                  +{pendingOrders.length - 4} More Pending
                </Link>
              )}
            </div>
          </div>

          {/* Performance Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-6 md:p-8 text-white">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={16} className="text-brand-primary" />
              <h3 className="font-display text-lg font-black tracking-tight">Performance</h3>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Avg Order Value</span>
                  <span className="text-lg font-black tracking-tighter">
                    {orders.length > 0 ? formatCurrency(Math.round(totalRevenue / orders.length)) : '₹0'}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '68%' }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-brand-primary to-emerald-400 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Completion Rate</span>
                  <span className="text-lg font-black tracking-tighter">
                    {orders.length > 0 ? Math.round((orders.filter(o => o.status === 'delivered' || o.status === 'completed').length / orders.length) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${orders.length > 0 ? Math.round((orders.filter(o => o.status === 'delivered' || o.status === 'completed').length / orders.length) * 100) : 0}%` }}
                    transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                  />
                </div>
              </div>
              <Link href="/admin/analytics" className="flex items-center justify-center gap-2 w-full py-3.5 bg-white/10 hover:bg-white/15 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-4 border border-white/5">
                <BarChart3 size={12} /> View Full Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
