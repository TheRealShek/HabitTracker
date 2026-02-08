import React from 'react'

const SettingsModal = ({ onClose, onTestNotification }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3 sm:px-4">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-md border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-background rounded-lg transition-colors text-text-secondary hover:text-text-primary"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Notifications Section */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications
            </h3>
            
            <div className="space-y-3">
              {/* Test Notification Button */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary mb-1">Test Notification</p>
                    <p className="text-xs text-text-secondary">Trigger a test notification to verify sound and window blinking work correctly</p>
                  </div>
                </div>
                <button
                  onClick={onTestNotification}
                  className="mt-3 w-full px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Test Now
                </button>
              </div>

              {/* Notification Permission Info */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-text-primary mb-1">Browser Notifications</p>
                    <p className="text-xs text-text-secondary">
                      {Notification.permission === 'granted' ? (
                        <span className="text-green-400">Enabled - Browser notifications are allowed</span>
                      ) : Notification.permission === 'denied' ? (
                        <span className="text-red-400">Blocked - Please enable in browser settings</span>
                      ) : (
                        <span className="text-yellow-400">Not set - Click "Test Now" to enable</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App Info Section */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>HabitTracker v1.0.0</span>
              <span>IST (UTC+5:30)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
