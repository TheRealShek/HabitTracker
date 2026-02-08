import React, { useState, useMemo } from 'react'
import { useTimeLogs } from '../hooks/useTimeLogs'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subMonths } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = {
  'Office Work': '#facc15',
  'Personal': '#ec4899',
  'Workout': '#a855f7',
  'Meditation': '#22c55e',
  'Break': '#fb923c',
  'Lunch': '#06b6d4',
  'College time': '#3b82f6',
  'Other': '#94a3b8'
}

const Statistics = ({ onBack }) => {
  const [timeRange, setTimeRange] = useState('week') // week, month, all
  const [selectedActivity, setSelectedActivity] = useState('all')
  
  const { data: allLogs = [] } = useTimeLogs(false) // Get all-time data
  
  // Filter logs based on time range
  const filteredLogs = useMemo(() => {
    if (timeRange === 'all') return allLogs
    
    const now = new Date()
    let startDate, endDate
    
    if (timeRange === 'week') {
      startDate = startOfWeek(now, { weekStartsOn: 1 })
      endDate = endOfWeek(now, { weekStartsOn: 1 })
    } else if (timeRange === 'month') {
      startDate = startOfMonth(now)
      endDate = endOfMonth(now)
    }
    
    return allLogs.filter(log => {
      const logDate = new Date(log.timestamp)
      return logDate >= startDate && logDate <= endDate
    })
  }, [allLogs, timeRange])
  
  // Activity distribution data
  const activityDistribution = useMemo(() => {
    const activityMap = {}
    
    filteredLogs.forEach(log => {
      if (!log.is_skipped && log.activity) {
        if (!activityMap[log.activity]) {
          activityMap[log.activity] = 0
        }
        activityMap[log.activity] += 0.5 // 30 minutes = 0.5 hours
      }
    })
    
    return Object.entries(activityMap)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
  }, [filteredLogs])
  
  // Time series data (day by day for week/month, month by month for all time)
  const timeSeriesData = useMemo(() => {
    if (filteredLogs.length === 0) return []
    
    const now = new Date()
    let intervals = []
    
    if (timeRange === 'week') {
      const start = startOfWeek(now, { weekStartsOn: 1 })
      const end = endOfWeek(now, { weekStartsOn: 1 })
      intervals = eachDayOfInterval({ start, end })
    } else if (timeRange === 'month') {
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      intervals = eachDayOfInterval({ start, end })
    } else {
      // For all time, show monthly data for last 6 months
      const start = subMonths(now, 5)
      intervals = eachMonthOfInterval({ start, end: now })
    }
    
    return intervals.map(date => {
      const dataPoint = { date: format(date, timeRange === 'all' ? 'MMM yyyy' : 'MMM dd') }
      
      filteredLogs.forEach(log => {
        const logDate = new Date(log.timestamp)
        let matches = false
        
        if (timeRange === 'all') {
          matches = logDate.getMonth() === date.getMonth() && logDate.getFullYear() === date.getFullYear()
        } else {
          matches = format(logDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        }
        
        if (matches && !log.is_skipped && log.activity) {
          if (selectedActivity === 'all' || log.activity === selectedActivity) {
            if (!dataPoint[log.activity]) {
              dataPoint[log.activity] = 0
            }
            dataPoint[log.activity] += 0.5
          }
        }
      })
      
      return dataPoint
    })
  }, [filteredLogs, timeRange, selectedActivity])
  
  // Get unique activities from logs
  const activities = useMemo(() => {
    const activitySet = new Set()
    allLogs.forEach(log => {
      if (log.activity && !log.is_skipped) {
        activitySet.add(log.activity)
      }
    })
    return Array.from(activitySet).sort()
  }, [allLogs])
  
  // Get all available activities (from logs + presets)
  const allAvailableActivities = useMemo(() => {
    const savedActivities = JSON.parse(localStorage.getItem('customActivities') || '[]')
    const allActivitySet = new Set([...savedActivities])
    
    // Add any activities from logs that might not be in presets
    allLogs.forEach(log => {
      if (log.activity && !log.is_skipped) {
        allActivitySet.add(log.activity)
      }
    })
    
    return Array.from(allActivitySet).sort()
  }, [allLogs])
  
  // Calculate total hours
  const totalHours = useMemo(() => {
    return filteredLogs.filter(log => !log.is_skipped).length * 0.5
  }, [filteredLogs])
  
  const skippedCount = useMemo(() => {
    return filteredLogs.filter(log => log.is_skipped).length
  }, [filteredLogs])

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Match Dashboard style */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 sm:justify-between bg-surface rounded-2xl sm:rounded-full px-3 sm:px-4 py-3 sm:py-2 border border-border shadow-sm">
            {/* Left - Back button and title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-accent/10 text-text-secondary hover:text-accent rounded-lg transition-colors flex-shrink-0"
                title="Back to Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm sm:text-base font-semibold text-text-primary">Statistics</span>
            </div>
            
            {/* Right - Time Range Selector */}
            <div className="flex gap-1 bg-background rounded-lg p-1 border border-border">
              {['week', 'month', 'all'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                    timeRange === range
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All Time'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-surface rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Total Hours</p>
                <p className="text-xl font-bold text-text-primary">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Logged Activities</p>
                <p className="text-xl font-bold text-text-primary">{filteredLogs.filter(l => !l.is_skipped).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Skipped</p>
                <p className="text-xl font-bold text-text-primary">{skippedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Filter */}
        <div className="mb-4">
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Activities</option>
            {allAvailableActivities.map(activity => (
              <option key={activity} value={activity}>{activity}</option>
            ))}
          </select>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Time Series Chart */}
          <div className="bg-surface rounded-lg border border-border p-4 overflow-hidden">
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-3">
              Activity Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
              <BarChart data={timeSeriesData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  {activities.map((activity, idx) => (
                    <linearGradient key={activity} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[activity] || COLORS['Other']} stopOpacity={0.9}/>
                      <stop offset="100%" stopColor={COLORS[activity] || COLORS['Other']} stopOpacity={0.6}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#35383F" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#B5B8BD" 
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#B5B8BD' }}
                  axisLine={{ stroke: '#35383F' }}
                />
                <YAxis 
                  stroke="#B5B8BD" 
                  label={{ 
                    value: 'Hours', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#B5B8BD', 
                    style: { fontSize: '11px' } 
                  }}
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#B5B8BD' }}
                  axisLine={{ stroke: '#35383F' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2B2D31', 
                    border: '1px solid #5865F2', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  }}
                  labelStyle={{ color: '#E3E5E8', fontWeight: 'bold', marginBottom: '4px' }}
                  cursor={{ fill: 'rgba(88, 101, 242, 0.1)' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  iconType="circle"
                  iconSize={8}
                />
                {selectedActivity === 'all' ? (
                  activities.map((activity, idx) => (
                    <Bar 
                      key={activity} 
                      dataKey={activity} 
                      stackId="a" 
                      fill={`url(#gradient-${idx})`}
                      radius={[4, 4, 0, 0]}
                    />
                  ))
                ) : (
                  <Bar 
                    dataKey={selectedActivity} 
                    fill={COLORS[selectedActivity] || COLORS['Other']}
                    radius={[8, 8, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution Pie Chart */}
          <div className="bg-surface rounded-lg border border-border p-4 overflow-hidden">
            <h2 className="text-lg font-bold text-text-primary mb-3">
              Activity Distribution
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    {activityDistribution.map((entry, idx) => (
                      <radialGradient key={entry.name} id={`pie-gradient-${idx}`}>
                        <stop offset="0%" stopColor={COLORS[entry.name] || COLORS['Other']} stopOpacity={1}/>
                        <stop offset="100%" stopColor={COLORS[entry.name] || COLORS['Other']} stopOpacity={0.7}/>
                      </radialGradient>
                    ))}
                  </defs>
                  <Pie
                    data={activityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={{
                      stroke: '#B5B8BD',
                      strokeWidth: 1
                    }}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="hours"
                    style={{ fontSize: '10px', fontWeight: '500' }}
                    paddingAngle={2}
                  >
                    {activityDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#pie-gradient-${index})`}
                        stroke="#2B2D31"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2B2D31', 
                      border: '1px solid #5865F2', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    }}
                    formatter={(value) => [`${value.toFixed(1)}h`, 'Time']}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Activity List */}
              <div className="flex-1 w-full">
                <div className="space-y-2">
                  {activityDistribution.map((activity) => (
                    <div 
                      key={activity.name} 
                      className="flex items-center justify-between p-2.5 bg-background rounded-lg hover:bg-accent/5 hover:border-accent/30 transition-all border border-transparent cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-3 h-3 rounded-sm group-hover:scale-110 transition-transform shadow-sm" 
                          style={{ backgroundColor: COLORS[activity.name] || COLORS['Other'] }}
                        />
                        <span className="text-sm text-text-primary font-medium group-hover:text-accent transition-colors">{activity.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-text-primary font-mono font-bold">
                          {activity.hours.toFixed(1)}h
                        </span>
                        <span className="text-xs text-text-secondary">
                          {((activity.hours / totalHours) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Statistics
