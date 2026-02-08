/**
 * Tasks Controller
 * Handles HTTP request/response logic for tasks
 */

import { NextResponse } from 'next/server'
import { tasksService, CreateTaskDto, UpdateTaskDto } from '@/services'

export class TasksController {
    static async getAll() {
        try {
            const tasks = await tasksService.findAll()
            return NextResponse.json(tasks)
        } catch (error) {
            return this.handleError(error, 'Failed to fetch tasks')
        }
    }

    static async getById(id: string) {
        try {
            const task = await tasksService.findById(id)
            if (!task) {
                return NextResponse.json({ error: 'Task not found' }, { status: 404 })
            }
            return NextResponse.json(task)
        } catch (error) {
            return this.handleError(error, 'Failed to fetch task')
        }
    }

    static async create(request: Request) {
        try {
            const body = await request.json()

            // Validation
            if (!body.name || typeof body.name !== 'string') {
                return NextResponse.json({ error: 'Name is required' }, { status: 400 })
            }

            const dto: CreateTaskDto = {
                name: body.name,
                rate: body.rate,
                sort_order: body.sort_order
            }
            const task = await tasksService.create(dto)
            return NextResponse.json(task, { status: 201 })
        } catch (error) {
            return this.handleError(error, 'Failed to create task')
        }
    }

    static async update(id: string, request: Request) {
        try {
            const body = await request.json()

            const dto: UpdateTaskDto = {}
            if (body.name !== undefined) dto.name = body.name
            if (body.rate !== undefined) dto.rate = body.rate

            const task = await tasksService.update(id, dto)
            return NextResponse.json(task)
        } catch (error) {
            return this.handleError(error, 'Failed to update task')
        }
    }

    static async delete(id: string) {
        try {
            await tasksService.delete(id)
            return new Response(null, { status: 204 })
        } catch (error) {
            return this.handleError(error, 'Failed to delete task')
        }
    }

    private static handleError(error: unknown, defaultMessage: string) {
        const message = error instanceof Error ? error.message : defaultMessage
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
