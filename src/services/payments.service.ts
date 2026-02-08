/**
 * Payments Service
 * Handles payment calculations - only for COMPLETED entries
 */

import { supabase } from '@/lib/supabase'
import { WorkStatus } from '@/lib/enums'
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
    upcoming_total: number
    upcoming_entries: number
    upcoming_details: PaymentDetail[]
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
        try {
            // Fetch all data
            const [entries, tasks, workers] = await Promise.all([
                this.getAllEntries(), // Fetch all entries (completed and in_progress)
                tasksService.findAll(true),
                workersService.findAll()
            ])

            // Calculate payment per worker
            const workerPayments: Record<string, WorkerPaymentDetails> = {}

            // Initialize all workers
            workers.forEach(worker => {
                workerPayments[worker.id] = {
                    worker_id: worker.id,
                    worker_name: worker.name,
                    total: 0,
                    entries: 0,
                    paid: false,
                    details: [],
                    upcoming_total: 0,
                    upcoming_entries: 0,
                    upcoming_details: []
                }
            })

            entries.forEach(entry => {
                const workerId = entry.worker_id

                // Skip if worker deleted
                if (!workerPayments[workerId]) return

                // Calculate entry total
                let entryTotal = 0
                const taskNames: string[] = []

                if (entry.work_entry_tasks && Array.isArray(entry.work_entry_tasks)) {
                    entry.work_entry_tasks.forEach(taskLink => {
                        const task = tasks.find((t: Task) => t.id === taskLink.task_id)
                        if (task) {
                            entryTotal += entry.quantity * task.rate
                            taskNames.push(task.name)
                        }
                    })
                }

                const detail: PaymentDetail = {
                    entry_id: entry.id,
                    quantity: entry.quantity,
                    entry_date: entry.entry_date,
                    tasks: taskNames,
                    amount: entryTotal
                }

                if (entry.status === WorkStatus.COMPLETED) {
                    workerPayments[workerId].total += entryTotal
                    workerPayments[workerId].entries += 1
                    workerPayments[workerId].details.push(detail)
                } else if (entry.status === WorkStatus.IN_PROGRESS) {
                    workerPayments[workerId].upcoming_total += entryTotal
                    workerPayments[workerId].upcoming_entries += 1
                    workerPayments[workerId].upcoming_details.push(detail)
                }
            })

            // Filter out workers with no activity
            const payments = Object.values(workerPayments).filter(p => p.entries > 0 || p.upcoming_entries > 0)
            const grandTotal = payments.reduce((sum, p) => sum + p.total, 0)

            return { payments, grandTotal, workers }
        } catch (error) {
            console.error('Error in calculateSummary:', error)
            throw error
        }
    }

    async markAsPaid(workerId: string): Promise<void> {
        // Mark all completed entries for this worker as paid
        // Using 'status' column since 'paid' column does not exist
        const { error } = await supabase
            .from('work_entries')
            .update({ status: WorkStatus.PAID })
            .eq('worker_id', workerId)
            .eq('status', WorkStatus.COMPLETED)

        if (error) throw error
    }

    private async getAllEntries(): Promise<WorkEntryWithTasks[]> {
        const { data, error } = await supabase
            .from('work_entries')
            .select('*, workers(id, name), work_entry_tasks(task_id)')
            .neq('status', WorkStatus.PAID) // Exclude already paid entries
            .order('entry_date', { ascending: false })

        if (error) throw error
        return data || []
    }
}

export const paymentsService = new PaymentsService()
