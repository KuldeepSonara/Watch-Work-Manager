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

    private static handleError(error: unknown, defaultMessage: string) {
        const message = error instanceof Error ? error.message : defaultMessage
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
