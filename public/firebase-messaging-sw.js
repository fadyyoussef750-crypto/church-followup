importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js')

// هيتم تعبئة القيم دي من الـ environment variables
// لكن الـ service worker بيشتغل خارج Next.js context
// فمحتاج تحط القيم يدوياً هنا بعد ما تاخد القيم من Firebase Console

const firebaseConfig = {
  apiKey: self.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: self.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: self.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: self.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: self.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: self.NEXT_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
}

try {
  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage(payload => {
    console.log('Background message received:', payload)

    const { title, body } = payload.notification || {}

    if (title) {
      self.registration.showNotification(title, {
        body: body || '',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'church-followup',
        data: payload.data,
      })
    }
  })
} catch (err) {
  console.error('Firebase SW error:', err)
}
