import React, { useState, useEffect } from 'react'
import { Module, Lesson, QuizQuestion } from '../../api/entities'
import { supabase } from '../../lib/supabase'

export default function CourseBuilder({ course, onClose }) {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState(null)
  const [activeLesson, setActiveLesson] = useState(null)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    loadModules()
  }, [course.id])

  const loadModules = async () => {
    try {
      console.log('Loading modules for course:', course.id)
      const modulesData = await Module.getWithLessons(course.id)
      console.log('Modules loaded:', modulesData)
      setModules(modulesData)
    } catch (error) {
      console.error('Error loading modules:', error)
    }
    setLoading(false)
  }

  const handleAddModule = () => {
    setEditingItem(null)
    setShowModuleForm(true)
  }

  const handleEditModule = (module) => {
    setEditingItem(module)
    setShowModuleForm(true)
  }

  const handleAddLesson = (moduleId) => {
    setEditingItem({ module_id: moduleId })
    setShowLessonForm(true)
  }

  const handleEditLesson = (lesson) => {
    setEditingItem(lesson)
    setShowLessonForm(true)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading course structure...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Course Builder</h2>
              <p className="text-slate-600">{course.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Modules Sidebar */}
          <div className="w-1/3 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-slate-900">Modules</h3>
                <button
                  onClick={handleAddModule}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Module
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {modules.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <p>No modules yet</p>
                  <button
                    onClick={handleAddModule}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Create your first module
                  </button>
                </div>
              ) : (
                <div className="p-2">
                  {modules.map((module, index) => (
                    <div key={module.id} className="mb-2">
                      <div
                        className={`p-3 rounded-lg cursor-pointer border ${
                          activeModule?.id === module.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setActiveModule(module)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {index + 1}. {module.title}
                            </p>
                            {module.description && (
                              <p className="text-sm text-slate-600 mt-1">
                                {module.description}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                              {module.lessons?.length || 0} lessons
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditModule(module)
                            }}
                            className="text-slate-400 hover:text-slate-600 ml-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lessons Main Content */}
          <div className="flex-1 flex flex-col">
            {!activeModule ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>Select a module to view its lessons</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-slate-900">{activeModule.title}</h3>
                      <p className="text-sm text-slate-600">{activeModule.description}</p>
                    </div>
                    <button
                      onClick={() => handleAddLesson(activeModule.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Lesson
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {!activeModule.lessons || activeModule.lessons.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      <p>No lessons in this module yet</p>
                      <button
                        onClick={() => handleAddLesson(activeModule.id)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Create your first lesson
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeModule.lessons.map((lesson, index) => (
                        <div key={lesson.id} className="bg-white border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-slate-500">
                                  {index + 1}.
                                </span>
                                <h4 className="font-medium text-slate-900">{lesson.title}</h4>
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
                                <p className="text-sm text-slate-600 mt-1">{lesson.description}</p>
                              )}
                              {lesson.content_type === 'quiz' && lesson.quiz_questions && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {lesson.quiz_questions.length} questions
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditLesson(lesson)}
                              className="text-slate-400 hover:text-slate-600 ml-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Module Form Modal */}
      {showModuleForm && (
        <ModuleForm
          module={editingItem}
          courseId={course.id}
          onClose={() => {
            setShowModuleForm(false)
            setEditingItem(null)
            loadModules()
          }}
        />
      )}

      {/* Lesson Form Modal */}
      {showLessonForm && (
        <LessonForm
          lesson={editingItem}
          courseId={course.id}
          onClose={() => {
            setShowLessonForm(false)
            setEditingItem(null)
            loadModules()
          }}
        />
      )}
    </div>
  )
}

// Module Form Component
function ModuleForm({ module, courseId, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (module && module.id) {
      setFormData({
        title: module.title || '',
        description: module.description || ''
      })
    }
  }, [module])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const moduleData = {
        ...formData,
        course_id: courseId,
        order_index: 0 // Will be handled by the backend
      }

      if (module && module.id) {
        await Module.update(module.id, moduleData)
      } else {
        await Module.create(moduleData)
      }

      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            {module && module.id ? 'Edit Module' : 'Add Module'}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Module Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Introduction to Safety"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of this module"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (module && module.id ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Lesson Form Component
function LessonForm({ lesson, courseId, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'video',
    is_final_quiz: false,
    passing_score: 80
  })
  const [questions, setQuestions] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (lesson && lesson.id) {
      console.log('=== LESSON FORM INITIALIZATION ===')
      console.log('Lesson data:', lesson)
      console.log('Lesson video_url:', lesson.video_url)
      console.log('Lesson asset_url:', lesson.asset_url)
      
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        content_type: lesson.content_type || 'video',
        is_final_quiz: lesson.is_final_quiz || false,
        passing_score: lesson.passing_score || 80,
        video_url: lesson.video_url || '',
        asset_url: lesson.asset_url || ''
      })
      
      console.log('Form data set with video_url:', lesson.video_url || 'EMPTY')
      
      // Load existing questions if it's a quiz
      if (lesson.content_type === 'quiz') {
        loadQuestions()
      }
    } else {
      console.log('=== LESSON FORM - NEW LESSON ===')
      setFormData({
        title: '',
        description: '',
        content_type: 'video',
        is_final_quiz: false,
        passing_score: 80,
        video_url: '',
        asset_url: ''
      })
    }
  }, [lesson])

  const loadQuestions = async () => {
    try {
      const questionsData = await QuizQuestion.list(lesson.id)
      setQuestions(questionsData)
    } catch (error) {
      console.error('Error loading questions:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const lessonData = {
        ...formData,
        module_id: lesson.module_id,
        order_index: 0 // Will be handled by the backend
      }

      console.log('Saving lesson with data:', JSON.stringify(lessonData, null, 2))
      console.log('Form data video_url:', formData.video_url)
      console.log('Form data asset_url:', formData.asset_url)

      let savedLesson
      if (lesson && lesson.id) {
        console.log('Updating existing lesson:', lesson.id)
        savedLesson = await Lesson.update(lesson.id, lessonData)
        savedLesson = { ...lesson, ...lessonData }
      } else {
        console.log('Creating new lesson')
        savedLesson = await Lesson.create(lessonData)
      }

      // If we uploaded files before creating the lesson, we need to update the file paths
      // to use the real lesson ID instead of 'temp'
      if (!lesson?.id) {
        // This is a new lesson, update file references if any were uploaded
        if (formData.video_url && formData.video_url.includes('/temp/')) {
          // Re-upload with correct lesson ID if it was uploaded with 'temp'
          console.log('Updating video path for new lesson:', savedLesson.id)
        }
        if (formData.asset_url && formData.asset_url.includes('/temp/')) {
          // Re-upload with correct lesson ID if it was uploaded with 'temp'
          console.log('Updating asset path for new lesson:', savedLesson.id)
        }
      }

      // Save quiz questions if it's a quiz
      if (formData.content_type === 'quiz' && questions.length > 0) {
        // Delete existing questions
        if (lesson && lesson.id) {
          const existingQuestions = await QuizQuestion.list(lesson.id)
          for (const q of existingQuestions) {
            await QuizQuestion.delete(q.id)
          }
        }

        // Create new questions
        for (let i = 0; i < questions.length; i++) {
          await QuizQuestion.create({
            lesson_id: savedLesson.id,
            question_text: questions[i].question_text,
            option_a: questions[i].option_a,
            option_b: questions[i].option_b,
            option_c: questions[i].option_c,
            option_d: questions[i].option_d,
            correct_answer: questions[i].correct_answer,
            order_index: i
          })
        }
      }

      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoUpload = async (e) => {
    console.log('=== UPLOAD FUNCTION CALLED ===')
    const file = e.target.files[0]
    console.log('Selected file:', file)
    
    if (!file) {
      console.log('No file selected, returning')
      return
    }

    console.log('Starting upload process...')
    setUploading(true)
    
    try {
      // Direct Supabase upload bypassing our storage wrapper
      const fileName = `courses/${courseId}/videos/${lesson?.id || Date.now()}/${file.name}`
      console.log('Upload path:', fileName)
      
      console.log('Calling supabase.storage.upload...')
      const { data, error } = await supabase.storage
        .from('course-content')
        .upload(fileName, file, { upsert: true })
      
      console.log('Upload response - data:', data, 'error:', error)
      
      if (error) {
        console.error('Upload error:', error)
        throw error
      }
      
      console.log('Getting public URL...')
      const { data: { publicUrl } } = supabase.storage
        .from('course-content')
        .getPublicUrl(fileName)
      
      console.log('Video uploaded successfully! Public URL:', publicUrl)
      
      console.log('Current formData before update:', formData)
      setFormData({ ...formData, video_url: publicUrl })
      console.log('Updated form data with video_url:', publicUrl)
      
    } catch (error) {
      console.error('UPLOAD ERROR:', error)
      console.error('Error message:', error.message)
      console.error('Error details:', error)
      setError('Failed to upload video: ' + error.message)
    } finally {
      console.log('Upload process finished, setting uploading to false')
      setUploading(false)
    }
  }

  const handleAssetUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      // Direct Supabase upload bypassing our storage wrapper
      const fileName = `courses/${courseId}/assets/${lesson?.id || Date.now()}/${file.name}`
      
      const { data, error } = await supabase.storage
        .from('course-content')
        .upload(fileName, file, { upsert: true })
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('course-content')
        .getPublicUrl(fileName)
      
      setFormData({ ...formData, asset_url: publicUrl })
    } catch (error) {
      setError('Failed to upload asset: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A'
    }])
  }

  const updateQuestion = (index, field, value) => {
    const updated = [...questions]
    updated[index][field] = value
    setQuestions(updated)
  }

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">
            {lesson && lesson.id ? 'Edit Lesson' : 'Add Lesson'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Safety Overview Video"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Content Type *
                </label>
                <select
                  value={formData.content_type}
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="video">Video</option>
                  <option value="quiz">Quiz</option>
                  <option value="asset">Asset/PDF</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of this lesson"
              />
            </div>

            {/* Content Type Specific Fields */}
            {formData.content_type === 'video' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Upload Video
                </label>
                <input
                  type="file"
                  onChange={handleVideoUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploading && <p className="text-sm text-blue-600 mt-1">Uploading video...</p>}
                {formData.video_url && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">✅ Video uploaded successfully</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formData.video_url.split('/').pop()?.replace(/%20/g, ' ')}
                    </p>
                    <a 
                      href={formData.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View video
                    </a>
                  </div>
                )}
              </div>
            )}

            {formData.content_type === 'asset' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Upload Asset (PDF, etc.)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={handleAssetUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploading && <p className="text-sm text-blue-600 mt-1">Uploading asset...</p>}
                {formData.asset_url && <p className="text-sm text-green-600 mt-1">Asset uploaded successfully</p>}
              </div>
            )}

            {formData.content_type === 'quiz' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_final_quiz}
                        onChange={(e) => setFormData({ ...formData, is_final_quiz: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                      <span className="ml-2 text-sm text-slate-700">Final Quiz (required to complete course)</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={formData.passing_score}
                      onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                      className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Quiz Questions */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-900">Quiz Questions</h4>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Question
                    </button>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No questions yet</p>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Add your first question
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {questions.map((question, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-medium text-slate-900">Question {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Question Text *
                              </label>
                              <textarea
                                value={question.question_text}
                                onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your question here"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Option A *
                                </label>
                                <input
                                  type="text"
                                  value={question.option_a}
                                  onChange={(e) => updateQuestion(index, 'option_a', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="First option"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Option B *
                                </label>
                                <input
                                  type="text"
                                  value={question.option_b}
                                  onChange={(e) => updateQuestion(index, 'option_b', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Second option"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Option C *
                                </label>
                                <input
                                  type="text"
                                  value={question.option_c}
                                  onChange={(e) => updateQuestion(index, 'option_c', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Third option"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Option D *
                                </label>
                                <input
                                  type="text"
                                  value={question.option_d}
                                  onChange={(e) => updateQuestion(index, 'option_d', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Fourth option"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Correct Answer *
                              </label>
                              <select
                                value={question.correct_answer}
                                onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (lesson && lesson.id ? 'Update Lesson' : 'Create Lesson')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}