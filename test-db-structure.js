// Test script to check current database structure
import { supabase } from './src/lib/supabase.js'

async function testDatabaseStructure() {
  console.log('Testing database structure...')
  
  try {
    // Test if lessons table exists
    console.log('Checking if lessons table exists...')
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .limit(1)
    
    if (lessonsError) {
      console.log('Lessons table does not exist:', lessonsError.message)
    } else {
      console.log('Lessons table exists!')
    }
    
    // Test if quiz_questions table exists
    console.log('Checking if quiz_questions table exists...')
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(1)
    
    if (questionsError) {
      console.log('Quiz questions table does not exist:', questionsError.message)
    } else {
      console.log('Quiz questions table exists!')
    }
    
    // Test if storage bucket exists
    console.log('Checking if course-content bucket exists...')
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()
    
    if (bucketsError) {
      console.log('Error checking buckets:', bucketsError.message)
    } else {
      const courseBucket = buckets.find(b => b.name === 'course-content')
      if (courseBucket) {
        console.log('Course content bucket exists!')
      } else {
        console.log('Course content bucket does not exist')
        console.log('Available buckets:', buckets.map(b => b.name))
      }
    }
    
    // Test creating a sample module and lesson
    console.log('Testing module creation...')
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .limit(1)
    
    if (courses && courses.length > 0) {
      const courseId = courses[0].id
      console.log('Found test course:', courseId)
      
      // Test modules table
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .limit(1)
      
      if (modulesError) {
        console.log('Modules table error:', modulesError.message)
      } else {
        console.log('Modules table works! Found modules:', modules.length)
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testDatabaseStructure()