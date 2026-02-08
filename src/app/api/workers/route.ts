/**
 * Workers Route
 * GET /api/workers - List all workers
 * POST /api/workers - Create a new worker
 */

import { WorkersController } from '@/controllers'

export async function GET() {
    return WorkersController.getAll()
}

export async function POST(request: Request) {
    return WorkersController.create(request)
}
