/**
 * Payments Route
 * GET /api/worker-payments - Calculate payment summary
 * POST /api/worker-payments - Mark worker as paid
 */

import { PaymentsController } from '@/controllers'

export async function GET() {
    return PaymentsController.getSummary()
}

export async function POST(request: Request) {
    return PaymentsController.markAsPaid(request)
}
