import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, onSnapshot, Timestamp, getDoc, setDoc
} from 'firebase/firestore'
import { db } from './config'
import { MenuItem, Category, Order, Table, UserProfile } from '@/types'

// ─── Menu Items ───────────────────────────────────────────────────────────────

export async function getMenuItems(): Promise<MenuItem[]> {
  const q = query(collection(db, 'menuItems'), orderBy('name'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem))
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'menuItems'), {
    ...item,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id
}

export async function updateMenuItem(id: string, data: Partial<MenuItem>): Promise<void> {
  await updateDoc(doc(db, 'menuItems', id), { ...data, updatedAt: Timestamp.now() })
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'menuItems', id))
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const q = query(collection(db, 'categories'), orderBy('order'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category))
}

export async function addCategory(cat: Omit<Category, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'categories'), cat)
  return ref.id
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  await updateDoc(doc(db, 'categories', id), data)
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id))
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), {
    ...order,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id
}

export async function getOrders(): Promise<Order[]> {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    } as Order
  })
}

export async function getOrderById(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', id))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  } as Order
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await updateDoc(doc(db, 'orders', id), { status, updatedAt: Timestamp.now() })
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
      } as Order
    })
    callback(orders)
  })
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export async function getTables(): Promise<Table[]> {
  const q = query(collection(db, 'tables'), orderBy('number'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Table))
}

export async function seedTables(): Promise<void> {
  const existing = await getTables()
  if (existing.length > 0) return
  for (let i = 1; i <= 30; i++) {
    await addDoc(collection(db, 'tables'), {
      number: i,
      name: `Table ${i}`,
      capacity: 4,
      isActive: true,
    })
  }
}

// ─── Analytics helpers ────────────────────────────────────────────────────────

export async function getDailyAnalytics(days = 7) {
  const orders = await getOrders()
  const map: Record<string, { revenue: number; orders: number }> = {}
  orders.forEach(o => {
    // Include if paid OR if status implies it's a successful transaction
    const isSuccessful = o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'completed'
    if (!isSuccessful) return
    
    const date = new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    if (!map[date]) map[date] = { revenue: 0, orders: 0 }
    map[date].revenue += o.total
    map[date].orders += 1
  })
  return Object.entries(map)
    .slice(-days)
    .map(([date, data]) => ({ date, ...data }))
}

export async function getTopItems(limit = 5) {
  const orders = await getOrders()
  const itemMap: Record<string, { name: string; count: number; revenue: number }> = {}
  orders.forEach(o => {
    o.items?.forEach(item => {
      if (!itemMap[item.menuItemId]) itemMap[item.menuItemId] = { name: item.name, count: 0, revenue: 0 }
      itemMap[item.menuItemId].count += item.quantity
      itemMap[item.menuItemId].revenue += item.price * item.quantity
    })
  })
  return Object.entries(itemMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([id, data]) => ({ id, ...data }))
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  } as UserProfile
}

export async function syncUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  
  if (!snap.exists()) {
    await setDoc(ref, {
      ...data,
      role: data.role || 'customer',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  } else {
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now(),
    })
  }
}

/**
 * Temporary helper to promote a user to admin.
 * Run this in the browser console if needed or call from a helper route.
 */
export async function makeAdmin(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { 
    role: 'admin',
    updatedAt: Timestamp.now()
  })
}
