/**
 * Payments Controller
 * Handles HTTP request/response logic for payments
 */

import { NextResponse } from 'next/server'
import { paymentsService } from '@/services'

export class PaymentsController {
    static async getSummary() {
        try {
            const summary = await paymentsService.calculateSummary()
            return NextResponse.json(summary)
        } catch (error) {
            return this.handleError(error, 'Failed to calculate payments')
        }
    }

    static async markAsPaid(request: Request) {
        try {
            const body = await request.json()

            if (!body.worker_id) {
                return NextResponse.json({ error: 'Worker ID required' }, { status: 400 })
            }

            await paymentsService.markAsPaid(body.worker_id)
            return NextResponse.json({ success: true })
        } catch (error) {
            return this.handleError(error, 'Failed to mark as paid')
        }
    }

    private static handleError(error: unknown, defaultMessage: string) {
        const message = error instanceof Error ? error.message : defaultMessage
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
