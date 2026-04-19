'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { getOrders } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import { formatCurrency } from '@/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, ShoppingBag, DollarSign, Users, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const COLORS = ['#FF6B20', '#0F172A', '#10B981', '#FF9A3C', '#E84040', '#6366F1']

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState(14)

  const loadData = useCallback(async () => {
    setRefreshing(true)
    try {
      const o = await getOrders()
      setOrders(o)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Process data with memory optimization and proper date handling
  const stats = useMemo(() => {
    const dailyMap: Record<string, { revenue: number; orders: number }> = {}
    const today = new Date()
    const locale = 'en-IN'
    const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    
    // Initialize map for the selected time range to ensure all dates are present
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString(locale, dateOptions)
      dailyMap[key] = { revenue: 0, orders: 0 }
    }

    const itemMap: Record<string, { name: string; count: number; revenue: number }> = {}
    const statusMap: Record<string, number> = {}
    let totalRevenue = 0
    let paidOrdersCount = 0
    let todayOrdersCount = 0
    let activeOrdersCount = 0

    orders.forEach(o => {
      const orderDate = new Date(o.createdAt)
      const key = orderDate.toLocaleDateString(locale, dateOptions)
      
      // Status Dist
      statusMap[o.status] = (statusMap[o.status] || 0) + 1

      // Revenue Logic: Include Paid, Delivered, or Completed
      const isRevenue = o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'completed'
      
      if (isRevenue) {
        totalRevenue += o.total
        paidOrdersCount++
        if (dailyMap[key]) {
          dailyMap[key].revenue += o.total
          dailyMap[key].orders += 1
        }
      }

      // Today's context
      if (orderDate.toDateString() === today.toDateString()) {
        todayOrdersCount++
      }

      // Active orders tracking
      if (['pending', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)) {
        activeOrdersCount++
      }

      // Top Items aggregation
      o.items?.forEach(item => {
        if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, count: 0, revenue: 0 }
        itemMap[item.name].count += item.quantity
        itemMap[item.name].revenue += item.price * item.quantity
      })
    })

    const dailyData = Object.entries(dailyMap).map(([date, data]) => ({ date, ...data }))
    const topItemsData = Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5)
    const statusDistData = Object.entries(statusMap).map(([name, value]) => ({ 
      name: name.replace(/_/g, ' ').toUpperCase(), 
      value 
    }))

    return {
      dailyData,
      topItemsData,
      statusDistData,
      totalRevenue,
      avgOrderValue: paidOrdersCount ? totalRevenue / paidOrdersCount : 0,
      todayCount: todayOrdersCount,
      activeOrdersCount,
      totalOrdersCount: orders.length
    }
  }, [orders, timeRange])

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), trend: '+12.5%', isUp: true, icon: DollarSign, color: 'text-brand-orange bg-orange-50' },
    { label: 'Total Volume', value: stats.totalOrdersCount, trend: '+8.2%', isUp: true, icon: ShoppingBag, color: 'text-brand-dark bg-slate-50' },
    { label: 'Avg Ticket', value: formatCurrency(Math.round(stats.avgOrderValue)), trend: '-2.1%', isUp: false, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Active Pipeline', value: stats.activeOrdersCount, trend: 'Live', isUp: true, icon: RefreshCw, color: 'text-indigo-600 bg-indigo-50' },
  ]

  if (loading) {
    return (
      <div className="p-10 space-y-8 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="w-48 h-10 bg-slate-100 rounded-xl" />
          <div className="w-32 h-10 bg-slate-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-slate-50 rounded-[2rem]" />)}
        </div>
        <div className="h-96 bg-slate-50 rounded-[3rem]" />
      </div>
    )
  }

  return (
    <div className="p-8 lg:p-12 space-y-10 font-body min-h-screen bg-[#FAFAF8]">
      {/* Header section with intelligence feel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Business Intelligence</span>
           </div>
           <h1 className="font-display text-4xl font-black text-brand-dark tracking-tighter flex items-center gap-3">
             Analytics Engine <Sparkles className="text-brand-orange" size={24} />
           </h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white p-1 rounded-2xl border border-slate-100 flex shadow-sm">
              {[7, 14, 30].map(r => (
                 <button 
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${timeRange === r ? 'bg-brand-dark text-white' : 'text-slate-400 hover:text-brand-dark'}`}
                 >
                   {r} DAYS
                 </button>
              ))}
           </div>
           <button 
            onClick={loadData}
            disabled={refreshing}
            className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-orange transition-all shadow-sm group"
           >
             <RefreshCw size={20} className={refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
           </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={kpi.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="group card-premium p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
               <kpi.icon size={48} />
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${kpi.color}`}>
              <kpi.icon size={22} />
            </div>
            <div className="flex items-end justify-between">
               <div>
                  <div className="text-3xl font-black text-brand-dark tracking-tighter">{kpi.value}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{kpi.label}</div>
               </div>
               <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold ${kpi.isUp ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                  {kpi.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {kpi.trend}
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Revenue Chart - Large & Impactful */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="card-premium p-10"
      >
        <div className="flex items-center justify-between mb-10">
           <div>
              <h2 className="text-2xl font-black text-brand-dark tracking-tighter">Revenue Trajectory</h2>
              <p className="text-xs text-slate-400 font-medium">Daily financial performance across the selected window</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-brand-orange" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Orders</span>
              </div>
           </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B20" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#FF6B20" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                tickLine={false} 
                axisLine={false}
                dy={15}
              />
              <YAxis 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={v => `₹${v}`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '20px', 
                  border: 'none', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '16px'
                }} 
                itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                labelStyle={{ fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10px', color: '#64748b' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#FF6B20" 
                strokeWidth={4} 
                fill="url(#revenueGrad)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top items with custom styling */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-10">
          <h2 className="text-xl font-black text-brand-dark tracking-tighter mb-8">Bestseller Inventory</h2>
          {stats.topItemsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
               <ShoppingBag size={48} className="mb-4 opacity-20" />
               <p className="text-xs font-black uppercase tracking-widest">No Sales Data</p>
            </div>
          ) : (
            <div className="space-y-6">
               {stats.topItemsData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">
                        0{idx + 1}
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-end mb-2">
                           <span className="text-sm font-black text-brand-dark truncate pr-4">{item.name}</span>
                           <span className="text-xs font-black text-brand-orange">{item.count} Sold</span>
                        </div>
                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                           <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.count / stats.topItemsData[0].count) * 100}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className="h-full bg-brand-dark" 
                           />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          )}
        </motion.div>

        {/* Status distribution pie */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-10">
          <h2 className="text-xl font-black text-brand-dark tracking-tighter mb-8">Operational Flow</h2>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={stats.statusDistData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={70} 
                  outerRadius={90} 
                  paddingAngle={8} 
                  dataKey="value"
                  animationBegin={200}
                >
                  {stats.statusDistData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
