# Time Tracking Notification App - Project Specification

## Core Objective
Build a single-user React app that prompts users every 30 minutes to log their activity, displays logged data in a table format, and deploys to Vercel using Bun runtime.

## Tech Stack
- **Frontend**: React (Bun runtime)
- **Database**: Supabase (authentication + data storage)
- **Deployment**: Vercel
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (or styled-components)

## Design System
- **Theme**: Dark mode only (light charcoal background)
- **Color Palette**:
  - Background: `#2B2D31` (light charcoal)
  - Surface/Cards: `#35383F`
  - Text Primary: `#E8E8E8`
  - Text Secondary: `#A8A8A8`
  - Accent: `#5865F2` (or custom brand color)
  - Border: `#3F4248`
- Clean, minimal design with good contrast
- Rounded corners, subtle shadows for depth

## Authentication
- Single hardcoded user account
- Email/password login stored in Supabase Auth
- No signup functionality
- Session persistence across page reloads
- Simple logout button

## Notification System
- Browser notification every 30 minutes (only when tab is open)
- Prompt: "What did you do in the last 30 minutes?"
- Input modal with text field and submit button
- If no response within timeout period, mark entry as "❌" (cross/skipped)
- Store timestamp + activity description in Supabase

## Data Model (Supabase)
**Table: time_logs**
- id (uuid, primary key)
- user_id (foreign key to auth.users)
- timestamp (timestamptz)
- activity (text, nullable - null if skipped)
- is_skipped (boolean)
- created_at (timestamptz)

## UI Components

### 1. Login Page
- Email and password fields
- Login button
- Error handling for invalid credentials

### 2. Main Dashboard
- Header with logout button
- Notification modal (appears every 30 min)
- Table view of logged activities

### 3. Table View
- Columns: Date, Time, Activity
- Sort by most recent first
- Display "❌" for skipped entries
- Show data for current week by default
- Date range filter (optional enhancement)

### 4. Bulk Set Feature
- Button: "Set 1-6 PM as College Time"
- On click: prompt for date selection
- Creates entries for every 30-min slot from 1:00 PM to 6:00 PM
- Sets activity as "College time" for all slots
- Confirms action before saving

## Notification Logic
- Use `setInterval` to check every 30 minutes
- Track last notification timestamp in localStorage
- Only trigger when tab is active (use `document.visibilityState`)
- Show browser notification permission prompt on first login
- Modal overlay blocks other interactions until submitted or timed out
- 2-minute timeout for user response before marking as skipped

## Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Deployment Requirements
- Vercel deployment with Bun runtime
- Environment variables configured in Vercel dashboard
- Supabase project setup with RLS policies (user can only access their own data)

## Key User Flows
1. **Login** → Authenticate → Dashboard
2. **Every 30 min** → Notification → Input activity → Save to Supabase
3. **Bulk set** → Click button → Select date → Confirm → Create multiple entries
4. **View logs** → See table of all activities with timestamps

## Success Criteria
- Notifications trigger reliably every 30 minutes when tab is open
- All data persists in Supabase
- Single user can log in and access only their data
- Table displays all logged activities clearly
- Bulk-set feature works for 1-6 PM range
- Deploys successfully to Vercel