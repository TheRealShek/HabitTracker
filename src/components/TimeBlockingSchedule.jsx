import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'

const TimeBlockingSchedule = ({ logs }) => {
  // Generate time slots from 9:00 AM to 1:00 AM next day (every 30 minutes)
  const generateTimeSlots = () => {
    const slots = []
    // 9 AM to 11:30 PM
    for (let hour = 9; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const isPM = hour >= 12
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const ampm = isPM ? 'PM' : 'AM'
        slots.push({
          value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          display: `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
        })
      }
    }
    // 12:00 AM and 12:30 AM and 1:00 AM
    for (let minute of [0, 30]) {
      slots.push({
        value: `00:${minute.toString().padStart(2, '0')}`,
        display: `12:${minute.toString().padStart(2, '0')} AM`,
        isNextDay: true
      })
    }
    slots.push({
      value: '01:00',
      display: '1:00 AM',
      isNextDay: true
    })
    return slots
  }

  const timeSlots = generateTimeSlots()
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getActivityForSlot = (day, slot) => {
    const [hours, minutes] = slot.value.split(':').map(Number)
    return logs.find((log) => {
      const logDate = new Date(log.timestamp)
      const checkDay = slot.isNextDay ? addDays(day, 1) : day
      return (
        isSameDay(logDate, checkDay) &&
        logDate.getHours() === hours &&
        logDate.getMinutes() === minutes
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-background">
              <th className="px-3 py-3 text-left text-xs font-medium text-text-secondary uppercase border-r border-border sticky left-0 bg-background z-10 min-w-[100px]">
                Time
              </th>
              {daysOfWeek.map((day) => (
                <th
                  key={day.toISOString()}
                  className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase border-r border-border min-w-[120px]"
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-text-primary font-bold">{format(day, 'MMM dd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot.value} className="border-b border-border hover:bg-background/30">
                <td className="px-3 py-3 text-sm text-text-secondary font-mono border-r border-border sticky left-0 bg-surface z-10">
                  {slot.display}
                </td>
                {daysOfWeek.map((day) => {
                  const activity = getActivityForSlot(day, slot)
                  return (
                    <td
                      key={`${day.toISOString()}-${slot.value}`}
                      className={`px-2 py-3 text-xs text-center border-r border-border ${getCellColor(
                        activity
                      )}`}
                    >
                      {activity ? (
                        activity.is_skipped ? (
                          <span className="text-red-400">❌</span>
                        ) : (
                          <span className="text-text-primary font-medium">
                            {activity.activity}
                          </span>
                        )
                      ) : (
                        ''
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TimeBlockingSchedule
