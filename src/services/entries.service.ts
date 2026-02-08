/**
 * Entries Service
 * Handles all database operations for work entries
 */

import { supabase } from '@/lib/supabase'

export interface WorkEntry {
    id: string
    worker_id: string
    quantity: number
    entry_date: string
    status: string
    created_at?: string
    workers?: { name: string }
    work_entry_tasks?: { task_id: string }[]
}

export interface CreateEntryDto {
    worker_id: string
    quantity: number
    entry_date?: string
    status?: string
    task_ids: string[]
}

export interface UpdateEntryDto {
    worker_id?: string
    quantity?: number
    entry_date?: string
    status?: string
    task_ids?: string[]
}

class EntriesService {
    async findAll(limit = 100): Promise<WorkEntry[]> {
        const { data, error } = await supabase
            .from('work_entries')
            .select('*, workers(name), work_entry_tasks(task_id)')
            .order('entry_date', { ascending: false })
            .limit(limit)

        if (error) throw error

        // Handle missing status column gracefully
        return (data || []).map(entry => ({
            ...entry,
            status: entry.status || 'in_progress'
        }))
    }

    async findById(id: string): Promise<WorkEntry | null> {
        const { data, error } = await supabase
            .from('work_entries')
            .select('*, workers(name), work_entry_tasks(task_id)')
            .eq('id', id)
            .single()

        if (error) throw error
        return data ? { ...data, status: data.status || 'in_progress' } : null
    }

    async create(dto: CreateEntryDto): Promise<WorkEntry> {
        // Create the work entry
        const { data: newEntry, error: entryError } = await supabase
            .from('work_entries')
            .insert({
                worker_id: dto.worker_id,
                quantity: dto.quantity,
                entry_date: dto.entry_date || new Date().toISOString().split('T')[0],
                status: dto.status || 'in_progress'
            })
            .select()
            .single()

        if (entryError) throw entryError

        // Create task links
        await this.updateTaskLinks(newEntry.id, dto.task_ids)

        return newEntry
    }

    async update(id: string, dto: UpdateEntryDto): Promise<WorkEntry> {
        const updateData: Record<string, unknown> = {}
        if (dto.worker_id !== undefined) updateData.worker_id = dto.worker_id
        if (dto.quantity !== undefined) updateData.quantity = dto.quantity
        if (dto.entry_date !== undefined) updateData.entry_date = dto.entry_date
        if (dto.status !== undefined) updateData.status = dto.status

        const { data, error } = await supabase
            .from('work_entries')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // Update task links if provided
        if (dto.task_ids !== undefined) {
            await this.updateTaskLinks(id, dto.task_ids)
        }

        return data
    }

    async updateStatus(id: string, status: 'in_progress' | 'completed'): Promise<WorkEntry> {
        const { data, error } = await supabase
            .from('work_entries')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('work_entries')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    private async updateTaskLinks(entryId: string, taskIds: string[]): Promise<void> {
        // Delete existing links
        await supabase.from('work_entry_tasks').delete().eq('work_entry_id', entryId)

        // Create new links
        if (taskIds.length > 0) {
            const taskLinks = taskIds.map(taskId => ({
                work_entry_id: entryId,
                task_id: taskId
            }))
            await supabase.from('work_entry_tasks').insert(taskLinks)
        }
    }
}

export const entriesService = new EntriesService()
