'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import { getMenuItems, getCategories, subscribeToOrders } from '@/lib/firebase/firestore'
import { MenuItem, Category, Order } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { getStatusDescription } from '@/utils'
import FoodCard from '@/components/menu/FoodCard'
import {
  ArrowRight, Star, Clock, Users, Award, Sparkles,
  ChevronRight, ChevronLeft, Truck, Heart, Shield, Quote, MapPin
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

const heroImages = [
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80', // Beautiful Berry Cake
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80', // Assorted Pastries
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', // Chocolate Cake
]

const stats = [
  { icon: Star, label: 'Rating', value: '4.9★', color: 'text-yellow-500' },
  { icon: Users, label: 'Happy Customers', value: '3000+', color: 'text-brand-primary' },
  { icon: Award, label: 'Years of Baking', value: '5+', color: 'text-brand-primary' },
  { icon: Clock, label: 'Avg Delivery', value: '30 min', color: 'text-blue-500' },
]

const highlights = [
  { icon: Heart, title: 'Made with Love', desc: 'Every item hand-crafted with premium ingredients', color: 'bg-red-50 text-red-500' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Fresh from oven to your doorstep', color: 'bg-brand-primary/10 text-brand-primary' },
  { icon: Shield, title: '100% Fresh', desc: 'No preservatives, baked daily fresh', color: 'bg-blue-50 text-blue-600' },
]

const testimonials = [
  { name: 'Priya S.', text: 'The cakes are absolutely divine! Best bakery in town. The chocolate truffle cake was heavenly.', rating: 5 },
  { name: 'Rahul K.', text: 'Ordered for my birthday party — everyone loved the pastries. Will order again!', rating: 5 },
  { name: 'Sneha M.', text: 'Fresh cookies, amazing brownies, and super fast delivery. Highly recommended!', rating: 5 },
]

export default function HomePage() {
  const { user } = useAuth()
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [heroIdx, setHeroIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [menuItems, cats] = await Promise.all([getMenuItems(), getCategories()])
        setItems(menuItems)
        setCategories(cats)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user) {
      setActiveOrder(null)
      return
    }

    const unsub = subscribeToOrders((orders) => {
      const active = orders.find(o => 
        o.userId === user.uid && 
        !['delivered', 'completed', 'cancelled'].includes(o.status)
      )
      setActiveOrder(active || null)
    })

    return () => unsub()
  }, [user])

  const bestsellers = items.filter(i => i.isBestseller && i.isAvailable).slice(0, 4)
  const featured = items.filter(i => i.isAvailable).slice(0, 8)

  return (
    <div className="min-h-screen bg-brand-background">
      <Navbar />
      <CartDrawer />

      {/* ─── Hero Section (modern premium design) ────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-brand-background via-brand-card to-brand-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-6"
              >
                <span className="inline-flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold px-3 py-2 rounded-full">
                  <Sparkles size={13} />
                  Freshly Baked Every Day
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-brand-dark leading-tight"
              >
                The Perfect
                <br />
                <span className="text-brand-primary">Bakes</span> for
                <br />
                Every Mood
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-brand-text-light text-lg mt-5 leading-relaxed max-w-md"
              >
                Discover freshly baked cakes, pastries, cookies and more from Bakes & Delights. Every bite tells a story of love and perfection.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 mt-8"
              >
                <Link href="/menu" className="btn-primary flex items-center gap-2 text-base">
                  Order Now <ArrowRight size={18} />
                </Link>
                <Link href="/menu" className="btn-secondary flex items-center gap-2 text-base">
                  View Menu <ChevronRight size={16} />
                </Link>
              </motion.div>

              {/* Floating review card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-10 inline-flex items-center gap-4 bg-white rounded-2xl shadow-lg p-4 pr-6 border border-brand-border"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                  <Star size={22} className="text-yellow-500" fill="currentColor" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className="text-yellow-500" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-brand-text-light mt-0.5">3000+ happy customers</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — Circular plate hero image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative flex items-center justify-center"
            >
              {/* Decorative rings */}
              <div className="absolute w-[500px] h-[500px] rounded-full border-2 border-dashed border-brand-primary/10 animate-spin-slow" />
              <div className="absolute w-[440px] h-[440px] rounded-full border border-brand-primary/5" />

              {/* Main circular image */}
              <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] rounded-full overflow-hidden shadow-2xl ring-8 ring-white/80">
                <motion.div
                  key={heroIdx}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={heroImages[heroIdx]}
                    alt="Delicious bakes"
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-2 right-4 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-2 border border-brand-border"
              >
                <span className="text-2xl">🎂</span>
                <div>
                  <p className="text-xs font-bold text-brand-dark">Fresh Cakes</p>
                  <p className="text-[10px] text-brand-text-light">Baked daily</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3.5 }}
                className="absolute -bottom-2 left-4 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-2 border border-brand-border"
              >
                <span className="text-2xl">🍪</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">Cookies & More</p>
                  <p className="text-[10px] text-gray-400">20+ varieties</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Hero dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === heroIdx ? 'w-8 bg-brand-primary' : 'w-2 bg-brand-primary/30'}`}
            />
          ))}
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-brand-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon size={28} className={`mx-auto mb-2 ${stat.color}`} />
                <div className="font-display font-bold text-2xl text-brand-dark">{stat.value}</div>
                <div className="text-xs text-brand-text-light mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Bakes & Delights (3 highlights) ──────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-dark">
            Why <span className="text-brand-primary">Bakes & Delights?</span>
          </h2>
          <p className="text-brand-text-light mt-2">We believe every bite should be an experience</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="card p-6 flex gap-4 rounded-2xl"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${h.color}`}>
                <h.icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-brand-dark">{h.title}</h3>
                <p className="text-sm text-brand-text-light mt-1">{h.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Our Special Bakes (Bestsellers) ─────────────────────────────── */}
      {(bestsellers.length > 0 || loading) && (
        <section className="py-16 bg-brand-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold text-brand-dark">
                  Our Special Bakes
                </h2>
                <p className="text-brand-text-light text-sm mt-1">Most loved by our customers</p>
              </div>
              <Link href="/menu" className="flex items-center gap-1 text-brand-primary font-semibold text-sm hover:gap-2 transition-all">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {loading
                ? Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-brand-card rounded-2xl overflow-hidden shadow-md border border-brand-border">
                      <div className="skeleton h-44 w-full" />
                      <div className="p-4 space-y-3">
                        <div className="skeleton h-4 w-3/4" />
                        <div className="skeleton h-3 w-full" />
                        <div className="flex justify-between items-center mt-4">
                          <div className="skeleton h-5 w-16" />
                          <div className="skeleton h-8 w-16 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))
                : bestsellers.map(item => <FoodCard key={item.id} item={item} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* ─── Categories ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-brand-dark mb-8">
            Browse by <span className="text-brand-primary">Category</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {categories.filter(c => c.isActive).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/menu?category=${cat.id}`}
                  className="flex items-center gap-2 px-5 py-3 bg-brand-card rounded-2xl shadow-md hover:shadow-lg hover:border-brand-primary border border-brand-border transition-all text-sm font-medium text-brand-text-dark hover:text-brand-primary"
                >
                  <span className="text-xl">{cat.icon}</span>
                  {cat.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Testimonials (Our Customer Says) ──────────────────────────── */}
      <section className="py-20 bg-brand-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-dark mb-3">
                  Our Customer&apos;s <span className="text-brand-primary">Says</span>
                </h2>
                <p className="text-brand-text-light">What our beloved customers think about us</p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="card p-8 relative rounded-2xl">
                <Quote size={40} className="text-brand-primary/10 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center text-lg font-bold text-brand-primary">
                    {testimonials[testimonialIdx].name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-dark">{testimonials[testimonialIdx].name}</p>
                    <div className="flex items-center gap-0.5">
                      {[...Array(testimonials[testimonialIdx].rating)].map((_, i) => (
                        <Star key={i} size={11} className="text-yellow-500" fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-brand-text-dark text-sm leading-relaxed italic">
                  &ldquo;{testimonials[testimonialIdx].text}&rdquo;
                </p>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  onClick={() => setTestimonialIdx(i => (i - 1 + testimonials.length) % testimonials.length)}
                  className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center hover:bg-brand-primary/20 transition-colors"
                >
                  <ChevronLeft size={16} className="text-brand-primary" />
                </button>
                <button
                  onClick={() => setTestimonialIdx(i => (i + 1) % testimonials.length)}
                  className="w-9 h-9 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-orange-dark transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CTA / Ready to Order ───────────────────────────────────────── */}
      <section className="py-20 bg-brand-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-brand-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-brand-primary/50 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge bg-brand-primary/20 text-brand-primary border border-brand-primary/30 mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Sparkles size={13} /> Free Delivery on Orders Above ₹500
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mt-3">
              Ready to Order?
            </h2>
            <p className="text-gray-300 mt-3 text-lg">
              Freshly baked, delivered with love to your doorstep
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href="/menu" className="bg-brand-primary text-white font-semibold px-8 py-4 rounded-full hover:bg-brand-orange-dark transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2">
                Order Online <ArrowRight size={18} />
              </Link>
            </div>
            <p className="mt-4 text-gray-400 text-sm">
              📞 Call us: +91 97010 03268
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* ─── Active Order Tracker (Swiggy Style) ────────────────────────── */}
      <AnimatePresence>
        {activeOrder && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-[400px] z-40"
          >
            <Link href={`/order/${activeOrder.id}`}>
              <div className="bg-brand-dark rounded-3xl p-5 shadow-2xl border border-white/10 overflow-hidden relative group">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-primary/30 transition-colors" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Truck size={28} className="text-white animate-bounce-slow" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                      </span>
                      <p className="text-[10px] font-bold text-brand-primary tracking-widest uppercase">Live Tracking</p>
                    </div>
                    <h3 className="text-white font-bold text-lg leading-tight truncate">
                      {getStatusDescription(activeOrder.status)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-gray-400 text-xs flex items-center gap-1">
                         Order #{activeOrder.orderNumber.split('-')[1]}
                      </p>
                      <span className="text-gray-600">•</span>
                      <p className="text-brand-primary text-xs font-bold flex items-center gap-1 group-hover:underline">
                        Track Order <ArrowRight size={12} />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: activeOrder.status === 'pending' ? '25%' : 
                             activeOrder.status === 'preparing' ? '50%' :
                             activeOrder.status === 'ready' ? '75%' : '90%'
                    }}
                    className="h-full bg-brand-primary rounded-full transition-all duration-1000"
                  />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
