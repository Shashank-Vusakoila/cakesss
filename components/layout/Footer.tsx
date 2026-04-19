'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Cake, Phone, Clock, Instagram, Facebook, Heart, Shield, Truck, Sparkles, MapPin, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Footer() {
  const [clickCount, setClickCount] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const router = useRouter()

  const REQUIRED_CLICKS = 5

  const handleSecretClick = useCallback(() => {
    setClickCount(prev => {
      const next = prev + 1
      if (next === 2) {
        setShowHint(true)
        setTimeout(() => setShowHint(false), 1500)
      }
      if (next >= REQUIRED_CLICKS) {
        setUnlocked(true)
        setTimeout(() => {
          router.push('/login')
        }, 800)
        return 0
      }
      setTimeout(() => setClickCount(0), 3000)
      return next
    })
  }, [router])

  return (
    <footer className="bg-brand-dark text-white font-body py-24 relative overflow-hidden">
      {/* Decorative Gradient Overlay */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-orange/30 to-transparent" />
      
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12">
          
          {/* Column 1: Brand Essence */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-orange transform rotate-3">
                  <Cake size={20} className="text-white" />
               </div>
               <span className="font-black text-2xl tracking-tighter">Bakes & Delights</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
               © 2024 B&D Kitchens. <br />
               Every bite, a handcrafted story.
            </p>
            <div className="flex gap-4">
               {[
                 { icon: Instagram, href: "https://instagram.com" },
                 { icon: Facebook, href: "https://facebook.com" },
                 { icon: ExternalLink, href: "#" }
               ].map((social, i) => (
                 <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-orange transition-all duration-300">
                    <social.icon size={18} />
                 </a>
               ))}
            </div>
          </div>

          {/* Column 2: Exploration */}
          <div>
             <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-orange mb-8">Laboratory</h4>
             <ul className="space-y-4">
                {['Our Story', 'Gourmet Careers', 'The Baking Team', 'B&D Exclusive', 'Insta-Bake Feed'].map((item) => (
                  <li key={item}>
                    <Link href="/menu" className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange scale-0 group-hover:scale-100 transition-transform" />
                      {item}
                    </Link>
                  </li>
                ))}
             </ul>
          </div>

          {/* Column 3: High Support & Legal */}
          <div>
             <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-orange mb-8">Concierge</h4>
             <ul className="space-y-4 mb-10">
                <li><Link href="/orders" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Help & Global Support</Link></li>
                <li><Link href="/admin/menu" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">B&D Partnerships</Link></li>
                <li><div className="flex items-center gap-3 text-sm font-black text-white bg-white/5 py-3 px-4 rounded-xl border border-white/5"><Phone size={14} className="text-brand-orange" /> +91 97010 03268</div></li>
             </ul>
             <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Regulatory</p>
                <div className="flex flex-wrap gap-4 text-[11px] font-bold text-gray-400">
                   <Link href="/menu" className="hover:text-white underline decoration-brand-orange/30">Terms</Link>
                   <Link href="/menu" className="hover:text-white underline decoration-brand-orange/30">Privacy</Link>
                   <Link href="/menu" className="hover:text-white underline decoration-brand-orange/30">Merchant Terms</Link>
                </div>
             </div>
          </div>

          {/* Column 4: Service Area Focus */}
          <div className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-orange">Service Area</h4>
             <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-orange/10 rounded-full blur-2xl group-hover:bg-brand-orange/20 transition-all duration-700" />
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-brand-dark rounded-xl border border-white/10 flex items-center justify-center text-brand-orange shadow-2xl">
                         <MapPin size={20} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Central Hub</p>
                         <h5 className="text-sm font-black text-white tracking-tight">Anurag University</h5>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
                         <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">5KM Delivery Radius</p>
                      </div>
                      <p className="text-[11px] leading-relaxed text-gray-400 font-medium">
                         We currently serve exclusively within a 5km radius of Anurag University to ensure maximum freshness and rapid delivery of your bakes.
                      </p>
                   </div>
                </div>
             </div>
             <div className="flex items-center gap-4 pt-2">
                <div className="px-5 py-2.5 bg-brand-orange rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-orange">
                   Fastest Delivery
                </div>
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-gray-500" /> Nearby Hubs Coming Soon
                </div>
             </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-24 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex flex-col items-center md:items-start gap-2">
              <span 
                onClick={handleSecretClick} 
                className="cursor-default select-none relative group text-[11px] font-bold text-gray-600 hover:text-gray-400 transition-colors"
              >
                 © 2024 Bakes & Delights. All rights reserved.
                 {clickCount > 0 && <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-brand-orange text-white rounded text-[8px] animate-bounce">{clickCount} OF {REQUIRED_CLICKS}</span>}
              </span>
              <p className="text-[9px] font-bold text-gray-700 tracking-[0.2em]">B&D KITCHENS • GHATKESAR, HYDERABAD</p>
           </div>
           
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                 System Status: <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse shadow-[0_0_8px_green]" /> <span className="text-brand-success">Optimal</span>
              </div>
              <span className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                 Made with <Heart size={10} className="text-brand-orange fill-brand-orange" /> by B&D Creative Lab
              </span>
           </div>
        </div>
      </div>

      {/* Secret Interaction Overlays */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 glass border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full z-50 pointer-events-none shadow-2xl"
          >
            Accessing Restricted Nodes...
          </motion.div>
        )}
        {unlocked && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-brand-dark/98 backdrop-blur-xl flex items-center justify-center z-[1000] pointer-events-none"
          >
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                 <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-brand-orange rounded-full"
                 />
                 <div className="absolute inset-2 bg-brand-dark rounded-full flex items-center justify-center">
                    <Cake size={48} className="text-brand-orange" />
                 </div>
              </div>
              <h2 className="text-4xl font-black text-white tracking-widest uppercase mb-2">Omnipresence</h2>
              <p className="text-[11px] font-black text-brand-orange uppercase tracking-[0.5em] animate-pulse">Establishing Root Session</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  )
}
