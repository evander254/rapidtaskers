-- ==========================================
-- RAPIDTASKERS: ATOMIC FINANCIAL OPERATIONS
-- Execute this script in your Supabase SQL Editor
-- ==========================================

DO $$ 
BEGIN
    ALTER TABLE public.tasks ADD COLUMN admin_feedback text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Ensure every profile has a wallet
INSERT INTO public.wallets (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Trigger to create wallet on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;
CREATE TRIGGER on_profile_created_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();



-- 1. Accept Task (RPC)
CREATE OR REPLACE FUNCTION public.accept_task(p_task_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_reward numeric;
    v_task_status text;
BEGIN
    -- Get task info
    SELECT reward, status INTO v_task_reward, v_task_status 
    FROM public.tasks WHERE id = p_task_id FOR UPDATE;

    IF v_task_status != 'open' THEN
        RAISE EXCEPTION 'Task is no longer open';
    END IF;

    -- Update task
    UPDATE public.tasks 
    SET status = 'assigned', assigned_to = p_user_id 
    WHERE id = p_task_id;

    -- Create pending transaction
    INSERT INTO public.transactions (user_id, amount, type, description, category, reference_id, status)
    VALUES (p_user_id, v_task_reward, 'credit', 'Task assigned', 'task_payment', p_task_id, 'pending');

    -- Update wallet pending balance (Ensure wallet exists)
    INSERT INTO public.wallets (user_id, balance_pending)
    VALUES (p_user_id, v_task_reward)
    ON CONFLICT (user_id) DO UPDATE 
    SET balance_pending = public.wallets.balance_pending + v_task_reward;

    -- Log claim if needed (task_claims table)
    INSERT INTO public.task_claims (task_id, user_id)
    VALUES (p_task_id, p_user_id)
    ON CONFLICT DO NOTHING;

END;
$$;


-- 2. Submit Task Work (RPC)
CREATE OR REPLACE FUNCTION public.submit_task(p_task_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_status text;
BEGIN
    SELECT status INTO v_task_status 
    FROM public.tasks WHERE id = p_task_id AND assigned_to = p_user_id FOR UPDATE;

    IF v_task_status NOT IN ('assigned', 'correction') THEN
        RAISE EXCEPTION 'Task is not in a submittable state';
    END IF;

    -- Update task status
    UPDATE public.tasks 
    SET status = 'awaiting_review' 
    WHERE id = p_task_id;

    -- Safety Check: Ensure pending balance is updated if missed during assignment
    IF NOT EXISTS (
        SELECT 1 FROM public.transactions 
        WHERE reference_id = p_task_id 
        AND category = 'task_payment' 
        AND user_id = p_user_id
        AND status = 'pending'
    ) THEN
        INSERT INTO public.transactions (user_id, amount, type, description, category, reference_id, status)
        SELECT p_user_id, reward, 'credit', 'Task submitted (pending)', 'task_payment', id, 'pending'
        FROM public.tasks WHERE id = p_task_id;
        
        -- Update wallet pending balance (Ensure wallet exists)
        INSERT INTO public.wallets (user_id, balance_pending)
        SELECT p_user_id, reward FROM public.tasks WHERE id = p_task_id
        ON CONFLICT (user_id) DO UPDATE 
        SET balance_pending = public.wallets.balance_pending + EXCLUDED.balance_pending;
    END IF;

    -- Notification for admin
    -- Assuming a system user or admin role to notify, or just leave it for the dashboard
END;
$$;


-- 3. Approve Task (RPC)
CREATE OR REPLACE FUNCTION public.approve_task(p_task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_reward numeric;
    v_task_status text;
    v_assigned_to uuid;
BEGIN
    SELECT reward, status, assigned_to INTO v_task_reward, v_task_status, v_assigned_to 
    FROM public.tasks WHERE id = p_task_id FOR UPDATE;

    IF v_task_status != 'awaiting_review' THEN
        RAISE EXCEPTION 'Task is not awaiting review';
    END IF;

    -- Update task
    UPDATE public.tasks 
    SET status = 'completed' 
    WHERE id = p_task_id;

    -- Update transaction
    UPDATE public.transactions 
    SET status = 'completed' 
    WHERE reference_id = p_task_id AND category = 'task_payment' AND user_id = v_assigned_to AND status = 'pending';

    -- Update wallet balances (move pending to available)
    UPDATE public.wallets 
    SET balance_pending = GREATEST(0, balance_pending - v_task_reward),
        balance_available = balance_available + v_task_reward 
    WHERE user_id = v_assigned_to;

    -- Create Notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_assigned_to, 'Task Approved', 'Your submission was approved and payment has been released to your available balance.', 'task');

END;
$$;


-- 4. Reject Task (RPC)
CREATE OR REPLACE FUNCTION public.reject_task(p_task_id uuid, p_feedback text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_status text;
    v_assigned_to uuid;
BEGIN
    SELECT status, assigned_to INTO v_task_status, v_assigned_to 
    FROM public.tasks WHERE id = p_task_id FOR UPDATE;

    IF v_task_status != 'awaiting_review' THEN
        RAISE EXCEPTION 'Task is not awaiting review';
    END IF;

    -- Update task (return to correction state and save feedback)
    UPDATE public.tasks 
    SET status = 'correction',
        admin_feedback = p_feedback
    WHERE id = p_task_id;

    -- Get task reward to deduct from pending
    SELECT reward INTO v_task_status FROM public.tasks WHERE id = p_task_id; -- Reusing v_task_status as temp numeric storage
    
    -- Deduct from pending balance
    UPDATE public.wallets 
    SET balance_pending = GREATEST(0, balance_pending - v_task_status::numeric)
    WHERE user_id = v_assigned_to;
    -- Note: If you don't use the submissions table actively, we'll store feedback via a generic notification.

    -- Create Notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_assigned_to, 'Task Revision Required', p_feedback, 'warning');

END;
$$;


-- 5. Cancel Task (RPC)
CREATE OR REPLACE FUNCTION public.cancel_task(p_task_id uuid, p_feedback text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_reward numeric;
    v_task_status text;
    v_assigned_to uuid;
BEGIN
    SELECT reward, status, assigned_to INTO v_task_reward, v_task_status, v_assigned_to 
    FROM public.tasks WHERE id = p_task_id FOR UPDATE;

    IF v_task_status = 'completed' THEN
        RAISE EXCEPTION 'Cannot cancel a completed task';
    END IF;

    -- Update task
    UPDATE public.tasks 
    SET status = 'rejected' 
    WHERE id = p_task_id;

    -- Update transaction (cancel pending payment)
    UPDATE public.transactions 
    SET status = 'failed' 
    WHERE reference_id = p_task_id AND category = 'task_payment' AND user_id = v_assigned_to AND status = 'pending';

    -- Remove from wallet pending
    UPDATE public.wallets 
    SET balance_pending = GREATEST(0, balance_pending - v_task_reward)
    WHERE user_id = v_assigned_to;

    -- Create Notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_assigned_to, 'Task Terminated', 'Your assignment has been cancelled: ' || p_feedback, 'system');

END;
$$;


-- 6. Request Withdrawal (RPC)
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_method text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available numeric;
    v_withdrawal_id uuid;
BEGIN
    SELECT balance_available INTO v_available 
    FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

    IF v_available < p_amount THEN
        RAISE EXCEPTION 'Insufficient cleared balance';
    END IF;

    IF p_amount < 10 THEN
        RAISE EXCEPTION 'Minimum withdrawal is $10.00';
    END IF;

    -- Deduct immediately
    UPDATE public.wallets 
    SET balance_available = balance_available - p_amount 
    WHERE user_id = p_user_id;

    -- Create withdrawal record
    INSERT INTO public.withdrawals (user_id, amount, method, status)
    VALUES (p_user_id, p_amount, p_method, 'pending')
    RETURNING id INTO v_withdrawal_id;

    -- Create transaction
    INSERT INTO public.transactions (user_id, amount, type, description, category, reference_id, status)
    VALUES (p_user_id, p_amount, 'debit', 'Withdrawal request', 'withdrawal', v_withdrawal_id, 'pending');

    -- Notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (p_user_id, 'Withdrawal Requested', 'Your withdrawal of $' || p_amount || ' has been received.', 'payout');

END;
$$;


-- 7. Process Withdrawal (RPC)
CREATE OR REPLACE FUNCTION public.process_withdrawal(p_withdrawal_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_amount numeric;
    v_current_status text;
BEGIN
    SELECT user_id, amount, status INTO v_user_id, v_amount, v_current_status 
    FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;

    IF v_current_status != 'pending' THEN
        RAISE EXCEPTION 'Withdrawal is not pending';
    END IF;

    -- Update withdrawal
    UPDATE public.withdrawals 
    SET status = p_status, processed_at = now() 
    WHERE id = p_withdrawal_id;

    -- Update transaction
    UPDATE public.transactions 
    SET status = p_status 
    WHERE reference_id = p_withdrawal_id AND category = 'withdrawal';

    IF p_status = 'completed' THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (v_user_id, 'Withdrawal Approved', 'Your withdrawal of $' || v_amount || ' has been processed.', 'payout');
    ELSIF p_status = 'failed' THEN
        -- Refund balance
        UPDATE public.wallets 
        SET balance_available = balance_available + v_amount 
        WHERE user_id = v_user_id;

        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (v_user_id, 'Withdrawal Declined', 'Your withdrawal of $' || v_amount || ' was rejected. Funds returned to balance.', 'warning');
    END IF;

END;
$$;

-- ==========================================
-- 8. NOTIFICATION TRIGGERS
-- ==========================================

-- Trigger for message notifications
CREATE OR REPLACE FUNCTION public.handle_message_notification()
RETURNS trigger AS $$
DECLARE
    v_recipient_id uuid;
    v_sender_name text;
BEGIN
    -- Find the other participant in the conversation
    SELECT user_id INTO v_recipient_id
    FROM public.conversation_participants
    WHERE conversation_id = new.conversation_id
      AND user_id != new.sender_id
    LIMIT 1;

    -- Get sender name
    SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = new.sender_id;

    IF v_recipient_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, reference_id)
        VALUES (
            v_recipient_id, 
            'New Message', 
            COALESCE(v_sender_name, 'Someone') || ': ' || LEFT(new.message, 50), 
            'system',
            new.id
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_sent ON public.messages;
CREATE TRIGGER on_message_sent
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_message_notification();

-- Trigger for new task notifications
CREATE OR REPLACE FUNCTION public.handle_new_task_notification()
RETURNS trigger AS $$
BEGIN
    -- Only notify for newly opened tasks
    IF new.status = 'open' THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        SELECT id, 'New Task Available', 'A new project "' || new.title || '" has been posted. Claim it now!', 'task'
        FROM public.profiles
        WHERE role = 'tasker' AND status = 'approved';
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_task_created ON public.tasks;
CREATE TRIGGER on_new_task_created
    AFTER INSERT ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_task_notification();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);

-- 9. Broadcast Notification (RPC)
CREATE OR REPLACE FUNCTION public.broadcast_notification(p_title text, p_message text, p_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT id, p_title, p_message, p_type
    FROM public.profiles;
END;
$$;
-- 10. Get Taskers with Stats (RPC)
CREATE OR REPLACE FUNCTION public.get_taskers_with_stats(p_filter text)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    status text,
    created_at timestamptz,
    claimed_count bigint,
    completed_count bigint,
    canceled_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        u.email::text,
        p.status,
        p.created_at,
        (SELECT COUNT(*) FROM public.tasks t WHERE t.assigned_to = p.id AND t.status = 'assigned') as claimed_count,
        (SELECT COUNT(*) FROM public.tasks t WHERE t.assigned_to = p.id AND t.status = 'completed') as completed_count,
        (SELECT COUNT(*) FROM public.tasks t WHERE t.assigned_to = p.id AND t.status = 'rejected') as canceled_count
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.role = 'tasker'
      AND (
          p_filter = 'all' OR 
          (p_filter = 'approved' AND p.status = 'approved') OR
          (p_filter = 'pending' AND p.status = 'pending')
      )
    ORDER BY p.created_at DESC;
END;
$$;
