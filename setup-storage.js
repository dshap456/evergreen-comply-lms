// Setup storage bucket for course content
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ghohtdsweojsilngmnap.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdob2h0ZHN3ZW9qc2lsbmdtbmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NjM3OTgsImV4cCI6MjA2ODAzOTc5OH0.p8_P5J3a5oweCCzn8eSQUHqMwRL4c2Wio0sR1B94m3E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupStorage() {
  console.log('Setting up storage bucket...')
  
  try {
    // Create course-content bucket
    const { data, error } = await supabase.storage.createBucket('course-content', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 100, // 100MB limit
      allowedMimeTypes: ['video/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*']
    })
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Bucket already exists!')
      } else {
        console.error('Error creating bucket:', error)
      }
    } else {
      console.log('Bucket created successfully:', data)
    }
    
    // Test upload policy by trying to list objects
    const { data: objects, error: listError } = await supabase
      .storage
      .from('course-content')
      .list()
    
    if (listError) {
      console.log('List error (expected if bucket empty):', listError.message)
    } else {
      console.log('Can list bucket contents:', objects)
    }
    
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

setupStorage()