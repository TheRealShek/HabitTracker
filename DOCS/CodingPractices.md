# Coding Practices

Quick reference for maintaining code quality in HabitTracker.

## Tech Stack
- React 18 + Vite + Bun
- Supabase (Auth + PostgreSQL + RLS)
- React Query v5 (caching, mutations, invalidation)
- Tailwind CSS (dark theme, custom xs:475px breakpoint)
- date-fns v3, recharts v3

## Core Rules

### 1. State Management
- **Server state**: Use React Query hooks (`useTimeLogs`, `useUpdateTimeLog`, `useBulkInsertTimeLogs`)
- **UI state**: Use `useState` (modals, forms, editing, weekOffset)
- **LocalStorage**: Custom activities, autoFillCheckpoint, lastNotifiedSlot
- **Never**: Mix useState with Supabase data

### 2. React Hooks
**CRITICAL**: Always call hooks unconditionally at the top
```javascript
// ✅ Correct
const { data } = useQuery(...)
if (condition) return <Component />

// ❌ Wrong
if (condition) {
  const { data } = useQuery(...)
}
```

### 3. Performance
- Use `useMemo` for expensive calculations (array processing, timezone conversions, processedLogs)
- Memoize static arrays (timeSlots, daysOfWeek)
- Cache with React Query (2min stale, 10min cache)
- Query key factory for organized invalidation

### 4. Timezone
**All timestamps in IST (UTC+5:30)**
```javascript
const istHour = parseInt(date.toLocaleString('en-US', { 
  hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' 
}))
// Create dates: new Date(year, month-1, day, hour, min, 0, 0)
```

### 5. Styling
- Mobile-first: `className="px-3 sm:px-4 lg:px-6"`
- Use theme colors: `bg-surface`, `text-primary`, `accent`, `border`
- Responsive breakpoints: xs(475px), sm(640px), md(768px), lg(1024px), xl(1280px)
- Dark mode: #2B2D31 background, #5865F2 accent

### 6. Component Structure
```javascript
// 1. Imports (React → External → Internal)
// 2. Component function
// 3. React Query hooks
// 4. useState hooks
// 5. useMemo/useCallback
// 6. useEffect
// 7. Helper functions
// 8. Return JSX
```

### 7. Real-time Updates
```javascript
useEffect(() => {
  const channel = supabase.channel('table_changes')
    .on('postgres_changes', {...}, () => {
      queryClient.invalidateQueries({ queryKey: ['key'] })
    }).subscribe()
  return () => channel.unsubscribe()
}, [])
```

### 8. Notifications
- Browser Notification API (30min intervals at :00 and :30)
- Web Audio API (3 beeps with 0.6s delay)
- Window title blinking (10 times, stops on focus)
- localStorage prevents duplicate notifications per slot
- Sleep hours: 1 AM - 9 AM IST (no notifications)

### 9. Data Management
- **Time slots**: 12:00 AM, 12:30 AM, 9:00 AM - 11:30 PM (32 slots/day)
- **Auto-fill**: Checkpoint-based backfilling of skipped slots
- **Week navigation**: weekOffset for viewing past weeks (All Time mode)
- **Bulk operations**: useBulkInsertTimeLogs for multiple inserts

## Quick Patterns

**Modal**: `const [show, setShow] = useState(false)`  
**Loading**: `if (isLoading) return <div>Loading...</div>`  
**Form**: `const handleSubmit = (e) => { e.preventDefault(); ... }`  
**LocalStorage**: `JSON.parse(localStorage.getItem('key') || '[]')`  
**Week offset**: `addWeeks(startOfWeek(date, {weekStartsOn: 1}), offset)`

## Common Mistakes to Avoid
- ❌ Calling hooks conditionally
- ❌ Using local timezone instead of IST
- ❌ Forgetting to cleanup intervals/subscriptions
- ❌ Inline functions in JSX (performance hit)
- ❌ Missing loading/error states
- ❌ Using `new Date(dateString)` instead of Date constructor with components
- ❌ Not resuming AudioContext before playing sound

## File Naming
- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Utils: `camelCase.js`

---
**Version**: 1.1.0
