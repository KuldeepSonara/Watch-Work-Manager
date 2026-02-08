/**
 * Workers Service
 * Handles all database operations for workers
 */

import { supabase } from '@/lib/supabase'

export interface Worker {
    id: string
    name: string
    created_at?: string
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
        const { error } = await supabase
            .from('workers')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}

export const workersService = new WorkersService()
