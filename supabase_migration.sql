-- Safe Supabase Database Migration Script
-- Execute this in the Supabase SQL Editor

-- ==========================================
-- 1. WALLET SYSTEM MIGRATION
-- ==========================================

-- Create wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  balance_available numeric DEFAULT 0,
  balance_pending numeric DEFAULT 0,
  balance_locked numeric DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Migrate data from profiles to wallets safely
-- This assumes balance_available and balance_pending exist in profiles currently.
-- We wrap it in a DO block to prevent errors if the columns are already dropped.
DO $$ 
BEGIN
  -- Insert existing users' balances into wallets
  -- ON CONFLICT ensures we don't duplicate records if run multiple times
  INSERT INTO public.wallets (user_id, balance_available, balance_pending)
  SELECT id, balance_available, balance_pending
  FROM public.profiles
  ON CONFLICT (user_id) DO UPDATE 
  SET 
      balance_available = EXCLUDED.balance_available,
      balance_pending = EXCLUDED.balance_pending;
EXCEPTION
  WHEN undefined_column THEN 
    -- The columns might have been dropped already in a previous run
    NULL;
END $$;

-- Drop balance columns from profiles AFTER migration
DO $$ 
BEGIN
    ALTER TABLE public.profiles DROP COLUMN balance_available;
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.profiles DROP COLUMN balance_pending;
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;


-- ==========================================
-- 2. NOTIFICATIONS SYSTEM
-- ==========================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  message text,
  type text CHECK (type = ANY (ARRAY['task'::text, 'payout'::text, 'system'::text, 'warning'::text])),
  read boolean DEFAULT false,
  reference_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);


-- ==========================================
-- 3. CHAT SYSTEM UPGRADE
-- ==========================================

-- Implement conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

-- Implement conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  user_id uuid,
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Upgrade messages table safely by adding columns without dropping existing ones
DO $$ 
BEGIN
    ALTER TABLE public.messages ADD COLUMN conversation_id uuid REFERENCES public.conversations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.messages ADD COLUMN sender_id uuid REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.messages ADD COLUMN read boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;


-- ==========================================
-- 4. TRANSACTIONS ENHANCEMENT
-- ==========================================

DO $$ 
BEGIN
    ALTER TABLE public.transactions ADD COLUMN category text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.transactions ADD COLUMN reference_id uuid;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;


-- ==========================================
-- 5. LOGIN SECURITY
-- ==========================================

-- Create login_logs if it doesn't exist at all
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address text,
  user_agent text,
  created_at timestamp without time zone DEFAULT now(),
  device_fingerprint text,
  CONSTRAINT login_logs_pkey PRIMARY KEY (id),
  CONSTRAINT login_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- If login_logs already existed, ensure device_fingerprint is added
DO $$ 
BEGIN
    ALTER TABLE public.login_logs ADD COLUMN device_fingerprint text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;


-- ==========================================
-- 6. WITHDRAWAL SYSTEM
-- ==========================================

DO $$ 
BEGIN
    ALTER TABLE public.withdrawals ADD COLUMN processed_at timestamp without time zone;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;


-- ==========================================
-- 7. SUBMISSION SYSTEM
-- ==========================================

DO $$ 
BEGIN
    ALTER TABLE public.submissions ADD COLUMN admin_feedback text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ==========================================
-- 8. SECURITY POLICIES (RLS)
-- ==========================================

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);
