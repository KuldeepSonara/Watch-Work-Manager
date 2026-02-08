/**
 * Payments Service
 * Handles payment calculations
 */

import { supabase } from '@/lib/supabase'
import { workersService, Worker } from './workers.service'
import { tasksService, Task } from './tasks.service'

export interface WorkerPayment {
    worker_id: string
    worker_name: string
    total: number
    entries: number
}

export interface PaymentSummary {
    payments: WorkerPayment[]
    grandTotal: number
    workers: Worker[]
}

interface WorkEntryWithTasks {
    id: string
    worker_id: string
    quantity: number
    workers: { id: string; name: string }
    work_entry_tasks: { task_id: string }[]
}

class PaymentsService {
    async calculateSummary(): Promise<PaymentSummary> {
        // Fetch all data
        const [entries, tasks, workers] = await Promise.all([
            this.getAllEntries(),
            tasksService.findAll(true),
            workersService.findAll()
        ])

        // Calculate payment per worker
        const workerPayments: Record<string, { name: string; total: number; entries: number }> = {}

        entries.forEach(entry => {
            const workerId = entry.worker_id
            const workerName = entry.workers?.name || 'Unknown'

            if (!workerPayments[workerId]) {
                workerPayments[workerId] = { name: workerName, total: 0, entries: 0 }
            }

            // Calculate entry total
            let entryTotal = 0
            entry.work_entry_tasks?.forEach(taskLink => {
                const task = tasks.find((t: Task) => t.id === taskLink.task_id)
                if (task) {
                    entryTotal += entry.quantity * task.rate
                }
            })

            workerPayments[workerId].total += entryTotal
            workerPayments[workerId].entries += 1
        })

        // Convert to array and calculate grand total
        const payments = Object.entries(workerPayments).map(([id, data]) => ({
            worker_id: id,
            worker_name: data.name,
            total: data.total,
            entries: data.entries
        }))

        const grandTotal = payments.reduce((sum, p) => sum + p.total, 0)

        return { payments, grandTotal, workers }
    }

    private async getAllEntries(): Promise<WorkEntryWithTasks[]> {
        const { data, error } = await supabase
            .from('work_entries')
            .select('*, workers(id, name), work_entry_tasks(task_id)')
            .order('entry_date', { ascending: false })

        if (error) throw error
        return data || []
    }
}

export const paymentsService = new PaymentsService()
