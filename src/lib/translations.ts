export const translations = {
    en: {
        // App
        appTitle: 'Watch Work Manager',
        // Navigation
        home: 'Home',
        workers: 'Workers',
        rates: 'Task Rates',
        entry: 'Work Entry',
        pending: 'Pending Work',
        payments: 'Payments',

        // Common
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        add: 'Add',
        search: 'Search',
        loading: 'Loading...',
        noData: 'No data found',
        actions: 'Actions',

        // Workers page
        workerName: 'Worker Name',
        addWorker: 'Add Worker',
        workerList: 'Worker List',

        // Task rates
        taskName: 'Task Name',
        ratePerItem: 'Rate per Item (₹)',
        taskNumber: 'Task #',

        // Fixed tasks
        task1: 'Crown fitting',
        task2: 'Strap fitting',
        task3: 'Lock / buckle fitting',
        task4: 'Protective packaging',
        task5: 'Box making',
        task6: 'Final boxing (25 watches per box)',

        // Work entry
        selectWorker: 'Select Worker',
        quantity: 'Quantity',
        tasksCompleted: 'Tasks Completed',
        entryDate: 'Entry Date',
        saveEntry: 'Save Entry',
        editEntry: 'Edit Entry',
        workEntries: 'Work Entries',

        // Pending work
        pendingWork: 'Pending Work',
        remainingTasks: 'Remaining Tasks',
        reassign: 'Reassign',
        reassignTo: 'Reassign To',

        // Status
        status: 'Status',
        inProgress: 'In Progress',
        completed: 'Completed',
        changeStatus: 'Change Status',
        markComplete: 'Mark Complete',
        markInProgress: 'Mark In Progress',

        // Payments
        paymentSummary: 'Payment Summary',
        totalAmount: 'Total Amount',
        workerPayments: 'Worker Payments',
        amount: 'Amount',
        totalEarnings: 'Total Earnings',
        markPaid: 'Mark as Paid',

        // Language
        language: 'Language',
        english: 'English',
        gujarati: 'ગુજરાતી',
    },
    gu: {
        // App
        appTitle: 'ઘડિયાળ કામ મેનેજર',
        // Navigation
        home: 'હોમ',
        workers: 'કામદારો',
        rates: 'કામના દર',
        entry: 'કામની એન્ટ્રી',
        pending: 'બાકી કામ',
        payments: 'ચુકવણી',

        // Common
        save: 'સેવ કરો',
        edit: 'એડિટ',
        delete: 'ડિલીટ',
        cancel: 'રદ કરો',
        add: 'ઉમેરો',
        search: 'શોધો',
        loading: 'લોડ થઈ રહ્યું છે...',
        noData: 'કોઈ ડેટા નથી',
        actions: 'ક્રિયાઓ',

        // Workers page
        workerName: 'કામદારનું નામ',
        addWorker: 'કામદાર ઉમેરો',
        workerList: 'કામદારોની યાદી',

        // Task rates
        taskName: 'કામનું નામ',
        ratePerItem: 'પ્રતિ આઇટમ દર (₹)',
        taskNumber: 'કામ #',

        // Fixed tasks
        task1: 'ક્રાઉન ફિટિંગ',
        task2: 'સ્ટ્રેપ ફિટિંગ',
        task3: 'લોક / બકલ ફિટિંગ',
        task4: 'પ્રોટેક્ટિવ પેકેજિંગ',
        task5: 'બોક્સ બનાવવું',
        task6: 'ફાઇનલ બોક્સિંગ (25 ઘડિયાળ પ્રતિ બોક્સ)',

        // Work entry
        selectWorker: 'કામદાર પસંદ કરો',
        quantity: 'જથ્થો',
        tasksCompleted: 'પૂર્ણ થયેલ કામ',
        entryDate: 'તારીખ',
        saveEntry: 'એન્ટ્રી સેવ કરો',
        editEntry: 'એન્ટ્રી એડિટ કરો',
        workEntries: 'કામની એન્ટ્રીઓ',

        // Pending work
        pendingWork: 'બાકી કામ',
        remainingTasks: 'બાકી કામ',
        reassign: 'ફરી સોંપો',
        reassignTo: 'ને સોંપો',

        // Status
        status: 'સ્થિતિ',
        inProgress: 'ચાલુ',
        completed: 'પૂર્ણ',
        changeStatus: 'સ્થિતિ બદલો',
        markComplete: 'પૂર્ણ કરો',
        markInProgress: 'ચાલુ કરો',

        // Payments
        paymentSummary: 'ચુકવણી સારાંશ',
        totalAmount: 'કુલ રકમ',
        workerPayments: 'કામદાર ચુકવણી',
        amount: 'રકમ',
        totalEarnings: 'કુલ કમાણી',
        markPaid: 'ચુકવણી કરો',

        // Language
        language: 'ભાષા',
        english: 'English',
        gujarati: 'ગુજરાતી',
    }
}

export type Language = 'en' | 'gu'
export type TranslationKey = keyof typeof translations.en
