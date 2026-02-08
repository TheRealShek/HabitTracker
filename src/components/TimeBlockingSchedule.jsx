import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { format, startOfWeek, addDays, addWeeks, isSameDay } from 'date-fns'
import { useUpdateTimeLog, useInsertTimeLog } from '../hooks/useTimeLogs'

const TimeBlockingSchedule = ({ logs, onUpdate, activities: customActivities, weekOffset = 0 }) => {
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  
  // React Query mutations
  const updateMutation = useUpdateTimeLog()
  const insertMutation = useInsertTimeLog()

  // Cache processed logs with IST time data for performance
  const processedLogs = useMemo(() => {
    return logs.map(log => {
      const logDate = new Date(log.timestamp)
      // Parse IST hour and minute once per log
      const istHour = parseInt(logDate.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }))
      const istMinute = parseInt(logDate.toLocaleString('en-US', { minute: '2-digit', timeZone: 'Asia/Kolkata' }))
      return {
        ...log,
        date: logDate,
        istHour,
        istMinute
      }
    })
  }, [logs])

  const activities = customActivities || [
    'Office Work',
    'Personal',
    'Workout',
    'Meditation',
    'Break',
    'Lunch',
    'College time'
  ]

  const handleDoubleClick = (day, slot, activity) => {
    setEditingCell({ day: day.toISOString(), slot: slot.value })
    setEditValue(activity?.activity || '')
  }

  const handleSave = async (day, slot) => {
    const [hours, minutes] = slot.value.split(':').map(Number)
    
    // For 12:00 AM and 12:30 AM slots, use the NEXT day
    const targetDay = slot.isNextDay ? addDays(day, 1) : day
    
    // Find existing activity using cached processed logs
    const activity = processedLogs.find((log) => {
      return (
        isSameDay(log.date, targetDay) &&
        log.istHour === hours &&
        log.istMinute === minutes
      )
    })

    if (activity) {
      // Update existing using React Query mutation
      await updateMutation.mutateAsync({
        id: activity.id,
        activity: editValue || null,
        is_skipped: !editValue
      })
    } else if (editValue) {
      // Insert new using React Query mutation
      const { data: { user } } = await supabase.auth.getUser()
      
      const localDate = new Date(targetDay)
      localDate.setHours(hours, minutes, 0, 0)
      
      await insertMutation.mutateAsync({
        user_id: user.id,
        timestamp: localDate.toISOString(),
        activity: editValue,
        is_skipped: false
      })
    }

    setEditingCell(null)
    setEditValue('')
    if (onUpdate) onUpdate()
  }

  const handleCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }
  // Memoize time slots generation
  const timeSlots = useMemo(() => {
    const slots = []
    
    // 9 AM to 11:30 PM
    for (let hour = 9; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const isPM = hour >= 12
        const displayHour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const ampm = isPM ? 'PM' : 'AM'
        
        const endMinute = minute === 0 ? 30 : 0
        const endHour = minute === 30 ? (hour + 1) : hour
        const endIsPM = endHour >= 12
        const endDisplayHour = endHour > 12 ? endHour - 12 : endHour === 0 || endHour === 24 ? 12 : endHour
        const endAmpm = endIsPM ? 'PM' : 'AM'
        
        slots.push({
          value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          display: `${displayHour12}:${minute.toString().padStart(2, '0')} ${ampm} - ${endDisplayHour}:${endMinute.toString().padStart(2, '0')} ${endAmpm}`,
          isNextDay: false
        })
      }
    }
    
    // End with 12:00 AM and 12:30 AM (from next day)
    slots.push({
      value: '00:00',
      display: '12:00 AM - 12:30 AM',
      isNextDay: true
    })
    slots.push({
      value: '00:30',
      display: '12:30 AM - 1:00 AM',
      isNextDay: true
    })
    
    return slots
  }, [])
  
  // Memoize days of week
  const daysOfWeek = useMemo(() => {
    const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekOffset])

  // Calculate daily totals for each activity (excluding Sleep)
  const calculateDailyTotals = (day) => {
    const activityMap = {}
    
    processedLogs.forEach((log) => {
      // Only count logs that match our displayed time slots (9:00-23:30)
      // Must be same day, not skipped, not Sleep, and in valid hour range
      if (
        isSameDay(log.date, day) && 
        log.activity && 
        !log.is_skipped && 
        log.activity !== 'Sleep'
      ) {
        // Check if this time slot exists in our schedule
        const isValidSlot = (log.istHour === 9 && log.istMinute >= 0) || // 9:00 AM onwards
                           (log.istHour > 9 && log.istHour < 23) ||       // 10:00 AM - 10:30 PM
                           (log.istHour === 23 && log.istMinute <= 30)    // Up to 11:30 PM
        
        if (isValidSlot) {
          if (!activityMap[log.activity]) {
            activityMap[log.activity] = 0
          }
          activityMap[log.activity] += 0.5 // 30 minutes
        }
      }
    })

    return activityMap
  }

  const formatHours = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const getActivityForSlot = (day, slot) => {
    const [hours, minutes] = slot.value.split(':').map(Number)
    
    // For 12:00 AM and 12:30 AM slots, check the NEXT day's data
    const targetDay = slot.isNextDay ? addDays(day, 1) : day
    
    return processedLogs.find((log) => {
      return (
        isSameDay(log.date, targetDay) &&
        log.istHour === hours &&
        log.istMinute === minutes
      )
    })
  }

  const getCellColor = (activity) => {
    if (!activity) return 'bg-background'
    if (activity.is_skipped) return 'bg-red-500/20'
    
    const text = activity.activity?.toLowerCase() || ''
    if (text.includes('office') || text.includes('work')) return 'bg-yellow-500/30'
    if (text.includes('personal')) return 'bg-pink-500/30'
    if (text.includes('workout') || text.includes('exercise')) return 'bg-purple-500/30'
    if (text.includes('meditation')) return 'bg-green-500/30'
    if (text.includes('break')) return 'bg-orange-500/30'
    if (text.includes('lunch') || text.includes('breakfast')) return 'bg-cyan-500/30'
    if (text.includes('college') || text.includes('study')) return 'bg-blue-500/30'
    return 'bg-accent/30'
  }

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      {/* Mobile scroll hint */}
      <div className="sm:hidden bg-accent/10 border-b border-accent/30 px-3 py-2 text-center">
        <p className="text-xs text-accent font-medium">← Swipe to view all days →</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-background">
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-text-secondary uppercase border-r border-border sticky left-0 bg-background z-10 w-[70px] sm:w-[100px]">
                Time
              </th>
              {daysOfWeek.map((day) => (
                <th
                  key={day.toISOString()}
                  className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-text-secondary uppercase border-r border-border w-[90px] sm:w-[120px]"
                >
                  <div className="hidden sm:block">{format(day, 'EEE')}</div>
                  <div className="sm:hidden">{format(day, 'EEEEE')}</div>
                  <div className="text-text-primary font-bold text-[11px] sm:text-xs">{format(day, 'MMM dd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot.value} className="border-b border-border hover:bg-background/30">
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-[10px] sm:text-sm text-text-secondary font-mono border-r border-border sticky left-0 bg-surface z-10">
                  <span className="hidden sm:inline">{slot.display}</span>
                  <span className="sm:hidden text-[9px]">{slot.display.replace(' ', '')}</span>
                </td>
                {daysOfWeek.map((day) => {
                  const activity = getActivityForSlot(day, slot)
                  const isEditing = editingCell?.day === day.toISOString() && editingCell?.slot === slot.value
                  
                  return (
                    <td
                      key={`${day.toISOString()}-${slot.value}`}
                      className={`px-1 sm:px-2 py-2 sm:py-3 text-[10px] sm:text-xs text-center border-r border-border cursor-pointer transition-all hover:ring-2 hover:ring-accent/30 hover:bg-accent/5 ${getCellColor(
                        activity
                      )}`}
                      onDoubleClick={() => handleDoubleClick(day, slot, activity)}
                      title="Double-click to edit"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 p-1.5 sm:p-2 bg-background/95 backdrop-blur-sm rounded border border-accent shadow-xl min-w-[150px] sm:min-w-[200px]">
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-surface text-text-primary border border-accent/50 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm w-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent shadow-sm appearance-none cursor-pointer hover:bg-background transition-colors"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23B5B8BD' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                            autoFocus
                          >
                            <option value="" className="bg-surface text-text-secondary">-- Empty --</option>
                            {activities.length === 0 && (
                              <option value="" disabled className="bg-surface text-text-secondary italic">No activities yet - Add in settings</option>
                            )}
                            {activities.map((act) => (
                              <option key={act} value={act} className="bg-surface text-text-primary py-2">
                                {act}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleSave(day, slot)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors shadow-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors shadow-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {activity ? (
                            activity.is_skipped ? (
                              <span className="text-red-400 text-sm sm:text-base">❌</span>
                            ) : (
                              <span className="text-text-primary font-medium text-[10px] sm:text-xs leading-tight block truncate px-0.5">
                                {activity.activity}
                              </span>
                            )
                          ) : (
                            ''
                          )}
                        </>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Gap between main table and footer sections */}
        <div className="my-2 sm:my-3"></div>
        
        {/* Sleep Row - Separate table */}
        <div className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-indigo-900/20 border border-indigo-500/30 rounded-lg p-0.5">
          <table className="w-full border-collapse min-w-[800px]">
            <tbody>
              <tr>
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-semibold border-r border-indigo-500/30 sticky left-0 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 z-10 w-[70px] sm:w-[100px]">
                  <div className="text-indigo-300">Sleep</div>
                  <div className="text-[9px] sm:text-xs text-indigo-400 font-normal">1-9 AM</div>
                </td>
                {daysOfWeek.map((day) => (
                  <td
                    key={`sleep-${day.toISOString()}`}
                    className="px-1 sm:px-2 py-2 sm:py-3 text-center border-r border-indigo-500/30 bg-indigo-900/10 w-[90px] sm:w-[120px]"
                  >
                    <span className="text-indigo-200 text-[10px] sm:text-xs font-medium">Sleep (8h)</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Gap between sleep and daily total */}
        <div className="my-2 sm:my-3"></div>
        
        {/* Daily Total - Separate table */}
        <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-lg p-0.5">
          <table className="w-full border-collapse min-w-[800px]">
            <tfoot>
              <tr>
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-bold text-accent border-r border-accent/30 sticky left-0 bg-accent/15 z-10 w-[70px] sm:w-[100px]">
                  <span className="hidden sm:inline">Daily Total</span>
                  <span className="sm:hidden text-[10px]">Total</span>
                </td>
              {daysOfWeek.map((day) => {
                const dailyTotals = calculateDailyTotals(day)
                const totalHours = Object.values(dailyTotals).reduce((sum, h) => sum + h, 0)
                
                return (
                  <td
                    key={`total-${day.toISOString()}`}
                    className="px-1 sm:px-2 py-2 sm:py-3 border-r border-accent/30 bg-accent/5 w-[90px] sm:w-[120px]"
                  >
                    <div className="text-center">
                      <div className="text-xs sm:text-sm font-bold text-accent mb-0.5 sm:mb-1">
                        {totalHours > 0 ? formatHours(totalHours) : '-'}
                      </div>
                      {totalHours > 0 && (
                        <div className="text-[9px] sm:text-xs text-text-secondary space-y-0.5 leading-tight">
                          {(() => {
                            const sorted = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])
                            const top4 = sorted.slice(0, 4)
                            const rest = sorted.slice(4)
                            const otherTotal = rest.reduce((sum, [_, hours]) => sum + hours, 0)
                            
                            return (
                              <>
                                {top4.map(([activity, hours]) => (
                                  <div key={activity} className="truncate" title={`${activity}: ${formatHours(hours)}`}>
                                    <span className="hidden sm:inline">{activity}: {formatHours(hours)}</span>
                                    <span className="sm:hidden">{activity.substring(0, 6)}: {formatHours(hours)}</span>
                                  </div>
                                ))}
                                {otherTotal > 0 && (
                                  <div className="truncate" title={`Other: ${formatHours(otherTotal)}`}>
                                    Other: {formatHours(otherTotal)}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </td>
                )
              })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TimeBlockingSchedule
