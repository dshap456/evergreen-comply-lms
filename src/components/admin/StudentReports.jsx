import React, { useState, useEffect } from 'react'
import { Enrollment, Course } from '../../api/entities'

export default function StudentReports({ user }) {
  const [reports, setReports] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadReports()
  }, [selectedCourse])

  const loadData = async () => {
    try {
      // Load all courses for filter dropdown
      const coursesData = await Course.list()
      setCourses(coursesData.filter(c => c.is_published))
      
      // Load initial reports
      await loadReports()
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      const courseId = selectedCourse === 'all' ? null : selectedCourse
      const reportsData = await Enrollment.getEnrollmentReports(courseId)
      console.log('Loaded enrollment reports:', reportsData)
      setReports(reportsData)
    } catch (error) {
      console.error('Error loading reports:', error)
    }
    setLoading(false)
  }

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      report.student_name?.toLowerCase().includes(searchLower) ||
      report.student_email?.toLowerCase().includes(searchLower) ||
      report.course_title?.toLowerCase().includes(searchLower) ||
      report.course_sku?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadge = (status) => {
    const badges = {
      enrolled: 'bg-slate-100 text-slate-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800'
    }
    
    return badges[status] || 'bg-slate-100 text-slate-800'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatScore = (score) => {
    if (score === null || score === undefined) return '-'
    return `${score}%`
  }

  const exportToCSV = () => {
    const headers = [
      'Student Name',
      'Email',
      'Course',
      'SKU',
      'Status',
      'Progress',
      'Final Quiz Score',
      'Enrolled Date',
      'Completed Date'
    ]
    
    const csvData = filteredReports.map(report => [
      report.student_name || '',
      report.student_email || '',
      report.course_title || '',
      report.course_sku || '',
      report.status || '',
      `${report.progress_percentage || 0}%`,
      formatScore(report.final_quiz_score),
      formatDate(report.created_date),
      formatDate(report.completed_date)
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `student-reports-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading student reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Reports</h1>
            <p className="text-slate-600 mt-1">Track student enrollment and completion status</p>
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Filter by Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.sku})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search Students
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or course..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Enrollments</p>
              <p className="text-2xl font-semibold text-slate-900">{filteredReports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Completed</p>
              <p className="text-2xl font-semibold text-slate-900">
                {filteredReports.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">In Progress</p>
              <p className="text-2xl font-semibold text-slate-900">
                {filteredReports.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Avg Final Quiz</p>
              <p className="text-2xl font-semibold text-slate-900">
                {(() => {
                  const scoresWithFinalQuiz = filteredReports.filter(r => r.final_quiz_score !== null)
                  if (scoresWithFinalQuiz.length === 0) return '-'
                  const avg = scoresWithFinalQuiz.reduce((sum, r) => sum + r.final_quiz_score, 0) / scoresWithFinalQuiz.length
                  return `${Math.round(avg)}%`
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Final Quiz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Enrolled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No enrollment data found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={`${report.user_id}-${report.course_id}`} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {report.student_name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {report.student_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {report.course_title}
                        </div>
                        <div className="text-sm text-slate-500">
                          {report.course_sku}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                        {report.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-slate-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${report.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-slate-600">
                          {report.progress_percentage || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        report.final_quiz_score === null 
                          ? 'text-slate-400' 
                          : report.final_quiz_score >= 80 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatScore(report.final_quiz_score)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(report.created_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(report.completed_date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}