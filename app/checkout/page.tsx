'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { createOrder, getUserProfile, syncUserProfile } from '@/lib/firebase/firestore'
import { formatCurrency, generateOrderNumber, getValidImageUrl } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, Loader2, CreditCard, Banknote, ArrowRight, User, MapPin, Navigation, Sparkles, X, ShoppingBag, Plus } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { SavedAddress } from '@/types'
import 'leaflet/dist/leaflet.css'

const MapPicker = dynamic(() => import('@/components/checkout/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-[#FAFAF8] animate-pulse rounded-[2rem] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-300">Syncing Map Core...</div>
})

declare global {
  interface Window { Razorpay: any }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, itemCount, subtotal, tax, total, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null)
  const [saveToProfile, setSaveToProfile] = useState(false)
  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    notes: '',
  })
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [payMethod, setPayMethod] = useState<'cod' | 'razorpay'>('cod')

  useEffect(() => {
    if (user) {
      setForm(prev => ({ ...prev, name: user.displayName || prev.name }))
      getUserProfile(user.uid).then(profile => {
        if (profile?.savedAddresses) {
          setSavedAddresses(profile.savedAddresses)
        }
      })
    }
  }, [user])

  const selectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddrId(addr.id)
    setForm(prev => ({ ...prev, address: addr.address }))
    setCoords({ lat: addr.lat, lng: addr.lng })
    setSaveToProfile(false)
  }

  const sub = subtotal()
  const t = tax()
  const tot = total()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-8 text-center p-6">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-40 h-40 bg-white rounded-[4rem] shadow-card flex items-center justify-center border border-slate-50 relative">
           <ShoppingBag size={64} className="text-brand-orange" />
           <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-2 -right-2 w-12 h-12 bg-brand-dark rounded-full flex items-center justify-center text-white text-sm font-black">0</motion.div>
        </motion.div>
        <div>
           <h2 className="text-4xl font-black text-brand-dark tracking-tighter mb-3">Your selection is empty</h2>
           <p className="text-slate-400 font-medium italic italic-font max-w-sm mx-auto">Visit our menu to select some fresh bakes for your celebration.</p>
        </div>
        <Link href="/menu" className="btn-premium">Browse Menu</Link>
      </div>
    )
  }

  const placeOrder = async (paymentId?: string) => {
    const orderNumber = generateOrderNumber()
    
    if (saveToProfile && user && coords && form.address.trim()) {
      const newSaved: SavedAddress = {
        id: Math.random().toString(36).substr(2, 9),
        label: 'Other',
        address: form.address,
        lat: coords.lat,
        lng: coords.lng
      }
      const updated = [...savedAddresses, newSaved]
      await syncUserProfile(user.uid, { savedAddresses: updated })
    }

    const orderId = await createOrder({
      orderNumber,
      userId: user?.uid || '',
      customerName: form.name,
      customerPhone: form.phone,
      customerAddress: form.address,
      customerLat: coords?.lat,
      customerLng: coords?.lng,
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
    router.push(`/tracking/${orderId}`)
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
        description: `Order of ${itemCount()} item(s)`,
        handler: async (response: any) => {
          try {
            await placeOrder(response.razorpay_payment_id)
            toast.success('Transaction Verified!')
          } catch {
            toast.error('System synchronization failed.')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: form.name,
          contact: form.phone,
        },
        theme: { color: '#FF6B20' },
        modal: { ondismiss: () => setLoading(false) },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    }
    document.body.appendChild(script)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Identification Required'); return }
    if (form.phone.replace(/\D/g, '').length < 10) { toast.error('Valid Mobile Required'); return }
    if (!form.address.trim()) { toast.error('Destination Coordinate Required'); return }
    if (!user) { toast.error('Session Lost'); router.push('/login'); return }

    setLoading(true)
    if (payMethod === 'razorpay') {
      handleRazorpay()
    } else {
      try {
        await placeOrder()
        toast.success('Bake Request Confirmed!')
      } catch {
        toast.error('Order Placement Failed.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] selection:bg-brand-orange selection:text-white font-body">
      <Navbar />
      <div className="max-w-[1240px] mx-auto px-4 pt-40 pb-32">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Main Form Area */}
          <div className="flex-1 space-y-10 w-full">
            
            {/* Identity Status */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="card-premium p-8 flex items-center justify-between"
            >
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center text-white shadow-xl relative overflow-hidden group">
                     {user?.photoURL ? <Image src={user.photoURL} alt="Profile" width={64} height={64} className="rounded-2xl" /> : <User size={28} />}
                     <div className="absolute inset-0 bg-brand-orange opacity-0 group-hover:opacity-20 transition-opacity" />
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-success" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Session Active</span>
                     </div>
                     <h2 className="text-2xl font-black text-brand-dark tracking-tighter">{user?.displayName || user?.email || 'Gourmet Member'}</h2>
                  </div>
               </div>
               <div className="w-12 h-12 bg-brand-success/10 rounded-2xl flex items-center justify-center text-brand-success shadow-sm">
                  <CheckCircle size={24} />
               </div>
            </motion.div>

            {/* Delivery Core */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="card-premium p-8 lg:p-12 relative overflow-hidden"
            >
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-orange/5 blur-3xl rounded-full" />
               
               <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center text-white shadow-xl flex-shrink-0">
                     <MapPin size={28} />
                  </div>
                  <div className="flex-1 w-full">
                     <h2 className="text-3xl font-black text-brand-dark tracking-tighter mb-10">Shipping Logistics</h2>
                     
                     {savedAddresses.length > 0 && (
                       <div className="mb-12">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-5 px-1">Select Coordinate From Profile</p>
                          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                             {savedAddresses.map(addr => (
                                <button
                                   key={addr.id}
                                   onClick={() => selectSavedAddress(addr)}
                                   className={`flex-shrink-0 flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all ${
                                      selectedAddrId === addr.id 
                                      ? 'border-brand-orange bg-brand-orange/5 text-brand-orange shadow-md scale-105' 
                                      : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                                   }`}
                                >
                                   <MapPin size={16} />
                                   <span className="text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap">{addr.label}</span>
                                </button>
                             ))}
                             <Link href="/profile" className="flex-shrink-0 flex items-center gap-4 px-6 py-4 rounded-2xl border-2 border-dashed border-slate-100 text-slate-300 hover:text-brand-orange hover:border-brand-orange transition-all">
                                <Plus size={16} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Add New</span>
                             </Link>
                          </div>
                       </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recipient</label>
                           <input className="input-field" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Secure Contact</label>
                           <input className="input-field" placeholder="Mobile Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className="col-span-full space-y-3">
                           <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Destination Details</label>
                              <button 
                                 onClick={() => setShowMap(true)}
                                 className="flex items-center gap-2 text-brand-orange font-black text-[10px] uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                              >
                                 <Navigation size={12} /> {coords ? 'Locked' : 'Pin On Map'}
                              </button>
                           </div>
                           <textarea
                              className="input-field min-h-[140px] py-6 resize-none"
                              placeholder="House, Floor, Landmark, Street details..."
                              value={form.address}
                              onChange={e => { setForm({ ...form, address: e.target.value }); setSelectedAddrId(null) }}
                           />
                        </div>

                        {coords && !selectedAddrId && (
                           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="col-span-full">
                              <label className="flex items-center gap-4 p-5 bg-brand-orange/5 rounded-2xl border border-brand-orange/10 cursor-pointer group">
                                 <div className="relative w-6 h-6">
                                    <input type="checkbox" className="peer absolute inset-0 opacity-0 cursor-pointer" checked={saveToProfile} onChange={e => setSaveToProfile(e.target.checked)} />
                                    <div className="w-full h-full border-2 border-brand-orange rounded-lg transition-all peer-checked:bg-brand-orange flex items-center justify-center">
                                       <CheckCircle size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                 </div>
                                 <span className="text-xs font-bold text-brand-dark group-hover:text-brand-orange transition-colors">Remember this destination for future bakes</span>
                              </label>
                           </motion.div>
                        )}

                        <div className="col-span-full space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Delivery Directives</label>
                           <input className="input-field" placeholder="Ex: Ring the bell twice, Leave with security" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Payment Systems */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="card-premium p-8 lg:p-12"
            >
               <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center text-white shadow-xl flex-shrink-0">
                     <CreditCard size={28} />
                  </div>
                  <div className="flex-1 w-full">
                     <h2 className="text-3xl font-black text-brand-dark tracking-tighter mb-10">Settlement Method</h2>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                        {['cod', 'razorpay'].map(m => (
                          <button
                           key={m}
                           onClick={() => setPayMethod(m as any)}
                           className={`p-6 flex items-center gap-6 rounded-3xl border-2 transition-all text-left ${
                              payMethod === m ? 'border-brand-orange bg-brand-orange/5 scale-[1.02] shadow-md' : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                           }`}
                          >
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${payMethod === m ? 'bg-brand-orange text-white' : 'bg-white text-slate-200'}`}>
                                {m === 'cod' ? <Banknote size={24} /> : <CreditCard size={24} />}
                             </div>
                             <div>
                                <p className="text-sm font-black text-brand-dark tracking-tight">{m === 'cod' ? 'Cash Settlement' : 'Digital Intelligence'}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{m === 'cod' ? 'Hand on Delivery' : 'Fast / Encrypted'}</p>
                             </div>
                          </button>
                        ))}
                     </div>

                     <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-premium w-full py-6 flex items-center justify-center gap-5 group"
                     >
                        {loading ? <Loader2 className="animate-spin" /> : <>Finalize Bake Request <ArrowRight size={22} className="group-hover:translate-x-3 transition-transform" /></>}
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>

          {/* Sidebar Area: Billing (Sticky Glass) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[420px] lg:sticky lg:top-40"
          >
             <div className="glass border border-white p-10 rounded-[3rem] shadow-glass relative overflow-hidden">
                <div className="flex items-center gap-5 mb-10">
                   <div className="w-12 h-12 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <ShoppingBag size={24} />
                   </div>
                   <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Bake Summary</h3>
                </div>

                <div className="space-y-8 max-h-[450px] overflow-y-auto px-1 pr-4 mb-10 scrollbar-hide">
                   {items.map(item => (
                      <div key={item.menuItem.id} className="flex gap-6 items-start">
                         <div className="relative w-16 h-16 rounded-[1.5rem] overflow-hidden shadow-md flex-shrink-0 border border-white">
                            <Image src={getValidImageUrl(item.menuItem.image, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80')} alt={item.menuItem.name} fill className="object-cover" />
                            <div className="absolute top-1 right-1">
                               <div className={item.menuItem.isVeg ? 'veg-dot scale-50' : 'non-veg-dot scale-50'} />
                            </div>
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black text-brand-dark leading-tight line-clamp-2">{item.menuItem.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Quantity: <span className="text-brand-orange">{item.quantity}</span></p>
                         </div>
                         <p className="text-sm font-black text-brand-dark">{formatCurrency(item.menuItem.price * item.quantity)}</p>
                      </div>
                   ))}
                </div>

                {/* Dashed Invoice Styling */}
                <div className="space-y-5 pt-10 border-t-2 border-dashed border-slate-200">
                   <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <span>Selection Total</span>
                      <span className="text-brand-dark">{formatCurrency(sub)}</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <span>Logistics Fee</span>
                      <span className="text-brand-success">Complimentary</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <span>Government Tax</span>
                      <span className="text-brand-dark">{formatCurrency(t)}</span>
                   </div>
                   
                   <div className="pt-8 mt-4 border-t-2 border-brand-dark flex justify-between items-end">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Payable</p>
                         <h4 className="text-4xl font-black text-brand-dark tracking-tighter">Grand Total</h4>
                      </div>
                      <span className="text-4xl font-black text-brand-orange tracking-tighter">{formatCurrency(tot)}</span>
                   </div>
                </div>

                <div className="mt-12 p-6 bg-brand-orange/5 rounded-[2rem] border border-brand-orange/10 flex items-start gap-4">
                   <Sparkles size={20} className="text-brand-orange mt-1 flex-shrink-0" />
                   <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic italic-font">
                      Every bake is handcrafted with premium ingredients upon your final confirmation.
                   </p>
                </div>
             </div>
          </motion.div>
        </div>
      </div>

      {/* Map Intelligence Overlay */}
      <AnimatePresence>
        {showMap && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMap(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-xl" />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 30 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.9, opacity: 0, y: 30 }} 
               className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 h-full max-h-[85vh] flex flex-col"
            >
               <div className="p-10 border-b border-slate-50 flex items-center justify-between flex-shrink-0">
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <Navigation size={12} className="text-brand-orange" />
                        <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em]">Coordinate Sync</span>
                     </div>
                     <h3 className="text-3xl font-black text-brand-dark tracking-tighter">Tag Destination</h3>
                  </div>
                  <button onClick={() => setShowMap(false)} className="w-14 h-14 bg-slate-50 rounded-[1.8rem] flex items-center justify-center text-slate-400 hover:text-brand-dark hover:bg-slate-100 transition-all shadow-sm"><X size={28} /></button>
               </div>
               <div className="flex-1 relative">
                  <MapPicker onLocationSelect={(lat, lng) => setCoords({ lat, lng })} initialCoords={coords} />
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-white via-white/80 to-transparent flex justify-center">
                     <button onClick={() => setShowMap(false)} className="btn-premium px-16 shadow-2xl">Lock This Coordinate</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
