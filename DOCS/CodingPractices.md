# Coding Practices

Quick reference for maintaining code quality in HabitTracker.

## Tech Stack
- React 18 + Vite + Bun
- Supabase (Auth + PostgreSQL)
- React Query v5 (state management)
- Tailwind CSS
- date-fns, recharts

## Core Rules

### 1. State Management
- **Server state**: Use React Query hooks (`useTimeLogs`, `useUpdateTimeLog`)
- **UI state**: Use `useState` (modals, forms, editing mode)
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
- Use `useMemo` for expensive calculations (array processing, timezone conversions)
- Memoize static arrays (timeSlots, daysOfWeek)
- Cache with React Query (5min stale, 10min cache)

### 4. Timezone
**All timestamps in IST (UTC+5:30)**
```javascript
const istHour = parseInt(date.toLocaleString('en-US', { 
  hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' 
}))
```

### 5. Styling
- Mobile-first: `className="px-3 sm:px-4 lg:px-6"`
- Use theme colors: `bg-surface`, `text-primary`, `accent`, `border`
- Responsive breakpoints: xs(475px), sm(640px), md(768px), lg(1024px)

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

## Quick Patterns

**Modal**: `const [show, setShow] = useState(false)`  
**Loading**: `if (isLoading) return <div>Loading...</div>`  
**Form**: `const handleSubmit = (e) => { e.preventDefault(); ... }`  
**LocalStorage**: `JSON.parse(localStorage.getItem('key') || '[]')`

## Common Mistakes to Avoid
- ❌ Calling hooks conditionally
- ❌ Using local timezone instead of IST
- ❌ Forgetting to cleanup intervals/subscriptions
- ❌ Inline functions in JSX (performance hit)
- ❌ Missing loading/error states

## File Naming
- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Utils: `camelCase.js`

---
**Version**: 1.0.0
