/**
 * Workers Service
 * Handles all database operations for workers
 */

import { supabase } from '@/lib/supabase'
import { WorkStatus } from '@/lib/enums'
import { ERROR_CODES } from '@/lib/constants'

export interface Worker {
    id: string
    name: string
    created_at?: string
    pendingAmount?: number
}

export interface CreateWorkerDto {
    name: string
}

export interface UpdateWorkerDto {
    name?: string
}

class WorkersService {
    async findAll(): Promise<Worker[]> {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .order('name')

        if (error) throw error
        return data || []
    }

    async findById(id: string): Promise<Worker | null> {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    async create(dto: CreateWorkerDto): Promise<Worker> {
        const { data, error } = await supabase
            .from('workers')
            .insert({ name: dto.name.trim() })
            .select()
            .single()

        if (error) throw error
        return data
    }

    async update(id: string, dto: UpdateWorkerDto): Promise<Worker> {
        const updateData: Record<string, unknown> = {}
        if (dto.name !== undefined) updateData.name = dto.name.trim()

        const { data, error } = await supabase
            .from('workers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async delete(id: string): Promise<void> {
        // Check if worker has pending (in_progress) work entries
        const hasPending = await this.hasPendingWork(id)
        if (hasPending) {
            throw new Error(ERROR_CODES.WORKER_HAS_PENDING_WORK)
        }

        const { error } = await supabase
            .from('workers')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    async hasPendingWork(workerId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('work_entries')
            .select('id')
            .eq('worker_id', workerId)
            .eq('status', WorkStatus.IN_PROGRESS)
            .limit(1)

        if (error) throw error
        return (data?.length || 0) > 0
    }
}

export const workersService = new WorkersService()
