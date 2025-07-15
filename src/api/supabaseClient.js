import { supabase } from '../lib/supabase'

// Database utility functions
export const db = {
  // Generic CRUD operations
  async create(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async read(table, id) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async update(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async delete(table, id) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async list(table, options = {}) {
    let query = supabase.from(table).select('*')
    
    if (options.orderBy) {
      const [column, direction] = options.orderBy.split(':')
      query = query.order(column, { ascending: direction !== 'desc' })
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  }
}

// Authentication utilities
export const auth = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    // Get user profile from our users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error getting user profile:', error)
      throw error
    }
    
    if (profile) {
      console.log('Found user profile:', profile)
      return profile
    }
    
    // If no profile found, try to find by email
    const { data: emailProfile, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()
    
    if (emailProfile) {
      console.log('Found user by email:', emailProfile)
      // Update the profile with the correct auth user ID
      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update({ id: user.id })
        .eq('email', user.email)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating profile ID:', updateError)
        return emailProfile
      }
      
      console.log('Updated profile:', updatedProfile)
      return updatedProfile
    }
    
    console.log('No profile found, creating default')
    return { id: user.id, email: user.email, role: 'learner' }
  },

  async createUserProfile(user) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        role: 'learner'
      })
      .select()
      .single()
    
    if (error && error.code !== '23505') throw error // Ignore duplicate key errors
    return data
  }
}

// Storage utilities
export const storage = {
  async uploadFile(bucket, path, file, options = {}) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        ...options
      })
    
    if (error) throw error
    return data
  },

  async getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  },

  async deleteFile(bucket, path) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) throw error
    return true
  }
}