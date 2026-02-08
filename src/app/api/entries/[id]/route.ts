/**
 * Entry by ID Route
 * GET /api/entries/[id] - Get single entry
 * PUT /api/entries/[id] - Update an entry
 * DELETE /api/entries/[id] - Delete an entry
 * PATCH /api/entries/[id] - Update status only
 */

import { EntriesController } from '@/controllers'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    return EntriesController.getById(id)
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    return EntriesController.update(id, request)
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    return EntriesController.delete(id)
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    return EntriesController.updateStatus(id, request)
}
