/**
 * Workers Controller
 * Handles HTTP request/response logic for workers
 */

import { NextResponse } from 'next/server'
import { workersService, CreateWorkerDto, UpdateWorkerDto } from '@/services'

export class WorkersController {
    static async getAll() {
        try {
            const workers = await workersService.findAll()
            return NextResponse.json(workers)
        } catch (error) {
            return this.handleError(error, 'Failed to fetch workers')
        }
    }

    static async getById(id: string) {
        try {
            const worker = await workersService.findById(id)
            if (!worker) {
                return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
            }
            return NextResponse.json(worker)
        } catch (error) {
            return this.handleError(error, 'Failed to fetch worker')
        }
    }

    static async create(request: Request) {
        try {
            const body = await request.json()

            // Validation
            if (!body.name || typeof body.name !== 'string') {
                return NextResponse.json({ error: 'Name is required' }, { status: 400 })
            }

            const dto: CreateWorkerDto = { name: body.name }
            const worker = await workersService.create(dto)
            return NextResponse.json(worker, { status: 201 })
        } catch (error) {
            return this.handleError(error, 'Failed to create worker')
        }
    }

    static async update(id: string, request: Request) {
        try {
            const body = await request.json()

            // Validation
            if (!body.name || typeof body.name !== 'string') {
                return NextResponse.json({ error: 'Name is required' }, { status: 400 })
            }

            const dto: UpdateWorkerDto = { name: body.name }
            const worker = await workersService.update(id, dto)
            return NextResponse.json(worker)
        } catch (error) {
            return this.handleError(error, 'Failed to update worker')
        }
    }

    static async delete(id: string) {
        try {
            await workersService.delete(id)
            return new Response(null, { status: 204 })
        } catch (error) {
            return this.handleError(error, 'Failed to delete worker')
        }
    }

    private static handleError(error: unknown, defaultMessage: string) {
        const message = error instanceof Error ? error.message : defaultMessage
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
