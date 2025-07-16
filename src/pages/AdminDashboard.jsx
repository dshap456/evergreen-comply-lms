import React, { useState, useEffect } from 'react'
import { Course, User } from '../api/entities'
import CourseForm from '../components/admin/CourseForm'
import CourseList from '../components/admin/CourseList'
import CourseBuilder from '../components/admin/CourseBuilder'
import StudentReports from '../components/admin/StudentReports'

export default function AdminDashboard({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('courses')
  const [courses, setCourses] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [showCourseBuilder, setShowCourseBuilder] = useState(false)
  const [buildingCourse, setBuildingCourse] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      console.log('Loading admin dashboard data...')
      
      console.log('Loading courses...')
      const coursesData = await Course.list()
      console.log('Courses loaded:', coursesData)
      
      console.log('Loading users...')
      const usersData = await User.list()
      console.log('Users loaded:', usersData)
      
      setCourses(coursesData)
      setUsers(usersData)
      console.log('Data loading completed successfully')
    } catch (error) {
      console.error('Error loading data:', error)
      console.error('Error details:', error.message, error.stack)
    }
    setLoading(false)
  }

  const handleCreateCourse = () => {
    setEditingCourse(null)
    setShowCourseForm(true)
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setShowCourseForm(true)
  }

  const handleCourseFormClose = () => {
    setShowCourseForm(false)
    setEditingCourse(null)
    loadData() // Refresh data
  }

  const handleBuildStructure = (course) => {
    setBuildingCourse(course)
    setShowCourseBuilder(true)
  }

  const handleCourseBuilderClose = () => {
    setShowCourseBuilder(false)
    setBuildingCourse(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
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
              <h1 className="text-xl font-semibold text-slate-900">Admin Dashboard</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Super Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Welcome, {user.email}</span>
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Courses ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Student Reports
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Course Management</h2>
                <p className="text-slate-600">Create and manage your training courses</p>
              </div>
              <button
                onClick={handleCreateCourse}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                + Create Course
              </button>
            </div>

            <CourseList 
              courses={courses}
              onEdit={handleEditCourse}
              onRefresh={loadData}
              onBuildStructure={handleBuildStructure}
            />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
              <p className="text-slate-600">Manage platform users and roles</p>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-medium text-slate-900">All Users</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {users.map((user) => (
                  <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {user.full_name || 'No name provided'}
                      </div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'team_manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(user.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Student Reports Tab */}
        {activeTab === 'reports' && (
          <StudentReports user={user} />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
              <p className="text-slate-600">Platform usage and performance metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">Total Courses</dt>
                      <dd className="text-lg font-medium text-slate-900">{courses.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-slate-900">{users.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">Published Courses</dt>
                      <dd className="text-lg font-medium text-slate-900">
                        {courses.filter(c => c.is_published).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Course Form Modal */}
      {showCourseForm && (
        <CourseForm
          course={editingCourse}
          onClose={handleCourseFormClose}
          instructorId={user.id}
        />
      )}

      {showCourseBuilder && (
        <CourseBuilder
          course={buildingCourse}
          onClose={handleCourseBuilderClose}
        />
      )}
    </div>
  )
}