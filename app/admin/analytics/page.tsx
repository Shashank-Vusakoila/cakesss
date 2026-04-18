'use client'
import { useState, useEffect } from 'react'
import { getOrders } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import { formatCurrency } from '@/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, ShoppingBag, DollarSign, Users } from 'lucide-react'
import { motion } from 'framer-motion'

const COLORS = ['#FF6B2C', '#E84040', '#FF9A3C', '#6B3A1F', '#FFA07A', '#FF4500']

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrders().then(o => { setOrders(o); setLoading(false) })
  }, [])

  // Daily sales (last 14 days)
  const dailySales = (() => {
    const map: Record<string, { revenue: number; orders: number }> = {}
    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      map[key] = { revenue: 0, orders: 0 }
    }
    orders.forEach(o => {
      if (o.paymentStatus !== 'paid') return
      const key = new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      if (map[key]) {
        map[key].revenue += o.total
        map[key].orders += 1
      }
    })
    return Object.entries(map).map(([date, data]) => ({ date, ...data }))
  })()

  // Top items
  const topItems = (() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {}
    orders.forEach(o => {
      o.items?.forEach(item => {
        if (!map[item.name]) map[item.name] = { name: item.name, count: 0, revenue: 0 }
        map[item.name].count += item.quantity
        map[item.name].revenue += item.price * item.quantity
      })
    })
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 6)
  })()

  // Order status distribution
  const statusDist = (() => {
    const map: Record<string, number> = {}
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  })()

  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)
  const avgOrderValue = orders.length ? totalRevenue / orders.filter(o => o.paymentStatus === 'paid').length : 0
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
    { label: 'Avg Order Value', value: formatCurrency(Math.round(avgOrderValue)), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
    { label: "Today's Orders", value: todayOrders, icon: Users, color: 'text-orange-600 bg-orange-50' },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array(2).fill(0).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-display text-2xl font-bold text-gray-800">Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
              <kpi.icon size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Daily Revenue Chart */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-5">Revenue (Last 14 Days)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailySales}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B2C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FF6B2C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
            <Tooltip formatter={(v: any) => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="revenue" stroke="#FF6B2C" strokeWidth={2.5} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Top Selling Items</h2>
          {topItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#FF6B2C" radius={[0, 6, 6, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Order Status Distribution</h2>
          {statusDist.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {statusDist.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily orders chart */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-5">Daily Orders Count</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="orders" fill="#E84040" radius={[6, 6, 0, 0]} name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
