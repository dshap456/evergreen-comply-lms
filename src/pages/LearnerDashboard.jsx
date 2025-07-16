import React, { useState, useEffect } from 'react'
import { Course, Enrollment } from '../api/entities'
import CourseViewer from '../components/learner/CourseViewer'

export default function LearnerDashboard({ user, onSignOut }) {
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [coursesData, enrollmentsData] = await Promise.all([
        Course.list(),
        Enrollment.getUserEnrollments(user.id)
      ])
      setCourses(coursesData.filter(c => c.is_published))
      setEnrollments(enrollmentsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  const handleCourseSelect = (course) => {
    setSelectedCourse(course)
  }

  const handleCloseCourse = () => {
    setSelectedCourse(null)
    // Reload data to get updated progress
    loadData()
  }

  const handleUpgradeToTeamManager = async () => {
    // This would typically update the user's role
    // For now, we'll just show a message
    alert('Role upgrade feature will be implemented with the purchase system!')
  }

  const enrolledCourseIds = enrollments.map(e => e.course_id)
  const availableCourses = courses.filter(c => !enrolledCourseIds.includes(c.id))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-slate-900">Learning Dashboard</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role === 'team_manager' ? 'Team Manager' : 'Learner'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Welcome, {user.full_name || user.email}</span>
              <button
                onClick={onSignOut}
                className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md border border-slate-300 hover:border-slate-400"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upgrade to Team Manager CTA */}
        {user.role === 'learner' && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-lg font-semibold">Upgrade to Team Manager</h3>
                <p className="text-blue-100 mt-1">
                  Assign courses to your team members and track their progress
                </p>
              </div>
              <button
                onClick={handleUpgradeToTeamManager}
                className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* My Courses */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">My Courses</h2>
          
          {enrollments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mx-auto h-12 w-12 text-slate-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No courses enrolled</h3>
              <p className="text-slate-500">You haven't been assigned any courses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => {
                const course = courses.find(c => c.id === enrollment.course_id)
                if (!course) return null
                
                return (
                  <div key={enrollment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-slate-900 mb-2">{course.title}</h3>
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {course.short_description || course.description}
                          </p>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-slate-600 mb-1">
                              <span>Progress</span>
                              <span>{enrollment.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${enrollment.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              enrollment.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : enrollment.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {enrollment.status.replace('_', ' ')}
                            </span>
                            
                            <button 
                              onClick={() => handleCourseSelect(course)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {enrollment.status === 'completed' ? 'Review' : 'Continue'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Available Courses */}
        {availableCourses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Available Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {course.short_description || course.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {Math.floor(course.estimated_duration / 60)}h {course.estimated_duration % 60}m
                      </span>
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {course.level}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-900">
                        {course.price > 0 ? `$${course.price}` : 'Free'}
                      </span>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {/* Course Viewer Modal */}
      {selectedCourse && (
        <CourseViewer
          course={selectedCourse}
          user={user}
          onClose={handleCloseCourse}
        />
      )}
    </div>
  )
}