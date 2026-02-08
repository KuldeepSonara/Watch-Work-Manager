/**
 * Payments Route
 * GET /api/payments - Calculate payment summary
 */

import { PaymentsController } from '@/controllers'

export async function GET() {
    return PaymentsController.getSummary()
}
