import { Business } from '@/types/business'
import { supabase } from './supabase'

export async function getAllBusinessesClient(): Promise<Business[]> {
  try {
    const { data, error } = await supabase
      .from('biz')
      .select('*')
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error loading businesses:', error)
    return []
  }
}