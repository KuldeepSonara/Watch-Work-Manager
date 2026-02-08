/**
 * Tasks Service
 * Handles all database operations for tasks
 */

import { supabase } from '@/lib/supabase'
import { ERROR_CODES } from '@/lib/constants'

export interface Task {
    id: string
    name: string
    rate: number
    sort_order: number
    is_active: boolean
    created_at?: string
}

export interface CreateTaskDto {
    name: string
    rate?: number
    sort_order?: number
}

export interface UpdateTaskDto {
    name?: string
    rate?: number
    is_active?: boolean
}

class TasksService {
    async findAll(activeOnly = true): Promise<Task[]> {
        let query = supabase.from('tasks').select('*').order('sort_order')

        if (activeOnly) {
            query = query.eq('is_active', true)
        }

        const { data, error } = await query
        if (error) throw error
        return data || []
    }

    async findById(id: string): Promise<Task | null> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    async create(dto: CreateTaskDto): Promise<Task> {
        const { data, error } = await supabase
            .from('tasks')
            .insert({
                name: dto.name.trim(),
                rate: dto.rate || 0,
                sort_order: dto.sort_order || 0,
                is_active: true
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    async update(id: string, dto: UpdateTaskDto): Promise<Task> {
        const updateData: Record<string, unknown> = {}
        if (dto.name !== undefined) updateData.name = dto.name.trim()
        if (dto.rate !== undefined) updateData.rate = dto.rate
        if (dto.is_active !== undefined) updateData.is_active = dto.is_active

        const { data, error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async delete(id: string): Promise<void> {
        // Check if task is in use
        const isUsed = await this.hasActiveEntries(id)
        if (isUsed) {
            throw new Error(ERROR_CODES.TASK_IN_USE)
        }

        // Soft delete - set is_active to false
        const { error } = await supabase
            .from('tasks')
            .update({ is_active: false })
            .eq('id', id)

        if (error) throw error
    }

    async hasActiveEntries(taskId: string): Promise<boolean> {
        // Only check for entries that are in_progress
        const { data, error } = await supabase
            .from('work_entry_tasks')
            .select('id, work_entries!inner(status)')
            .eq('task_id', taskId)
            .eq('work_entries.status', 'in_progress')
            .limit(1)

        if (error) throw error
        return (data?.length || 0) > 0
    }
}

export const tasksService = new TasksService()
