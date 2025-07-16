// Comprehensive test for Course Builder functionality
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ghohtdsweojsilngmnap.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdob2h0ZHN3ZW9qc2lsbmdtbmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NjM3OTgsImV4cCI6MjA2ODAzOTc5OH0.p8_P5J3a5oweCCzn8eSQUHqMwRL4c2Wio0sR1B94m3E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCourseBuilder() {
  console.log('=== Testing Course Builder Functionality ===\n')
  
  try {
    // 1. Verify database tables exist
    console.log('1. Checking database tables...')
    
    // Check courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1)
    
    if (coursesError) {
      console.error('❌ Courses table error:', coursesError.message)
      return
    }
    console.log('✅ Courses table: OK')
    
    // Check modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .limit(1)
    
    if (modulesError) {
      console.error('❌ Modules table error:', modulesError.message)
      return
    }
    console.log('✅ Modules table: OK')
    
    // Check lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .limit(1)
    
    if (lessonsError) {
      console.error('❌ Lessons table error:', lessonsError.message)
      return
    }
    console.log('✅ Lessons table: OK')
    
    // Check quiz_questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(1)
    
    if (questionsError) {
      console.error('❌ Quiz questions table error:', questionsError.message)
      return
    }
    console.log('✅ Quiz questions table: OK')
    
    console.log()
    
    // 2. Test course creation workflow
    console.log('2. Testing course creation workflow...')
    
    // Get an existing course or create one
    let testCourse
    if (courses && courses.length > 0) {
      testCourse = courses[0]
      console.log('✅ Using existing course:', testCourse.title)
    } else {
      console.log('Creating test course...')
      const { data: newCourse, error: createError } = await supabase
        .from('courses')
        .insert({
          title: 'Test Course for Builder',
          description: 'A test course to verify Course Builder functionality',
          price: 99.99,
          estimated_duration: '2-3 hours',
          is_published: false
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Course creation error:', createError.message)
        return
      }
      testCourse = newCourse
      console.log('✅ Test course created:', testCourse.title)
    }
    
    console.log()
    
    // 3. Test module creation
    console.log('3. Testing module creation...')
    
    const { data: testModule, error: moduleError } = await supabase
      .from('modules')
      .insert({
        course_id: testCourse.id,
        title: 'Test Module',
        description: 'A test module for lesson creation',
        order_index: 0
      })
      .select()
      .single()
    
    if (moduleError) {
      console.error('❌ Module creation error:', moduleError.message)
      return
    }
    console.log('✅ Test module created:', testModule.title)
    
    console.log()
    
    // 4. Test lesson creation (different types)
    console.log('4. Testing lesson creation...')
    
    // Video lesson
    const { data: videoLesson, error: videoError } = await supabase
      .from('lessons')
      .insert({
        module_id: testModule.id,
        title: 'Test Video Lesson',
        description: 'A test video lesson',
        content_type: 'video',
        order_index: 0
      })
      .select()
      .single()
    
    if (videoError) {
      console.error('❌ Video lesson error:', videoError.message)
      return
    }
    console.log('✅ Video lesson created:', videoLesson.title)
    
    // Quiz lesson with questions
    const { data: quizLesson, error: quizError } = await supabase
      .from('lessons')
      .insert({
        module_id: testModule.id,
        title: 'Test Quiz Lesson',
        description: 'A test quiz lesson',
        content_type: 'quiz',
        order_index: 1,
        is_final_quiz: true,
        passing_score: 80
      })
      .select()
      .single()
    
    if (quizError) {
      console.error('❌ Quiz lesson error:', quizError.message)
      return
    }
    console.log('✅ Quiz lesson created:', quizLesson.title)
    
    // Add quiz questions
    const { data: question1, error: q1Error } = await supabase
      .from('quiz_questions')
      .insert({
        lesson_id: quizLesson.id,
        question_text: 'What is the primary purpose of safety training?',
        option_a: 'To meet compliance requirements',
        option_b: 'To prevent accidents and injuries',
        option_c: 'To satisfy insurance companies',
        option_d: 'To avoid legal liability',
        correct_answer: 'B',
        order_index: 0
      })
      .select()
      .single()
    
    if (q1Error) {
      console.error('❌ Quiz question 1 error:', q1Error.message)
      return
    }
    console.log('✅ Quiz question 1 created')
    
    const { data: question2, error: q2Error } = await supabase
      .from('quiz_questions')
      .insert({
        lesson_id: quizLesson.id,
        question_text: 'How often should safety training be updated?',
        option_a: 'Once per year',
        option_b: 'Every two years',
        option_c: 'When regulations change',
        option_d: 'Never',
        correct_answer: 'C',
        order_index: 1
      })
      .select()
      .single()
    
    if (q2Error) {
      console.error('❌ Quiz question 2 error:', q2Error.message)
      return
    }
    console.log('✅ Quiz question 2 created')
    
    // Asset lesson
    const { data: assetLesson, error: assetError } = await supabase
      .from('lessons')
      .insert({
        module_id: testModule.id,
        title: 'Test Asset Lesson',
        description: 'A test asset/PDF lesson',
        content_type: 'asset',
        order_index: 2
      })
      .select()
      .single()
    
    if (assetError) {
      console.error('❌ Asset lesson error:', assetError.message)
      return
    }
    console.log('✅ Asset lesson created:', assetLesson.title)
    
    console.log()
    
    // 5. Test data retrieval (simulating Course Builder loading)
    console.log('5. Testing data retrieval (Course Builder simulation)...')
    
    const { data: moduleWithLessons, error: retrieveError } = await supabase
      .from('modules')
      .select(`
        *,
        lessons (
          *,
          quiz_questions (*)
        )
      `)
      .eq('course_id', testCourse.id)
      .order('order_index')
    
    if (retrieveError) {
      console.error('❌ Data retrieval error:', retrieveError.message)
      return
    }
    
    console.log('✅ Successfully retrieved course structure:')
    console.log(`   Course: ${testCourse.title}`)
    console.log(`   Modules: ${moduleWithLessons.length}`)
    
    moduleWithLessons.forEach((module, i) => {
      console.log(`   Module ${i + 1}: ${module.title} (${module.lessons?.length || 0} lessons)`)
      
      if (module.lessons) {
        module.lessons.forEach((lesson, j) => {
          const questionsCount = lesson.quiz_questions?.length || 0
          const quizInfo = lesson.content_type === 'quiz' ? ` (${questionsCount} questions)` : ''
          const finalQuiz = lesson.is_final_quiz ? ' [FINAL QUIZ]' : ''
          console.log(`     Lesson ${j + 1}: ${lesson.title} (${lesson.content_type})${quizInfo}${finalQuiz}`)
        })
      }
    })
    
    console.log()
    console.log('🎉 All Course Builder tests passed!')
    console.log('📝 The Course Builder should work properly in the UI.')
    console.log('🚀 Ready to test lesson creation workflow in the browser.')
    
    // Clean up test data
    console.log()
    console.log('Cleaning up test data...')
    
    // Delete in reverse order due to foreign key constraints
    await supabase.from('quiz_questions').delete().eq('lesson_id', quizLesson.id)
    await supabase.from('lessons').delete().eq('module_id', testModule.id)
    await supabase.from('modules').delete().eq('id', testModule.id)
    
    console.log('✅ Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testCourseBuilder()