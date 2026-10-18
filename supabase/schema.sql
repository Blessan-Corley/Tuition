-- ========================================================
-- ALLWYN MATHS TUITION ATTENDANCE SCHEMA
-- Run this in your Supabase Dashboard: SQL Editor -> New Query
-- ========================================================

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  phone TEXT,
  fee_amount NUMERIC DEFAULT 0,
  classes_per_cycle INTEGER DEFAULT 12,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  duration_minutes INTEGER DEFAULT 60,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Fee Payments & Cycle Settlements Table
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  classes_settled INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access via your publishable anon key
CREATE POLICY "Allow anon all on students" ON public.students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on attendance_records" ON public.attendance_records FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on fee_payments" ON public.fee_payments FOR ALL TO anon USING (true) WITH CHECK (true);
