'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Search, ArrowLeft, Cake } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-24">
        <div className="max-w-2xl w-full text-center">
           <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="relative inline-block mb-12"
           >
              <div className="text-[12rem] md:text-[18rem] font-black text-gray-100 leading-none select-none tracking-tighter">
                404
              </div>
              <motion.div 
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 flex items-center justify-center pt-8"
              >
                 <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-brand-primary/10 border border-brand-primary/10">
                    <Cake size={96} className="text-brand-primary" strokeWidth={1.5} />
                 </div>
              </motion.div>
           </motion.div>

           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
           >
              <h1 className="font-display text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-6">
                Whoops! This bake isn't in our oven.
              </h1>
              <p className="text-lg text-gray-400 font-medium mb-12 max-w-md mx-auto italic italic-font">
                The page you're looking for might have been eaten by our hungry chefs or moved to a different shelf.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Link 
                   href="/"
                   className="w-full sm:w-auto px-10 py-5 bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                    <Home size={18} /> Back to Flavors
                 </Link>
                 <Link 
                   href="/menu"
                   className="w-full sm:w-auto px-10 py-5 bg-white text-gray-900 font-black text-xs uppercase tracking-widest rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                 >
                    <Search size={18} /> Browse Menu
                 </Link>
              </div>
           </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
