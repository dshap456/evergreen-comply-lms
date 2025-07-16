import React, { useState, useEffect } from 'react'
import { Module, LessonProgress, QuizAttempt, Enrollment } from '../../api/entities'
import LessonViewer from './LessonViewer'
import QuizTaker from './QuizTaker'

export default function CourseViewer({ course, user, onClose }) {
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState({})
  const [quizAttempts, setQuizAttempts] = useState({})
  const [currentLesson, setCurrentLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrollment, setEnrollment] = useState(null)

  useEffect(() => {
    loadCourseData()
  }, [course.id, user.id])

  const loadCourseData = async () => {
    try {
      console.log('Loading course data for sequential progression...')
      
      // Load modules with lessons
      const modulesData = await Module.getWithLessons(course.id)
      console.log('Loaded modules:', modulesData)
      
      // Load user's progress for all lessons in this course
      const progressData = await LessonProgress.list(user.id, course.id)
      console.log('Loaded progress:', progressData)
      
      // Convert progress array to lookup object
      const progressLookup = {}
      progressData.forEach(p => {
        progressLookup[p.lesson_id] = p
      })
      
      // Load quiz attempts for all lessons
      const attempts = await QuizAttempt.list(user.id)
      const attemptLookup = {}
      attempts.forEach(attempt => {
        if (!attemptLookup[attempt.lesson_id]) {
          attemptLookup[attempt.lesson_id] = []
        }
        attemptLookup[attempt.lesson_id].push(attempt)
      })
      
      // Load enrollment
      const enrollmentData = await Enrollment.getWithProgress(user.id, course.id)
      console.log('Loaded enrollment:', enrollmentData)
      
      setModules(modulesData)
      setProgress(progressLookup)
      setQuizAttempts(attemptLookup)
      setEnrollment(enrollmentData)
      
    } catch (error) {
      console.error('Error loading course data:', error)
    }
    setLoading(false)
  }

  // Calculate if a lesson is accessible based on sequential completion
  const isLessonAccessible = (moduleIndex, lessonIndex) => {
    // First lesson of first module is always accessible
    if (moduleIndex === 0 && lessonIndex === 0) return true
    
    // Get all previous lessons in sequential order
    const allLessons = []
    for (let mi = 0; mi <= moduleIndex; mi++) {
      const module = modules[mi]
      if (!module?.lessons) continue
      
      const lessonsToAdd = mi === moduleIndex 
        ? module.lessons.slice(0, lessonIndex)
        : module.lessons
      
      allLessons.push(...lessonsToAdd)
    }
    
    // Check if all previous lessons are completed with passing scores
    return allLessons.every(lesson => {
      const lessonProgress = progress[lesson.id]
      
      if (lesson.content_type === 'quiz') {
        // For quizzes, check if user passed with required score
        const attempts = quizAttempts[lesson.id] || []
        const bestAttempt = attempts.reduce((best, current) => 
          !best || current.score > best.score ? current : best, null)
        
        const passingScore = lesson.passing_score || 80
        return bestAttempt && bestAttempt.score >= passingScore
      } else {
        // For videos/assets, check if marked as completed
        return lessonProgress?.status === 'completed'
      }
    })
  }

  // Calculate overall course progress
  const calculateCourseProgress = () => {
    const allLessons = modules.flatMap(m => m.lessons || [])
    if (allLessons.length === 0) return 0
    
    const completedLessons = allLessons.filter(lesson => {
      const lessonProgress = progress[lesson.id]
      
      if (lesson.content_type === 'quiz') {
        const attempts = quizAttempts[lesson.id] || []
        const bestAttempt = attempts.reduce((best, current) => 
          !best || current.score > best.score ? current : best, null)
        const passingScore = lesson.passing_score || 80
        return bestAttempt && bestAttempt.score >= passingScore
      } else {
        return lessonProgress?.status === 'completed'
      }
    })
    
    return Math.round((completedLessons.length / allLessons.length) * 100)
  }

  // Handle lesson completion
  const handleLessonCompleted = async (lessonId) => {
    console.log('Lesson completed:', lessonId)
    
    // Reload progress data
    await loadCourseData()
    
    // Update overall enrollment progress
    const newProgress = calculateCourseProgress()
    console.log('New course progress:', newProgress)
    
    try {
      await Enrollment.update(enrollment.id, {
        progress_percentage: newProgress,
        status: newProgress >= 100 ? 'completed' : 'in_progress'
      })
    } catch (error) {
      console.error('Error updating enrollment progress:', error)
    }
    
    setCurrentLesson(null)
  }

  // Handle quiz completion
  const handleQuizCompleted = async (lessonId, score, passed) => {
    console.log('Quiz completed:', lessonId, 'Score:', score, 'Passed:', passed)
    
    // Reload progress data to get latest quiz attempts
    await loadCourseData()
    
    // Update overall enrollment progress
    const newProgress = calculateCourseProgress()
    console.log('New course progress after quiz:', newProgress)
    
    try {
      await Enrollment.update(enrollment.id, {
        progress_percentage: newProgress,
        status: newProgress >= 100 ? 'completed' : 'in_progress'
      })
    } catch (error) {
      console.error('Error updating enrollment progress:', error)
    }
    
    setCurrentLesson(null)
  }

  const handleStartLesson = async (lesson) => {
    // Mark lesson as in progress
    try {
      await LessonProgress.markInProgress(user.id, lesson.id)
      await loadCourseData() // Refresh progress
    } catch (error) {
      console.error('Error marking lesson as in progress:', error)
    }
    
    setCurrentLesson(lesson)
  }

  const getNextAccessibleLesson = () => {
    for (let mi = 0; mi < modules.length; mi++) {
      const module = modules[mi]
      if (!module?.lessons) continue
      
      for (let li = 0; li < module.lessons.length; li++) {
        const lesson = module.lessons[li]
        const lessonProgress = progress[lesson.id]
        const isAccessible = isLessonAccessible(mi, li)
        
        if (isAccessible && (!lessonProgress || lessonProgress.status !== 'completed')) {
          // For quizzes, also check if not already passed
          if (lesson.content_type === 'quiz') {
            const attempts = quizAttempts[lesson.id] || []
            const bestAttempt = attempts.reduce((best, current) => 
              !best || current.score > best.score ? current : best, null)
            const passingScore = lesson.passing_score || 80
            
            if (!bestAttempt || bestAttempt.score < passingScore) {
              return { lesson, moduleIndex: mi, lessonIndex: li }
            }
          } else {
            return { lesson, moduleIndex: mi, lessonIndex: li }
          }
        }
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading course...</p>
        </div>
      </div>
    )
  }

  // Show lesson/quiz viewer if a lesson is selected
  if (currentLesson) {
    if (currentLesson.content_type === 'quiz') {
      return (
        <QuizTaker
          lesson={currentLesson}
          course={course}
          user={user}
          onCompleted={handleQuizCompleted}
          onClose={() => setCurrentLesson(null)}
        />
      )
    } else {
      return (
        <LessonViewer
          lesson={currentLesson}
          course={course}
          user={user}
          onCompleted={handleLessonCompleted}
          onClose={() => setCurrentLesson(null)}
        />
      )
    }
  }

  const nextLesson = getNextAccessibleLesson()
  const courseProgress = calculateCourseProgress()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900">{course.title}</h2>
              <p className="text-slate-600 mt-1">{course.description}</p>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Course Progress</span>
                  <span>{courseProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${courseProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Continue Button */}
        {nextLesson && (
          <div className="p-6 bg-blue-50 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-slate-900">Continue Learning</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Next: {nextLesson.lesson.title}
                </p>
              </div>
              <button
                onClick={() => handleStartLesson(nextLesson.lesson)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Continue Course
              </button>
            </div>
          </div>
        )}

        {/* Course Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                  <h3 className="font-medium text-slate-900">
                    Module {moduleIndex + 1}: {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-sm text-slate-600 mt-1">{module.description}</p>
                  )}
                </div>
                
                <div className="divide-y divide-slate-200">
                  {module.lessons?.map((lesson, lessonIndex) => {
                    const lessonProgress = progress[lesson.id]
                    const isAccessible = isLessonAccessible(moduleIndex, lessonIndex)
                    const isCompleted = lessonProgress?.status === 'completed' || 
                      (lesson.content_type === 'quiz' && (() => {
                        const attempts = quizAttempts[lesson.id] || []
                        const bestAttempt = attempts.reduce((best, current) => 
                          !best || current.score > best.score ? current : best, null)
                        const passingScore = lesson.passing_score || 80
                        return bestAttempt && bestAttempt.score >= passingScore
                      })())

                    return (
                      <div key={lesson.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Status Icon */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              isCompleted
                                ? 'bg-green-100 text-green-800'
                                : isAccessible
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isCompleted ? '✓' : lessonIndex + 1}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium ${
                                  isAccessible ? 'text-slate-900' : 'text-slate-500'
                                }`}>
                                  {lesson.title}
                                </h4>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  lesson.content_type === 'video' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : lesson.content_type === 'quiz'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {lesson.content_type}
                                </span>
                                {lesson.is_final_quiz && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Final Quiz
                                  </span>
                                )}
                              </div>
                              {lesson.description && (
                                <p className={`text-sm mt-1 ${
                                  isAccessible ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                  {lesson.description}
                                </p>
                              )}
                              
                              {/* Quiz Score Display */}
                              {lesson.content_type === 'quiz' && quizAttempts[lesson.id]?.length > 0 && (
                                <div className="mt-2">
                                  {(() => {
                                    const attempts = quizAttempts[lesson.id]
                                    const bestAttempt = attempts.reduce((best, current) => 
                                      !best || current.score > best.score ? current : best)
                                    const passingScore = lesson.passing_score || 80
                                    const passed = bestAttempt.score >= passingScore
                                    
                                    return (
                                      <div className="flex items-center space-x-2 text-xs">
                                        <span className={`font-medium ${
                                          passed ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          Best Score: {bestAttempt.score}% 
                                          {passed ? ' (Passed)' : ` (Need ${passingScore}%)`}
                                        </span>
                                        <span className="text-slate-500">
                                          • {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    )
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          <div>
                            {isAccessible ? (
                              <button
                                onClick={() => handleStartLesson(lesson)}
                                className={`text-sm font-medium px-3 py-1 rounded ${
                                  isCompleted
                                    ? 'text-slate-600 hover:text-slate-900'
                                    : 'text-blue-600 hover:text-blue-800'
                                }`}
                              >
                                {isCompleted ? 'Review' : 'Start'}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1">
                                🔒 Locked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}