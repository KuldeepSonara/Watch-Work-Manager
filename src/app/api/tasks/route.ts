/**
 * Tasks Route
 * GET /api/tasks - List all active tasks
 * POST /api/tasks - Create a new task
 */

import { TasksController } from '@/controllers'

export async function GET() {
    return TasksController.getAll()
}

export async function POST(request: Request) {
    return TasksController.create(request)
}
