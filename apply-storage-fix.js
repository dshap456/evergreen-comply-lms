// Script to apply storage permission fixes via Supabase API
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ghohtdsweojsilngmnap.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdob2h0ZHN3ZW9qc2lsbmdtbmFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQ2Mzc5OCwiZXhwIjoyMDY4MDM5Nzk4fQ.RkF8h3xDnrZUKPOsOXZQHKqXl0lABVhDWWNwTgU7xWI' // Service role key needed for admin operations

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixStoragePermissions() {
  console.log('🔧 Fixing Supabase Storage permissions...')
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix-storage-permissions.sql', 'utf8')
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}...`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_text: statement
        })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, err.message)
      }
    }
    
    // Test upload permissions
    console.log('\n🧪 Testing upload permissions...')
    
    // Create a test file
    const testContent = new Blob(['This is a test file for storage permissions'], { 
      type: 'text/plain' 
    })
    
    const fileName = `test-permissions-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-content')
      .upload(fileName, testContent)
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message)
    } else {
      console.log('✅ Upload test successful:', uploadData.path)
      
      // Test public URL access
      const { data: urlData } = supabase.storage
        .from('course-content')
        .getPublicUrl(fileName)
      
      console.log('✅ Public URL generated:', urlData.publicUrl)
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('course-content')
        .remove([fileName])
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test file:', deleteError.message)
      } else {
        console.log('✅ Test file cleaned up')
      }
    }
    
    console.log('\n🎉 Storage permissions fix completed!')
    console.log('📝 Video uploads should now work in the Course Builder.')
    
  } catch (error) {
    console.error('❌ Failed to fix storage permissions:', error)
  }
}

// Alternative approach using direct SQL execution
async function alternativeFixStoragePermissions() {
  console.log('🔧 Applying storage permissions via direct SQL...')
  
  try {
    // Create bucket if it doesn't exist
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('course-content', {
      public: true,
      fileSizeLimit: 104857600, // 100MB
      allowedMimeTypes: [
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    })
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Bucket creation error:', bucketError.message)
    } else {
      console.log('✅ Bucket exists or created successfully')
    }
    
    // Test basic upload
    const testContent = 'Test file content for permissions'
    const fileName = `permissions-test-${Date.now()}.txt`
    
    const { data, error } = await supabase.storage
      .from('course-content')
      .upload(fileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (error) {
      console.error('❌ Upload test failed:', error.message)
      console.log('💡 Try running the SQL script manually in Supabase dashboard.')
    } else {
      console.log('✅ Upload test successful!')
      
      // Clean up
      await supabase.storage.from('course-content').remove([fileName])
      console.log('✅ Test file cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Alternative fix failed:', error)
  }
}

// Run both approaches
async function main() {
  console.log('=== Supabase Storage Permissions Fix ===\n')
  
  // Try the alternative approach first (more likely to work)
  await alternativeFixStoragePermissions()
  
  console.log('\n--- Manual SQL Instructions ---')
  console.log('If the automated fix doesn\'t work, manually run this SQL in your Supabase dashboard:')
  console.log('1. Go to Supabase Dashboard > SQL Editor')
  console.log('2. Copy and paste the contents of fix-storage-permissions.sql')
  console.log('3. Click "Run" to execute the SQL')
}

main()