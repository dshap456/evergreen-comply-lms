import React, { useState, useEffect, useRef } from 'react'
import { LessonProgress } from '../../api/entities'

export default function LessonViewer({ lesson, course, user, onCompleted, onClose }) {
  const [startTime] = useState(Date.now())
  const [hasStarted, setHasStarted] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    // Mark lesson as started when component mounts
    if (!hasStarted) {
      markAsStarted()
      setHasStarted(true)
    }
  }, [lesson.id])

  const markAsStarted = async () => {
    try {
      await LessonProgress.markInProgress(user.id, lesson.id)
    } catch (error) {
      console.error('Error marking lesson as started:', error)
    }
  }

  const handleMarkComplete = async () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000 / 60) // minutes
    
    try {
      await LessonProgress.markCompleted(user.id, lesson.id, timeSpent)
      onCompleted(lesson.id)
    } catch (error) {
      console.error('Error marking lesson as complete:', error)
    }
  }

  const handleVideoEnd = () => {
    // Auto-mark video lessons as complete when video ends
    if (lesson.content_type === 'video') {
      handleMarkComplete()
    }
  }

  const getContentDisplay = () => {
    switch (lesson.content_type) {
      case 'video':
        if (lesson.video_url) {
          return (
            <div className="w-full">
              <video
                ref={videoRef}
                className="w-full h-auto rounded-lg shadow-lg"
                controls
                onEnded={handleVideoEnd}
                onPlay={() => setHasStarted(true)}
              >
                <source src={lesson.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  📹 Watch the complete video to proceed to the next lesson
                </p>
                <button
                  onClick={handleMarkComplete}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Mark as Complete
                </button>
              </div>
            </div>
          )
        } else {
          return (
            <div className="text-center py-8">
              <p className="text-slate-500">No video content available for this lesson.</p>
              <button
                onClick={handleMarkComplete}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Mark as Complete
              </button>
            </div>
          )
        }

      case 'asset':
        if (lesson.asset_url) {
          return (
            <div className="w-full">
              <div className="border border-slate-200 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <svg className="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Download Course Material</h3>
                <p className="text-slate-600 mb-4">
                  Click the link below to download or view the course materials.
                </p>
                <div className="space-y-3">
                  <a
                    href={lesson.asset_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download/View Material
                  </a>
                  <div className="mt-4">
                    <button
                      onClick={handleMarkComplete}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                      Mark as Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        } else {
          return (
            <div className="text-center py-8">
              <p className="text-slate-500">No asset content available for this lesson.</p>
              <button
                onClick={handleMarkComplete}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Mark as Complete
              </button>
            </div>
          )
        }

      default:
        return (
          <div className="text-center py-8">
            <p className="text-slate-500">Unknown content type: {lesson.content_type}</p>
            <button
              onClick={handleMarkComplete}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Mark as Complete
            </button>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-slate-500">
                  {course.title}
                </span>
                <span className="text-slate-300">•</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  lesson.content_type === 'video' 
                    ? 'bg-blue-100 text-blue-800'
                    : lesson.content_type === 'quiz'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {lesson.content_type}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{lesson.title}</h2>
              {lesson.description && (
                <p className="text-slate-600 mt-1">{lesson.description}</p>
              )}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {getContentDisplay()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              💡 Complete this lesson to unlock the next one
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Back to Course
              </button>
              {lesson.content_type !== 'video' && (
                <button
                  onClick={handleMarkComplete}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Complete Lesson
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}