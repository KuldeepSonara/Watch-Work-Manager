/**
 * Worker by ID Route
 * PUT /api/workers/[id] - Update a worker
 * DELETE /api/workers/[id] - Delete a worker
 */

import { WorkersController } from '@/controllers'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    return WorkersController.update(id, request)
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    return WorkersController.delete(id)
}
