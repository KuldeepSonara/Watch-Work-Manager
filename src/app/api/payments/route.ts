/**
 * Payments Route
 * GET /api/payments - Calculate payment summary
 * POST /api/payments - Mark worker as paid
 */

import { PaymentsController } from '@/controllers'

export async function GET() {
    return PaymentsController.getSummary()
}

export async function POST(request: Request) {
    return PaymentsController.markAsPaid(request)
}
