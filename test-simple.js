// Simple test using direct supabase connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ghohtdsweojsilngmnap.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdob2h0ZHN3ZW9qc2lsbmdtbmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NjM3OTgsImV4cCI6MjA2ODAzOTc5OH0.p8_P5J3a5oweCCzn8eSQUHqMwRL4c2Wio0sR1B94m3E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('Testing database connection...')
  
  try {
    // Test if lessons table exists
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .limit(1)
    
    if (lessonsError) {
      console.log('Lessons table error:', lessonsError.message)
      console.log('Need to create lessons table')
    } else {
      console.log('Lessons table exists!')
    }
    
    // Test storage bucket
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()
    
    if (bucketsError) {
      console.log('Storage error:', bucketsError.message)
    } else {
      console.log('Available buckets:', buckets.map(b => b.name))
      const courseBucket = buckets.find(b => b.name === 'course-content')
      if (!courseBucket) {
        console.log('Need to create course-content bucket')
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testDatabase()