/**
 * Payments Service
 * Handles payment calculations - only for COMPLETED entries
 */

import { supabase } from '@/lib/supabase'
import { workersService, Worker } from './workers.service'
import { tasksService, Task } from './tasks.service'

export interface WorkerPayment {
    worker_id: string
    worker_name: string
    total: number
    entries: number
    paid: boolean
}

export interface PaymentDetail {
    entry_id: string
    quantity: number
    entry_date: string
    tasks: string[]
    amount: number
}

export interface WorkerPaymentDetails extends WorkerPayment {
    details: PaymentDetail[]
}

export interface PaymentSummary {
    payments: WorkerPaymentDetails[]
    grandTotal: number
    workers: Worker[]
}

interface WorkEntryWithTasks {
    id: string
    worker_id: string
    quantity: number
    entry_date: string
    status: string
    paid?: boolean
    workers: { id: string; name: string }
    work_entry_tasks: { task_id: string }[]
}

class PaymentsService {
    async calculateSummary(): Promise<PaymentSummary> {
        // Fetch all data
        const [entries, tasks, workers] = await Promise.all([
            this.getCompletedEntries(), // Only completed entries
            tasksService.findAll(true),
            workersService.findAll()
        ])

        // Calculate payment per worker
        const workerPayments: Record<string, WorkerPaymentDetails> = {}

        entries.forEach(entry => {
            const workerId = entry.worker_id
            const workerName = entry.workers?.name || 'Unknown'

            if (!workerPayments[workerId]) {
                workerPayments[workerId] = {
                    worker_id: workerId,
                    worker_name: workerName,
                    total: 0,
                    entries: 0,
                    paid: false,
                    details: []
                }
            }

            // Calculate entry total
            let entryTotal = 0
            const taskNames: string[] = []
            entry.work_entry_tasks?.forEach(taskLink => {
                const task = tasks.find((t: Task) => t.id === taskLink.task_id)
                if (task) {
                    entryTotal += entry.quantity * task.rate
                    taskNames.push(task.name)
                }
            })

            workerPayments[workerId].total += entryTotal
            workerPayments[workerId].entries += 1
            workerPayments[workerId].details.push({
                entry_id: entry.id,
                quantity: entry.quantity,
                entry_date: entry.entry_date,
                tasks: taskNames,
                amount: entryTotal
            })
        })

        // Convert to array
        const payments = Object.values(workerPayments)
        const grandTotal = payments.reduce((sum, p) => sum + p.total, 0)

        return { payments, grandTotal, workers }
    }

    async markAsPaid(workerId: string): Promise<void> {
        // Mark all completed entries for this worker as paid
        const { error } = await supabase
            .from('work_entries')
            .update({ paid: true })
            .eq('worker_id', workerId)
            .eq('status', 'completed')

        if (error) throw error
    }

    private async getCompletedEntries(): Promise<WorkEntryWithTasks[]> {
        const { data, error } = await supabase
            .from('work_entries')
            .select('*, workers(id, name), work_entry_tasks(task_id)')
            .eq('status', 'completed')
            .order('entry_date', { ascending: false })

        if (error) throw error
        return data || []
    }
}

export const paymentsService = new PaymentsService()
