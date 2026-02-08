import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import NotificationModal from './components/NotificationModal'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationTime, setNotificationTime] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if (session && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [session])

  // Notification timer logic
  useEffect(() => {
    if (!session) return

    const checkAndTriggerNotification = () => {
      // Only trigger when tab is visible
      if (document.visibilityState !== 'visible') return

      const now = new Date()
      // Get IST time
      const istHour = parseInt(now.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }))
      const istMinute = parseInt(now.toLocaleString('en-US', { minute: '2-digit', timeZone: 'Asia/Kolkata' }))
      
      // Check if current time is in sleep hours (1 AM - 9 AM IST)
      if (istHour >= 1 && istHour < 9) {
        // During sleep hours, don't trigger notifications
        return
      }

      // Check if we're at a 30-minute interval (00 or 30 minutes)
      if (istMinute !== 0 && istMinute !== 30) {
        return // Not on a 30-minute mark
      }

      // Create a unique key for this time slot
      const timeSlotKey = `${istHour}:${istMinute.toString().padStart(2, '0')}`
      const lastNotifiedSlot = localStorage.getItem('lastNotifiedSlot')
      
      // Only trigger if we haven't already notified for this slot
      if (lastNotifiedSlot === timeSlotKey) {
        return // Already notified for this slot
      }

      // Trigger notification
      setNotificationTime(now)
      setShowNotificationModal(true)
      localStorage.setItem('lastNotifiedSlot', timeSlotKey)
      localStorage.setItem('lastNotificationTime', Date.now().toString())

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Time to log your activity!', {
          body: 'What did you do in the last 30 minutes?',
          icon: '/vite.svg'
        })
      }
    }

    // Check immediately on load
    checkAndTriggerNotification()

    // Check every 30 seconds for better alignment
    const interval = setInterval(checkAndTriggerNotification, 30000)

    return () => clearInterval(interval)
  }, [session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('lastNotificationTime')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <>
      <Dashboard onLogout={handleLogout} />
      {showNotificationModal && (
        <NotificationModal
          timestamp={notificationTime}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </>
  )
}

export default App
