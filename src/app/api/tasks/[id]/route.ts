/**
 * Task by ID Route
 * PUT /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Delete (soft) a task
 */

import { TasksController } from '@/controllers'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    return TasksController.update(id, request)
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    return TasksController.delete(id)
}
