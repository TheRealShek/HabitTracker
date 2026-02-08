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
  const [audioContextRef, setAudioContextRef] = useState(null)

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

  // Function to play notification sound - reusable
  const playNotificationSound = () => {
    try {
      // Create or reuse audio context
      let audioContext = audioContextRef
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        setAudioContextRef(audioContext)
      }
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      // Create oscillator for a pleasant notification sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Configure sound - pleasant notification tone
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // First tone
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1) // Second tone (higher)
      
      // Fade in and out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
      
      console.log('Notification sound played')
    } catch (error) {
      console.error('Could not play notification sound:', error)
    }
  }

  // Function to make window/tab blink to grab attention - reusable
  const blinkWindow = () => {
    const originalTitle = document.title
    let blinkCount = 0
    const maxBlinks = 10 // Blink 10 times
    
    const blinkInterval = setInterval(() => {
      if (blinkCount >= maxBlinks) {
        document.title = originalTitle
        clearInterval(blinkInterval)
        return
      }
      
      // Alternate between notification message and original title
      document.title = blinkCount % 2 === 0 
        ? 'LOG YOUR ACTIVITY!' 
        : originalTitle
      blinkCount++
    }, 1000) // Change every second

    // Also try to flash favicon if possible
    try {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      const originalIcon = link.href
      
      let iconBlinkCount = 0
      const iconBlinkInterval = setInterval(() => {
        if (iconBlinkCount >= maxBlinks) {
          link.href = originalIcon
          clearInterval(iconBlinkInterval)
          return
        }
        // You can add different colored favicons here if you have them
        iconBlinkCount++
      }, 1000)
    } catch (error) {
      console.log('Could not blink favicon:', error)
    }

    // Stop blinking when user focuses on window
    const stopBlinking = () => {
      document.title = originalTitle
      window.removeEventListener('focus', stopBlinking)
    }
    window.addEventListener('focus', stopBlinking)
  }

  // Handler for test notification from settings
  const handleTestNotification = () => {
    console.log('Test notification triggered')
    playNotificationSound()
    blinkWindow()
    
    // Show browser notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'Sound and window blinking are working correctly!',
          icon: '/vite.svg',
          tag: 'test-notification',
          requireInteraction: false
        })
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Test Notification', {
              body: 'Sound and window blinking are working correctly!',
              icon: '/vite.svg',
              tag: 'test-notification',
              requireInteraction: false
            })
          }
        })
      }
    }
  }

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
      const now = new Date()
      // Get IST time
      const istHour = parseInt(now.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }))
      const istMinute = parseInt(now.toLocaleString('en-US', { minute: '2-digit', timeZone: 'Asia/Kolkata' }))
      
      console.log(`Check notification - IST Time: ${istHour}:${istMinute.toString().padStart(2, '0')}, Tab Visible: ${document.visibilityState === 'visible'}`)
      
      // Check if current time is in sleep hours (1 AM - 9 AM IST)
      if (istHour >= 1 && istHour < 9) {
        console.log('Sleep hours - skipping notification')
        return
      }

      // Check if we're at a 30-minute interval (00 or 30 minutes)
      if (istMinute !== 0 && istMinute !== 30) {
        return // Not on a 30-minute mark
      }

      // Create a unique key for this time slot
      const timeSlotKey = `${istHour}:${istMinute.toString().padStart(2, '0')}`
      const lastNotifiedSlot = localStorage.getItem('lastNotifiedSlot')
      
      console.log(`Time slot: ${timeSlotKey}, Last notified: ${lastNotifiedSlot}`)
      
      // Only trigger if we haven't already notified for this slot
      if (lastNotifiedSlot === timeSlotKey) {
        console.log('Already notified for this slot')
        return // Already notified for this slot
      }

      console.log('TRIGGERING NOTIFICATION!')

      // Trigger notification
      setNotificationTime(now)
      setShowNotificationModal(true)
      localStorage.setItem('lastNotifiedSlot', timeSlotKey)
      localStorage.setItem('lastNotificationTime', Date.now().toString())

      // Play notification sound (even if tab not visible)
      playNotificationSound()

      // Blink window title to grab attention (even if tab not visible)
      blinkWindow()

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Time to log your activity!', {
          body: 'What did you do in the last 30 minutes?',
          icon: '/vite.svg',
          tag: 'habit-tracker-notification',
          requireInteraction: false
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
      <Dashboard onLogout={handleLogout} onTestNotification={handleTestNotification} />
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
