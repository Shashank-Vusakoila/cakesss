'use client'
import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { onAuthChange } from '@/lib/firebase/auth'
import { db } from '@/lib/firebase/config'
import { doc, onSnapshot } from 'firebase/firestore'
import { syncUserProfile } from '@/lib/firebase/firestore'
import { UserProfile } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let profileUnsub: (() => void) | null = null

    const authUnsub = onAuthChange(u => {
      setUser(u)
      
      if (u) {
        // Fetch profile from Firestore
        profileUnsub = onSnapshot(doc(db, 'users', u.uid), (snap) => {
          if (snap.exists()) {
            setProfile({ id: snap.id, ...snap.data() } as UserProfile)
            setLoading(false)
          } else {
            // Profile doesn't exist - attempt to recovery sync
            console.warn("User authenticated but no Firestore profile found. Attempting sync...")
            syncUserProfile(u.uid, {
              email: u.email || '',
              name: u.displayName || 'User',
              role: 'customer'
            }).catch(err => {
              console.error("Auto-sync profile failed:", err)
              setLoading(false)
            })
          }
        })
      } else {
        setProfile(null)
        if (profileUnsub) profileUnsub()
        setLoading(false)
      }
    })

    return () => {
      authUnsub()
      if (profileUnsub) profileUnsub()
    }
  }, [])

  return { 
    user, 
    profile,
    loading, 
    isAdmin: profile?.role === 'admin',
    role: profile?.role || 'customer'
  }
}
