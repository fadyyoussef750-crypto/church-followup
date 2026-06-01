import { initializeApp, getApps } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig)
  }
  return getApps()[0]
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return null

  try {
    const app = getFirebaseApp()
    const { getMessaging, getToken } = await import('firebase/messaging')
    const messaging = getMessaging(app)

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })
    return token
  } catch (err) {
    console.error('Notification setup error:', err)
    return null
  }
}

export async function onForegroundMessage(callback) {
  if (typeof window === 'undefined') return
  try {
    const app = getFirebaseApp()
    const { getMessaging, onMessage } = await import('firebase/messaging')
    const messaging = getMessaging(app)
    onMessage(messaging, callback)
  } catch (err) {
    console.error('onMessage error:', err)
  }
}
