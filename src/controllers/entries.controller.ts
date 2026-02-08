/**
 * Entries Controller
 * Handles HTTP request/response logic for work entries
 */

import { NextResponse } from 'next/server'
import { entriesService, CreateEntryDto, UpdateEntryDto } from '@/services'

export class EntriesController {
    static async getAll() {
        try {
            const entries = await entriesService.findAll()
            return NextResponse.json(entries)
        } catch (error) {
            return this.handleError(error, 'Failed to fetch entries')
        }
    }

    static async getById(id: string) {
        try {
            const entry = await entriesService.findById(id)
            if (!entry) {
                return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
            }
            return NextResponse.json(entry)
        } catch (error) {
            return this.handleError(error, 'Failed to fetch entry')
        }
    }

    static async create(request: Request) {
        try {
            const body = await request.json()

            // Validation
            if (!body.worker_id || !body.quantity || !body.task_ids?.length) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
            }

            const dto: CreateEntryDto = {
                worker_id: body.worker_id,
                quantity: parseInt(body.quantity),
                entry_date: body.entry_date,
                status: body.status,
                task_ids: body.task_ids
            }
            const entry = await entriesService.create(dto)
            return NextResponse.json(entry, { status: 201 })
        } catch (error) {
            return this.handleError(error, 'Failed to create entry')
        }
    }

    static async update(id: string, request: Request) {
        try {
            const body = await request.json()

            const dto: UpdateEntryDto = {}
            if (body.worker_id !== undefined) dto.worker_id = body.worker_id
            if (body.quantity !== undefined) dto.quantity = parseInt(body.quantity)
            if (body.entry_date !== undefined) dto.entry_date = body.entry_date
            if (body.status !== undefined) dto.status = body.status
            if (body.task_ids !== undefined) dto.task_ids = body.task_ids

            const entry = await entriesService.update(id, dto)
            return NextResponse.json(entry)
        } catch (error) {
            return this.handleError(error, 'Failed to update entry')
        }
    }

    static async updateStatus(id: string, request: Request) {
        try {
            const body = await request.json()

            // Validation
            if (!body.status || !['in_progress', 'completed'].includes(body.status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
            }

            const entry = await entriesService.updateStatus(id, body.status)
            return NextResponse.json(entry)
        } catch (error) {
            return this.handleError(error, 'Failed to update status')
        }
    }

    static async delete(id: string) {
        try {
            await entriesService.delete(id)
            return new Response(null, { status: 204 })
        } catch (error) {
            return this.handleError(error, 'Failed to delete entry')
        }
    }

    private static handleError(error: unknown, defaultMessage: string) {
        const message = error instanceof Error ? error.message : defaultMessage
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
