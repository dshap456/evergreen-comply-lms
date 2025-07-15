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
      orderBy: 'order_index:asc'
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
  }
}