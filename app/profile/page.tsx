'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserProfile, syncUserProfile } from '@/lib/firebase/firestore'
import { UserProfile, SavedAddress } from '@/types'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Mail, Phone, MapPin, 
  Settings, CreditCard, ChevronRight, 
  LogOut, Shield, Loader2, Camera, Plus, Trash2, X, Navigation, Sparkles, CheckCircle
} from 'lucide-react'
import { signOut } from '@/lib/firebase/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/components/checkout/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Map Intelligence...</div>
})

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [newAddress, setNewAddress] = useState<Partial<SavedAddress>>({ label: 'Home', address: '' })
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    async function load() {
      if (!user) {
        if (!authLoading) setLoading(false)
        return
      }
      const data = await getUserProfile(user.uid)
      if (data) {
        setProfile(data)
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || ''
        })
      }
      setLoading(false)
    }
    load()
  }, [user, authLoading])

  const handleUpdate = async () => {
    if (!user) return
    setSaving(true)
    try {
      await syncUserProfile(user.uid, form)
      setProfile(prev => prev ? { ...prev, ...form } : null)
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAddAddress = async () => {
    if (!user || !profile) return
    if (!newAddress.label || !newAddress.address || !coords) {
      toast.error('Please complete all fields')
      return
    }

    setSaving(true)
    const addressToAdd: SavedAddress = {
      id: Math.random().toString(36).substr(2, 9),
      label: newAddress.label as any,
      address: newAddress.address,
      lat: coords.lat,
      lng: coords.lng
    }

    const updatedAddresses = [...(profile.savedAddresses || []), addressToAdd]
    try {
      await syncUserProfile(user.uid, { savedAddresses: updatedAddresses })
      setProfile({ ...profile, savedAddresses: updatedAddresses })
      setShowAddressModal(false)
      setNewAddress({ label: 'Home', address: '' })
      setCoords(null)
      toast.success('Address saved to profile!')
    } catch {
      toast.error('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!user || !profile?.savedAddresses) return
    const updated = profile.savedAddresses.filter(a => a.id !== id)
    try {
      await syncUserProfile(user.uid, { savedAddresses: updated })
      setProfile({ ...profile, savedAddresses: updated })
      toast.success('Address removed')
    } catch {
      toast.error('Failed to remove')
    }
  }

  const handleLogout = async () => {
    await signOut()
    toast.success('Signed out')
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
          <User size={40} className="text-gray-200" />
        </div>
        <h2 className="text-2xl font-black text-brand-dark tracking-tight">Access Restricted</h2>
        <p className="text-gray-400 mt-2 max-w-xs font-medium">Please sign in to view and manage your profile.</p>
        <Link href="/login" className="mt-8 btn-primary">Sign In Now</Link>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Personal Information', icon: User },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'payments', label: 'Payments & Refunds', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body selection:bg-brand-orange selection:text-white">
      <Navbar />

      <main className="max-w-[1240px] mx-auto px-4 pt-32 pb-24">
        <div className="bg-white rounded-[3rem] shadow-premium overflow-hidden border border-gray-100 flex flex-col md:flex-row">
          
          {/* Sidebar */}
          <div className="w-full md:w-80 bg-[#FAFAF8] p-10 md:border-r border-gray-100">
             <div className="text-center mb-12">
                <div className="relative inline-block group mb-4">
                   <div className="w-24 h-24 bg-brand-dark rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-lg group-hover:opacity-80 transition-all cursor-pointer">
                      {form.name[0]?.toUpperCase() || profile?.email[0]?.toUpperCase()}
                   </div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Camera size={14} />
                   </div>
                </div>
                <h2 className="text-xl font-black text-brand-dark tracking-tight truncate">{form.name || 'B&D Guest'}</h2>
                <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mt-1">Select Member</p>
             </div>

             <nav className="space-y-4">
                {tabs.map(tab => (
                   <div
                     key={tab.id}
                     role="button"
                     tabIndex={0}
                     onClick={() => setActiveTab(tab.id)}
                     onKeyDown={(e) => e.key === 'Enter' && setActiveTab(tab.id)}
                     className={`w-full flex items-center justify-between p-4 px-6 rounded-2xl transition-all cursor-pointer ${
                       activeTab === tab.id 
                       ? 'bg-white text-brand-orange shadow-card' 
                       : 'text-gray-500 hover:bg-gray-100'
                     }`}
                   >
                      <div className="flex items-center gap-4">
                         <tab.icon size={18} className={activeTab === tab.id ? 'text-brand-orange' : 'text-gray-400'} />
                         <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                      </div>
                      <ChevronRight size={14} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
                   </div>
                ))}
                
                <div className="pt-8 mt-8 border-t border-gray-100 px-2">
                   <button 
                     onClick={handleLogout}
                     className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                   >
                      <LogOut size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
                   </button>
                </div>
             </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 lg:p-16">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
             >
                {activeTab === 'profile' && (
                  <div className="max-w-xl">
                    <h1 className="text-4xl font-black text-brand-dark tracking-tighter mb-2">Personal Information</h1>
                    <p className="text-gray-400 font-medium mb-12 italic italic-font">Manage your details so bakes reach you faster</p>
                    
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Email Address</label>
                             <div className="relative group">
                                <Mail size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input 
                                  readOnly 
                                  value={profile?.email || ''} 
                                  className="w-full pl-8 py-3 bg-transparent border-b border-gray-100 text-sm font-bold text-gray-400 cursor-not-allowed outline-none" 
                                />
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Phone Number</label>
                             <div className="relative group">
                                <Phone size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-orange transition-colors" />
                                <input 
                                  value={form.phone}
                                  onChange={e => setForm({...form, phone: e.target.value})}
                                  placeholder="Enter mobile number" 
                                  className="w-full pl-8 py-3 bg-transparent border-b border-gray-100 focus:border-brand-orange text-sm font-bold text-brand-dark outline-none transition-all placeholder:text-gray-200" 
                                />
                             </div>
                          </div>
                       </div>

                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Full Name</label>
                          <div className="relative group">
                             <User size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-orange transition-colors" />
                             <input 
                               value={form.name}
                               onChange={e => setForm({...form, name: e.target.value})}
                               placeholder="Enter your name" 
                               className="w-full pl-8 py-3 bg-transparent border-b border-gray-100 focus:border-brand-orange text-sm font-bold text-brand-dark outline-none transition-all placeholder:text-gray-200" 
                             />
                          </div>
                       </div>

                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Default Address</label>
                          <div className="relative group">
                             <MapPin size={16} className="absolute left-0 top-4 text-gray-300 group-focus-within:text-brand-orange transition-colors" />
                             <textarea 
                               value={form.address}
                               onChange={e => setForm({...form, address: e.target.value})}
                               placeholder="Set your common delivery address" 
                               rows={3}
                               className="w-full pl-8 py-3 bg-transparent border-b border-gray-100 focus:border-brand-orange text-sm font-bold text-brand-dark outline-none transition-all resize-none placeholder:text-gray-200" 
                             />
                          </div>
                       </div>

                       <div className="pt-10">
                          <button 
                            onClick={handleUpdate}
                            disabled={saving}
                            className="btn-primary"
                          >
                             {saving ? <Loader2 size={18} className="animate-spin" /> : 'Apply Changes'}
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div className="space-y-10">
                    <div className="flex items-center justify-between">
                       <div>
                          <h1 className="text-4xl font-black text-brand-dark tracking-tighter mb-2">Saved Addresses</h1>
                          <p className="text-gray-400 font-medium italic italic-font">Quickly select your delivery target</p>
                       </div>
                       <button 
                         onClick={() => setShowAddressModal(true)}
                         className="flex items-center gap-2 bg-brand-dark text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all shadow-xl"
                       >
                          <Plus size={16} /> New Destination
                       </button>
                    </div>

                    {profile?.savedAddresses && profile.savedAddresses.length > 0 ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {profile.savedAddresses.map(addr => (
                             <motion.div 
                               key={addr.id}
                               layout
                               className="group p-8 bg-[#FAFAF8] rounded-[2rem] border border-gray-100 hover:border-brand-orange hover:bg-white transition-all shadow-sm hover:shadow-card relative overflow-hidden"
                             >
                                <div className="absolute top-0 right-0 p-6">
                                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-300 group-hover:text-brand-orange transition-colors">
                                      <MapPin size={16} />
                                   </div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">{addr.label}</span>
                                <p className="text-sm font-black text-brand-dark tracking-tight leading-relaxed mb-6 pr-10">{addr.address}</p>
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2 text-[9px] font-bold text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-lg">
                                      <Navigation size={10} /> {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                                   </div>
                                   <button 
                                     onClick={() => handleDeleteAddress(addr.id)}
                                     className="text-gray-300 hover:text-red-500 transition-colors"
                                   >
                                      <Trash2 size={16} />
                                   </button>
                                </div>
                             </motion.div>
                          ))}
                       </div>
                    ) : (
                       <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                             <MapPin size={32} className="text-gray-200" />
                          </div>
                          <h3 className="text-xl font-black text-brand-dark tracking-tight">Zero Coordinates Locked</h3>
                          <p className="text-sm text-gray-400 max-w-xs mx-auto mt-2 italic italic-font">Save your Home or Office address for lightning fast checkouts.</p>
                       </div>
                    )}
                  </div>
                )}

                {(activeTab === 'payments') && (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                     <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                        <CreditCard size={28} className="text-gray-300" />
                     </div>
                     <h3 className="text-xl font-black text-brand-dark tracking-tight">Payment Intelligence</h3>
                     <p className="text-sm text-gray-400 max-w-xs mt-2 italic italic-font">Your secure transaction history will manifest here. Stay tuned!</p>
                  </div>
                )}
             </motion.div>
          </div>
        </div>
      </main>

      {/* New Address Modal */}
      <AnimatePresence>
         {showAddressModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddressModal(false)} className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md" />
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                  animate={{ scale: 1, opacity: 1, y: 0 }} 
                  exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                  className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
               >
                  <div className="p-8 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                     <div>
                        <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-1 block">New Coordinate</span>
                        <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Add Destination</h3>
                     </div>
                     <button onClick={() => setShowAddressModal(false)} className="w-12 h-12 bg-[#FAFAF8] rounded-2xl flex items-center justify-center text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition-all shadow-sm"><X size={24} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-1 space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Address Label</label>
                           <select 
                              className="input-field"
                              value={newAddress.label}
                              onChange={e => setNewAddress({...newAddress, label: e.target.value as any})}
                           >
                              <option value="Home">🏡 Home</option>
                              <option value="Work">🏢 Office</option>
                              <option value="Friends">🤝 Friends & Family</option>
                              <option value="Other">📍 Other</option>
                           </select>
                        </div>
                        <div className="col-span-2 space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Full Address Details</label>
                           <textarea 
                              className="input-field min-h-[100px] py-4"
                              placeholder="House No, Apartment, Landmark..."
                              value={newAddress.address}
                              onChange={e => setNewAddress({...newAddress, address: e.target.value})}
                           />
                        </div>
                        <div className="col-span-2 space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pin Core Location</label>
                           <div className="h-[280px] rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner">
                              <MapPicker onLocationSelect={(lat, lng) => setCoords({ lat, lng })} initialCoords={coords} />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-10 border-t border-gray-100 bg-[#FAFAF8] flex-shrink-0">
                     <button 
                       onClick={handleAddAddress}
                       disabled={saving}
                       className="btn-primary w-full py-5 text-sm uppercase tracking-[0.2em] font-black flex items-center justify-center gap-4 group"
                     >
                        {saving ? <Loader2 className="animate-spin" /> : <>Lock Destination <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>}
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}

function Link({ href, children, ...props }: any) {
  return <a href={href} {...props}>{children}</a>
}

function ArrowRight({ size, className }: any) {
   return <Navigation size={size} className={className} />
}
