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

      const now = Date.now()
      const lastNotification = localStorage.getItem('lastNotificationTime')
      const thirtyMinutes = 30 * 60 * 1000

      if (!lastNotification || now - parseInt(lastNotification) >= thirtyMinutes) {
        setNotificationTime(new Date())
        setShowNotificationModal(true)
        localStorage.setItem('lastNotificationTime', now.toString())

        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Time to log your activity!', {
            body: 'What did you do in the last 30 minutes?',
            icon: '/vite.svg'
          })
        }
      }
    }

    // Check immediately on load
    checkAndTriggerNotification()

    // Check every minute if we need to trigger
    const interval = setInterval(checkAndTriggerNotification, 60000)

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
