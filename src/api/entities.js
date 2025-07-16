import { db, storage } from './supabaseClient'
import { supabase } from '../lib/supabase'

// Course entity
export const Course = {
  async list(orderBy = '-created_date') {
    return db.list('courses', { orderBy })
  },

  async create(data) {
    // Generate SKU if not provided
    if (!data.sku) {
      data.sku = `COURSE-${Date.now()}`
    }
    
    const course = await db.create('courses', data)
    
    // Create initial version
    await CourseVersion.create({
      course_id: course.id,
      version_number: 1,
      version_string: '1.0',
      version_type: 'major',
      title: course.title,
      description: course.description,
      is_live: true,
      is_active: true,
      created_by: data.instructor_id
    })
    
    return course
  },

  async get(id) {
    return db.read('courses', id)
  },

  async update(id, data) {
    return db.update('courses', id, data)
  },

  async delete(id) {
    return db.delete('courses', id)
  },

  async getWithModules(id) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules (
          *,
          content_items (*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async publish(id) {
    return db.update('courses', id, { 
      is_published: true, 
      published_date: new Date().toISOString() 
    })
  },

  async unpublish(id) {
    return db.update('courses', id, { is_published: false })
  }
}

// Course Version entity
export const CourseVersion = {
  async list(courseId) {
    return db.list('course_versions', { 
      filter: { course_id: courseId },
      orderBy: 'version_number:desc'
    })
  },

  async create(data) {
    return db.create('course_versions', data)
  },

  async get(id) {
    return db.read('course_versions', id)
  },

  async setLive(courseId, versionId) {
    // Set all versions to not live
    await supabase
      .from('course_versions')
      .update({ is_live: false })
      .eq('course_id', courseId)
    
    // Set the specific version to live
    return db.update('course_versions', versionId, { is_live: true })
  }
}

// Module entity
export const Module = {
  async list(courseId) {
    return db.list('modules', { 
      filter: { course_id: courseId },
      orderBy: 'order_index'
    })
  },

  async create(data) {
    return db.create('modules', data)
  },

  async get(id) {
    return db.read('modules', id)
  },

  async update(id, data) {
    return db.update('modules', id, data)
  },

  async delete(id) {
    return db.delete('modules', id)
  },

  async reorder(moduleIds) {
    const updates = moduleIds.map((id, index) => 
      db.update('modules', id, { order_index: index })
    )
    return Promise.all(updates)
  },

  async getWithLessons(courseId) {
    console.log('=== LOADING MODULES WITH LESSONS ===')
    console.log('Course ID:', courseId)
    
    const { data, error } = await supabase
      .from('modules')
      .select(`
        *,
        lessons (
          *,
          quiz_questions (*)
        )
      `)
      .eq('course_id', courseId)
      .order('order_index')
    
    console.log('Modules query result:', data)
    console.log('Modules query error:', error)
    
    if (error) throw error
    
    // Sort lessons by order_index within each module
    const result = data.map(module => ({
      ...module,
      lessons: module.lessons.sort((a, b) => a.order_index - b.order_index)
    }))
    
    console.log('Final modules with lessons:', result)
    
    // Log each lesson to see if video_url is included
    result.forEach(module => {
      console.log(`Module: ${module.title}`)
      module.lessons?.forEach(lesson => {
        console.log(`  Lesson: ${lesson.title}, video_url: ${lesson.video_url || 'NOT SET'}`)
      })
    })
    
    return result
  }
}

// Content Item entity
export const ContentItem = {
  async list(moduleId) {
    return db.list('content_items', { 
      filter: { module_id: moduleId },
      orderBy: 'order_index:asc'
    })
  },

  async create(data) {
    return db.create('content_items', data)
  },

  async get(id) {
    return db.read('content_items', id)
  },

  async update(id, data) {
    return db.update('content_items', id, data)
  },

  async delete(id) {
    return db.delete('content_items', id)
  },

  async uploadVideo(file, courseId, contentItemId) {
    const fileName = `courses/${courseId}/videos/${contentItemId}/${file.name}`
    
    // Upload to Supabase Storage
    const uploadResult = await storage.uploadFile('course-content', fileName, file)
    
    // Get public URL
    const publicUrl = await storage.getPublicUrl('course-content', fileName)
    
    // Update content item with video URL
    await this.update(contentItemId, { 
      content_url: publicUrl,
      content_data: { 
        ...uploadResult,
        file_size: file.size,
        file_type: file.type 
      }
    })
    
    return publicUrl
  }
}

// Lesson entity
export const Lesson = {
  async list(moduleId) {
    return db.list('lessons', { 
      filter: { module_id: moduleId },
      orderBy: 'order_index'
    })
  },

  async create(data) {
    return db.create('lessons', data)
  },

  async get(id) {
    return db.read('lessons', id)
  },

  async update(id, data) {
    console.log('=== LESSON UPDATE ===')
    console.log('Lesson ID:', id)
    console.log('Update data:', JSON.stringify(data, null, 2))
    const result = await db.update('lessons', id, data)
    console.log('Update result:', result)
    return result
  },

  async delete(id) {
    return db.delete('lessons', id)
  },

  async reorder(lessonIds) {
    const updates = lessonIds.map((id, index) => 
      db.update('lessons', id, { order_index: index })
    )
    return Promise.all(updates)
  },

  async getWithQuestions(id) {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        quiz_questions (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // Sort questions by order_index
    if (data.quiz_questions) {
      data.quiz_questions.sort((a, b) => a.order_index - b.order_index)
    }
    
    return data
  },

  async uploadVideo(file, courseId, lessonId) {
    const fileName = `courses/${courseId}/videos/${lessonId}/${file.name}`
    
    // Upload to Supabase Storage with upsert to overwrite existing files
    const uploadResult = await storage.uploadFile('course-content', fileName, file, {
      upsert: true
    })
    
    // Get public URL
    const publicUrl = await storage.getPublicUrl('course-content', fileName)
    
    // Update lesson with video URL (only update if lessonId exists)
    if (lessonId && lessonId !== 'temp') {
      await this.update(lessonId, { 
        video_url: publicUrl
      })
    }
    
    return publicUrl
  },

  async uploadAsset(file, courseId, lessonId) {
    const fileName = `courses/${courseId}/assets/${lessonId}/${file.name}`
    
    // Upload to Supabase Storage with upsert to overwrite existing files
    const uploadResult = await storage.uploadFile('course-content', fileName, file, {
      upsert: true
    })
    
    // Get public URL
    const publicUrl = await storage.getPublicUrl('course-content', fileName)
    
    // Update lesson with asset URL (only update if lessonId exists)
    if (lessonId && lessonId !== 'temp') {
      await this.update(lessonId, { 
        asset_url: publicUrl
      })
    }
    
    return publicUrl
  }
}

// Quiz Question entity
export const QuizQuestion = {
  async list(lessonId) {
    return db.list('quiz_questions', { 
      filter: { lesson_id: lessonId },
      orderBy: 'order_index'
    })
  },

  async create(data) {
    return db.create('quiz_questions', data)
  },

  async get(id) {
    return db.read('quiz_questions', id)
  },

  async update(id, data) {
    return db.update('quiz_questions', id, data)
  },

  async delete(id) {
    return db.delete('quiz_questions', id)
  },

  async reorder(questionIds) {
    const updates = questionIds.map((id, index) => 
      db.update('quiz_questions', id, { order_index: index })
    )
    return Promise.all(updates)
  }
}

// Assessment entity
export const Assessment = {
  async list(contentItemId) {
    return db.list('assessments', { 
      filter: { content_item_id: contentItemId }
    })
  },

  async create(data) {
    return db.create('assessments', data)
  },

  async get(id) {
    return db.read('assessments', id)
  },

  async update(id, data) {
    return db.update('assessments', id, data)
  },

  async delete(id) {
    return db.delete('assessments', id)
  },

  async markAsFinalExam(id, isFinalExam = true) {
    return db.update('assessments', id, { is_final_exam: isFinalExam })
  }
}

// User entity
export const User = {
  async list(orderBy = '-created_date') {
    return db.list('users', { orderBy })
  },

  async get(id) {
    return db.read('users', id)
  },

  async update(id, data) {
    return db.update('users', id, data)
  },

  async updateRole(id, role) {
    return db.update('users', id, { role })
  },

  async filter(criteria) {
    return db.list('users', { filter: criteria })
  }
}

// Enrollment entity
export const Enrollment = {
  async list(options = {}) {
    return db.list('enrollments', options)
  },

  async create(data) {
    return db.create('enrollments', data)
  },

  async get(id) {
    return db.read('enrollments', id)
  },

  async update(id, data) {
    return db.update('enrollments', id, data)
  },

  async getUserEnrollments(userId) {
    return db.list('enrollments', { filter: { user_id: userId } })
  },

  async getCourseEnrollments(courseId) {
    return db.list('enrollments', { filter: { course_id: courseId } })
  },

  async getWithProgress(userId, courseId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        lesson_progress (*),
        quiz_attempts (*)
      `)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()
    
    if (error) throw error
    return data
  },

  // Admin/Team Manager reporting functions
  async getEnrollmentReports(courseId = null) {
    let query = supabase
      .from('enrollments')
      .select(`
        *,
        users!enrollments_user_id_fkey (
          id, 
          email, 
          full_name
        ),
        courses!enrollments_course_id_fkey (
          id,
          title,
          sku
        )
      `)
      .order('created_date', { ascending: false })
    
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    const { data, error } = await query
    if (error) throw error
    
    // Get final quiz scores for each enrollment
    const enrichedData = await Promise.all(data.map(async (enrollment) => {
      // Find final quiz for this course
      const finalQuizScore = await this.getFinalQuizScore(enrollment.user_id, enrollment.course_id)
      
      return {
        ...enrollment,
        student_name: enrollment.users?.full_name || enrollment.users?.email || 'Unknown',
        student_email: enrollment.users?.email,
        course_title: enrollment.courses?.title,
        course_sku: enrollment.courses?.sku,
        final_quiz_score: finalQuizScore
      }
    }))
    
    return enrichedData
  },

  async getFinalQuizScore(userId, courseId) {
    try {
      // Get course modules and lessons to find final quiz
      const modules = await Module.getWithLessons(courseId)
      const allLessons = modules.flatMap(m => m.lessons || [])
      const finalQuizzes = allLessons.filter(l => l.is_final_quiz && l.content_type === 'quiz')
      
      if (finalQuizzes.length === 0) {
        return null // No final quiz for this course
      }
      
      // Get best score from final quiz attempts
      let bestScore = null
      for (const quiz of finalQuizzes) {
        const bestAttempt = await QuizAttempt.getBestAttempt(userId, quiz.id)
        if (bestAttempt && (bestScore === null || bestAttempt.score > bestScore)) {
          bestScore = bestAttempt.score
        }
      }
      
      return bestScore
    } catch (error) {
      console.error('Error getting final quiz score:', error)
      return null
    }
  }}
}

// Lesson Progress entity
export const LessonProgress = {
  async list(userId, courseId = null) {
    let filter = { user_id: userId }
    if (courseId) {
      // Get lessons for this course first, then filter progress
      const modules = await Module.list(courseId)
      const lessonIds = modules.flatMap(m => m.lessons?.map(l => l.id) || [])
      return db.list('lesson_progress', { 
        filter: { 
          user_id: userId,
          lesson_id: { in: lessonIds }
        } 
      })
    }
    return db.list('lesson_progress', { filter })
  },

  async get(userId, lessonId) {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create(data) {
    return db.create('lesson_progress', data)
  },

  async update(userId, lessonId, data) {
    const existing = await this.get(userId, lessonId)
    if (existing) {
      return db.update('lesson_progress', existing.id, data)
    } else {
      return this.create({
        user_id: userId,
        lesson_id: lessonId,
        ...data
      })
    }
  },

  async markCompleted(userId, lessonId, timeSpent = 0) {
    return this.update(userId, lessonId, {
      status: 'completed',
      progress_percentage: 100,
      time_spent: timeSpent,
      completed_date: new Date().toISOString()
    })
  },

  async markInProgress(userId, lessonId) {
    return this.update(userId, lessonId, {
      status: 'in_progress',
      started_date: new Date().toISOString()
    })
  }
}

// Quiz Attempts entity
export const QuizAttempt = {
  async list(userId, lessonId = null) {
    let filter = { user_id: userId }
    if (lessonId) filter.lesson_id = lessonId
    return db.list('quiz_attempts', { 
      filter,
      orderBy: 'created_date:desc' 
    })
  },

  async create(data) {
    return db.create('quiz_attempts', data)
  },

  async get(id) {
    return db.read('quiz_attempts', id)
  },

  async getBestAttempt(userId, lessonId) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('score', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getLatestAttempt(userId, lessonId) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('created_date', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}