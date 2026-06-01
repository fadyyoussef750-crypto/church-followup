'use client'
import { useEffect } from 'react'
import { createClient } from './supabase'
import { requestNotificationPermission } from './firebase'

export function useNotifications(userId) {
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    async function setup() {
      try {
        const token = await requestNotificationPermission()
        if (!token) return

        await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', userId)
      } catch (err) {
        console.error('Notification setup error:', err)
      }
    }

    setup()
  }, [userId])
}
