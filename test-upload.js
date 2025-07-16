// Test upload to verify storage is working
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ghohtdsweojsilngmnap.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdob2h0ZHN3ZW9qc2lsbmdtbmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NjM3OTgsImV4cCI6MjA2ODAzOTc5OH0.p8_P5J3a5oweCCzn8eSQUHqMwRL4c2Wio0sR1B94m3E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpload() {
  console.log('Testing upload functionality...')
  
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()
    
    console.log('Available buckets:', buckets?.map(b => b.name) || [])
    
    // Create a small test file
    const testContent = 'This is a test file for course content upload'
    const fileName = `test-${Date.now()}.txt`
    
    // Try to upload
    const { data, error } = await supabase.storage
      .from('course-content')
      .upload(fileName, testContent, {
        contentType: 'text/plain'
      })
    
    if (error) {
      console.error('Upload error:', error)
      
      // Try to create bucket if it doesn't exist
      if (error.message.includes('Bucket not found')) {
        console.log('Creating bucket...')
        const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('course-content', {
          public: true
        })
        
        if (bucketError) {
          console.error('Bucket creation error:', bucketError)
        } else {
          console.log('Bucket created:', bucketData)
          
          // Retry upload
          const { data: retryData, error: retryError } = await supabase.storage
            .from('course-content')
            .upload(fileName, testContent, {
              contentType: 'text/plain'
            })
          
          if (retryError) {
            console.error('Retry upload error:', retryError)
          } else {
            console.log('Upload successful after bucket creation:', retryData)
          }
        }
      }
    } else {
      console.log('Upload successful:', data)
      
      // Test getting public URL
      const { data: urlData } = supabase.storage
        .from('course-content')
        .getPublicUrl(fileName)
      
      console.log('Public URL:', urlData.publicUrl)
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('course-content')
        .remove([fileName])
      
      if (deleteError) {
        console.log('Delete error (not critical):', deleteError.message)
      } else {
        console.log('Test file cleaned up successfully')
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testUpload()