# Watch Work Manager | ઘડિયાળ કામ મેનેજર

Simple watch assembly work management system for home-based workers.

## Features 🚀

- 👷 **Workers Management** - Add/Edit/Delete workers
- 💰 **Task Rates** - Set price per task
- 📝 **Work Entry** - Record completed work with task selection
- ⏳ **Pending Work** - View incomplete work and reassign
- 💵 **Payments** - Calculate worker payments
- 🌐 **Bilingual** - English + ગુજરાતી support

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL)
- **Tailwind CSS** (Mobile-first)

## Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Setup Supabase

Create these tables in your Supabase dashboard:

```sql
-- Workers table
CREATE TABLE workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Task rates table  
CREATE TABLE task_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_number INTEGER UNIQUE NOT NULL,
  task_name TEXT NOT NULL,
  rate DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work entries table
CREATE TABLE work_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  tasks_completed TEXT NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Configure Environment

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```bash
cp .env.example .env.local
```

### 4. Run Development Server

```bash
npm run dev
```

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## License

MIT
