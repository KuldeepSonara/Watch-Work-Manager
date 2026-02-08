/**
 * Entries Route
 * GET /api/entries - List all work entries
 * POST /api/entries - Create a new entry
 */

import { EntriesController } from '@/controllers'

export async function GET() {
    return EntriesController.getAll()
}

export async function POST(request: Request) {
    return EntriesController.create(request)
}
