import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { startOfWeek, endOfWeek } from 'date-fns'

// Query key factory
export const timeLogKeys = {
  all: ['timeLogs'],
  week: (weekStart) => [...timeLogKeys.all, 'week', weekStart],
  allTime: () => [...timeLogKeys.all, 'allTime'],
}

// Fetch time logs
export const useTimeLogs = (filterWeek = true) => {
  return useQuery({
    queryKey: filterWeek ? timeLogKeys.week(startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()) : timeLogKeys.allTime(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      let query = supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })

      if (filterWeek) {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 })
        const end = endOfWeek(new Date(), { weekStartsOn: 1 })
        query = query.gte('timestamp', start.toISOString()).lte('timestamp', end.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Update time log mutation
export const useUpdateTimeLog = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, activity, is_skipped }) => {
      const { data, error } = await supabase
        .from('time_logs')
        .update({ activity: activity || null, is_skipped: is_skipped })
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogKeys.all })
    },
  })
}

// Insert time log mutation
export const useInsertTimeLog = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ user_id, timestamp, activity, is_skipped }) => {
      const { data, error } = await supabase
        .from('time_logs')
        .insert({ user_id, timestamp, activity, is_skipped })
        .select()
      
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogKeys.all })
    },
  })
}

// Bulk insert mutation
export const useBulkInsertTimeLogs = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (entries) => {
      const { data, error } = await supabase
        .from('time_logs')
        .insert(entries)
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeLogKeys.all })
    },
  })
}
