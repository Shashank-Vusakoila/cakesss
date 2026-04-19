import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateOrderNumber(): string {
  const prefix = 'BD'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    preparing: 'bg-blue-100 text-blue-700 border-blue-200',
    ready: 'bg-green-100 text-green-700 border-green-200',
    out_for_delivery: 'bg-purple-100 text-purple-700 border-purple-200',
    arrived: 'bg-teal-100 text-teal-700 border-teal-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    paid: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    pending: "Order Received - We're checking the kitchen",
    confirmed: "Order Confirmed - Starting soon",
    preparing: "Chef is Baking - Magic in progress 🍰",
    ready: "Order Ready - Waiting for delivery partner",
    out_for_delivery: "On the way - Arriving shortly! 🛵",
    arrived: "Driver Arrived - Reach out to collect! 📍",
    delivered: "Delivered - Enjoy your treat!",
    completed: "Order Completed",
    cancelled: "Order Cancelled",
  }
  return descriptions[status] || "Updating status..."
}
export function getValidImageUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  // Check if it's a valid relative or absolute URL
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('https')) {
    return url;
  }
  return fallback;
}

export function capitalizeWords(str: string): string {
  if (!str) return ''
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function sanitizeBakeryData(str: string): string {
  if (!str) return ''
  const mappings: Record<string, string> = {
    'bevareges': 'Beverages',
    'cold coffe': 'Cold Coffee',
    'cakes': 'Cakes',
    'pastries': 'Pastries',
    'breads': 'Breads',
  }
  const clean = str.trim().toLowerCase()
  return mappings[clean] || capitalizeWords(str)
}
