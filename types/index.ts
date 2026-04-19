export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  category: string
  rating: number
  reviewCount: number
  isAvailable: boolean
  isVeg: boolean
  isBestseller: boolean
  prepTime: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  icon: string
  order: number
  isActive: boolean
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export interface Order {
  id: string
  orderNumber: string
  userId?: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  customerLat?: number
  customerLng?: number
  tableNumber?: number
  items: OrderItem[]
  subtotal: number
  tax: number
  serviceCharge: number
  total: number
  status: OrderStatus
  deliveryStatus?: DeliveryStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  paymentId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  image: string
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'
export type DeliveryStatus = 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface DeliveryLocation {
  lat: number
  lng: number
  updatedAt: number
}

export interface Table {
  id: string
  number: number
  name: string
  capacity: number
  isActive: boolean
  qrCode?: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  role: 'admin' | 'customer'
  savedAddresses?: SavedAddress[]
  createdAt: Date
}

export interface SavedAddress {
  id: string
  label: string // e.g., 'Home', 'Work', 'Other'
  address: string
  lat: number
  lng: number
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'kitchen' | 'customer'
  name: string
  createdAt: Date
}

export interface Analytics {
  id: string
  date: string
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  topItems: { itemId: string; name: string; count: number }[]
}
