'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { createOrder } from '@/lib/firebase/firestore'
import { formatCurrency, generateOrderNumber } from '@/utils'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, Loader2, CreditCard, Banknote } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

declare global {
  interface Window { Razorpay: any }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, subtotal, tax, total, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    notes: '',
  })
  const [payMethod, setPayMethod] = useState<'cod' | 'razorpay'>('cod')

  const sub = subtotal()
  const t = tax()
  const tot = total()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🛒</div>
        <h2 className="font-display text-2xl font-bold text-brand-dark">Your cart is empty</h2>
        <Link href="/menu" className="btn-primary">Browse Menu</Link>
      </div>
    )
  }

  const placeOrder = async (paymentId?: string) => {
    const orderNumber = generateOrderNumber()
    const orderId = await createOrder({
      orderNumber,
      userId: user?.uid || '',
      customerName: form.name,
      customerPhone: form.phone,
      customerAddress: form.address,
      items: items.map(i => ({
        menuItemId: i.menuItem.id,
        name: i.menuItem.name,
        price: i.menuItem.price,
        quantity: i.quantity,
        image: i.menuItem.image,
      })),
      subtotal: sub,
      tax: t,
      serviceCharge: 0,
      total: tot,
      status: 'pending',
      deliveryStatus: 'pending',
      paymentStatus: payMethod === 'cod' ? 'pending' : 'paid',
      paymentMethod: payMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay',
      paymentId: paymentId || '',
      notes: form.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    clearCart()
    router.push(`/order/${orderId}`)
  }

  const handleRazorpay = () => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: tot * 100,
        currency: 'INR',
        name: 'Bakes & Delights',
        description: `Order of ${items.length} item(s)`,
        handler: async (response: any) => {
          try {
            await placeOrder(response.razorpay_payment_id)
            toast.success('Payment successful!')
          } catch {
            toast.error('Order failed after payment. Please contact us.')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: form.name,
          contact: form.phone,
        },
        theme: { color: '#E67E22' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    }
    document.body.appendChild(script)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Please enter your name and phone number')
      return
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }
    if (!form.address.trim()) {
      toast.error('Please enter your delivery address')
      return
    }

    if (!user) {
      toast.error('Please login to place an order')
      router.push('/login')
      return
    }

    setLoading(true)

    if (payMethod === 'razorpay') {
      handleRazorpay()
    } else {
      try {
        await placeOrder()
        toast.success('Order placed successfully!')
      } catch (e) {
        console.error(e)
        toast.error('Failed to place order. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-brand-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/menu" className="flex items-center gap-2 text-brand-text-light hover:text-brand-primary text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Menu
          </Link>
          <h1 className="font-display text-3xl font-bold text-brand-dark mb-8">Checkout</h1>
        </motion.div>

        {!user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <p className="text-sm text-yellow-800">
              ⚠️ Please <Link href="/login" className="font-semibold underline">login or create an account</Link> to place your order and track delivery.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer info */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card p-6 rounded-2xl">
              <h2 className="font-semibold text-lg text-brand-dark mb-5">Delivery Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Full Name *</label>
                  <input
                    className="input-field"
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Phone Number *</label>
                  <input
                    className="input-field"
                    placeholder="+91 97010 03268"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    type="tel"
                    maxLength={13}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Delivery Address *</label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Enter your full delivery address"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-dark mb-1.5 block">Special Instructions</label>
                  <textarea
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Any special requests? (e.g., message on cake)"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>

            {/* Payment */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card p-6 rounded-2xl">
              <h2 className="font-semibold text-lg text-brand-dark mb-5">Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPayMethod('cod')}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                    payMethod === 'cod'
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-brand-border hover:border-brand-primary/50'
                  }`}
                >
                  <Banknote size={28} className={payMethod === 'cod' ? 'text-brand-primary' : 'text-brand-text-light'} />
                  <span className={`text-sm font-medium ${payMethod === 'cod' ? 'text-brand-primary' : 'text-brand-text-dark'}`}>
                    Cash on Delivery
                  </span>
                </button>
                <button
                  onClick={() => setPayMethod('razorpay')}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                    payMethod === 'razorpay'
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-brand-border hover:border-brand-primary/50'
                  }`}
                >
                  <CreditCard size={28} className={payMethod === 'razorpay' ? 'text-brand-primary' : 'text-brand-text-light'} />
                  <span className={`text-sm font-medium ${payMethod === 'razorpay' ? 'text-brand-primary' : 'text-brand-text-dark'}`}>
                    Pay Online (Razorpay)
                  </span>
                </button>
              </div>
              {payMethod === 'cod' && (
                <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-green-700">
                  💵 Pay when your order arrives at your doorstep
                </div>
              )}
              {payMethod === 'razorpay' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                  💳 Pay securely via UPI, Card, Net Banking
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Order summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
            <div className="card p-6 sticky top-24 rounded-2xl">
              <h2 className="font-semibold text-lg text-brand-dark mb-5">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-5">
                {items.map(item => (
                  <div key={item.menuItem.id} className="flex gap-3 items-center">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.menuItem.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200'}
                        alt={item.menuItem.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-dark line-clamp-1">{item.menuItem.name}</p>
                      <p className="text-xs text-brand-text-light">× {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-dark">
                      {formatCurrency(item.menuItem.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-brand-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-brand-text-light">
                  <span>Subtotal</span><span>{formatCurrency(sub)}</span>
                </div>
                <div className="flex justify-between text-brand-text-light">
                  <span>GST (5%)</span><span>{formatCurrency(t)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-brand-border">
                  <span className="text-brand-dark">Total</span>
                  <span className="text-brand-primary">{formatCurrency(tot)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full btn-primary mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing...</>
                ) : (
                  <><CheckCircle size={18} /> {payMethod === 'razorpay' ? `Pay ${formatCurrency(tot)}` : `Place Order • ${formatCurrency(tot)}`}</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
