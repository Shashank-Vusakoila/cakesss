import Link from 'next/link'
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings, LogOut, Navigation } from 'lucide-react'
import { signOut } from '@/lib/firebase/auth'

export default function AdminSidebar() {
  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/menu', label: 'Menu Items', icon: UtensilsCrossed },
    { href: '/delivery', label: 'Delivery App', icon: Navigation },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex-shrink-0 h-full flex flex-col z-20">
      <div className="p-6">
        <div className="font-display font-bold text-xl text-brand-green-dark">Bakes & Delights</div>
        <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Admin Panel</div>
      </div>
      
      <div className="flex-1 px-4 space-y-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-brand-green/5 hover:text-brand-green transition-colors"
          >
            <link.icon size={18} />
            {link.label}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors w-full text-left">
          ← Back to Site
        </Link>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-colors w-full text-left mt-1"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
