import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth'
import { auth } from './config'
import { syncUserProfile } from './firestore'

const googleProvider = new GoogleAuthProvider()

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signUp(email: string, password: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  try {
    await syncUserProfile(cred.user.uid, {
      email: cred.user.email || '',
      name: displayName,
      role: 'customer'
    })
  } catch (e) {
    console.warn("Could not sync profile on signup (rules issue?):", e)
  }
  return cred
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider)
  try {
    await syncUserProfile(cred.user.uid, {
      email: cred.user.email || '',
      name: cred.user.displayName || '',
    })
  } catch (e) {
    console.warn("Could not sync profile on Google login (rules issue?):", e)
  }
  return cred
}

export async function signOut() {
  return firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}


