import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import {
  Users, PlusCircle, CreditCard, CheckCircle, XCircle,
  UserCheck, History, ArrowRight, Zap, Gavel, DollarSign, Clock,
  LayoutDashboard, Activity, FileText, AlertCircle, MessageSquare,
  Bell, Settings, List, UserPlus, Send, Plus, Inbox, Shield, Globe, Lock, MoreHorizontal
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

function AdminPanel() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const filter = searchParams.get('filter') || 'all';

  const setTab = (newTab, newFilter = null) => {
    const params = { tab: newTab };
    if (newFilter) params.filter = newFilter;
    setSearchParams(params);
  };

  const [taskers, setTaskers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState(new Set());
  const [withdrawals, setWithdrawals] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '', description: '', type: 'auto',
    reward: 5, deadline: '', time_limit: 60,
    category: 'Writing', complexity: 'Intermediate',
    items: []
  });
  const [currentItem, setCurrentItem] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [adminTasks, setAdminTasks] = useState([]);
  const [selectedTaskBids, setSelectedTaskBids] = useState(null);
  const [loadingBids, setLoadingBids] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState({ taskers: 0, totalTasks: 0, assignedTasks: 0 });
  const [broadcast, setBroadcast] = useState({ title: '', message: '', type: 'system' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true);
      if (tab === 'overview') await fetchOverviewStats();
      if (tab === 'users_all') {
        await fetchAllTaskers();
        await fetchSuspiciousLogins();
      }
      if (tab === 'users_approved') {
        await fetchApprovedTaskers();
        await fetchSuspiciousLogins();
      }
      if (tab === 'users_pending') {
        await fetchPendingUsers();
        await fetchSuspiciousLogins();
      }
      if (tab === 'withdrawals') await fetchPendingWithdrawals();
      if (tab === 'management' || tab === 'tasks') await fetchAdminTasks();
      if (tab === 'notifications_all') await fetchAllNotifications();

      // Auto-redirect parent tabs to default sub-tabs
      if (tab === 'notifications') setTab('notifications_all');
      if (tab === 'messages') setTab('messages_inbox');
      if (tab === 'settings') setTab('settings_admin');

      setIsInitialLoading(false);
    };
    loadData();
  }, [tab]);

  const fetchOverviewStats = async () => {
    try {
      // Fetch taskers count
      const { count: taskerCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'tasker');

      // Fetch total tasks count
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      // Fetch assigned/completed tasks count
      const { count: assignedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'completed', 'correction', 'awaiting_review']);

      setOverviewStats({
        taskers: taskerCount || 0,
        totalTasks: totalTasks || 0,
        assignedTasks: assignedTasks || 0
      });
    } catch (err) {
      console.error('Error fetching overview stats:', err);
    }
  };

  const fetchAdminTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles:assigned_to(full_name)')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback if aliased join fails
        const { data: fallbackData } = await supabase
          .from('tasks')
          .select('*, bids(count)')
          .order('created_at', { ascending: false });
        setAdminTasks(fallbackData || []);
      } else {
        // Get bid counts manually if join is complex
        const { data: counts } = await supabase.from('bids').select('task_id');
        const countMap = (counts || []).reduce((acc, b) => {
          acc[b.task_id] = (acc[b.task_id] || 0) + 1;
          return acc;
        }, {});

        setAdminTasks(data.map(t => ({ ...t, bidCount: countMap[t.id] || 0 })));
      }
    } catch (err) {
      console.error('Error fetching admin tasks:', err);
    }
  };

  const fetchTaskBids = async (taskId) => {
    setLoadingBids(true);
    const { data } = await supabase
      .from('bids')
      .select('*, profiles(full_name)')
      .eq('task_id', taskId);
    setSelectedTaskBids({ taskId, bids: data || [] });
    setLoadingBids(false);
  };

  const fetchTaskersWithStats = async (query) => {
    try {
      const { data: profiles, error: profileError } = await query;
      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        setTaskers([]);
        return;
      }

      const profileIds = profiles.map(p => p.id);

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('assigned_to, status')
        .in('assigned_to', profileIds);

      if (tasksError) throw tasksError;

      const taskMap = {};
      (tasks || []).forEach(t => {
        if (!taskMap[t.assigned_to]) {
          taskMap[t.assigned_to] = { claimed: 0, completed: 0, canceled: 0 };
        }
        if (t.status === 'assigned') taskMap[t.assigned_to].claimed++;
        if (t.status === 'completed') taskMap[t.assigned_to].completed++;
        if (t.status === 'rejected') taskMap[t.assigned_to].canceled++;
      });

      const processed = profiles.map(p => ({
        ...p,
        claimed_count: taskMap[p.id]?.claimed || 0,
        completed_count: taskMap[p.id]?.completed || 0,
        canceled_count: taskMap[p.id]?.canceled || 0
      }));

      setTaskers(processed);
    } catch (err) {
      console.error('Error fetching taskers:', err);
      toast.error('Could not load tasker data.', 'Error');
    }
  };

  const fetchAllTaskers = () => fetchTaskersWithStats(
    supabase.from('profiles').select('*').eq('role', 'tasker').order('created_at', { ascending: false })
  );

  const fetchApprovedTaskers = () => fetchTaskersWithStats(
    supabase.from('profiles').select('*').eq('role', 'tasker').eq('status', 'approved').order('created_at', { ascending: false })
  );

  const fetchPendingUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending');
    if (data) setPendingUsers(data);
  };

  const fetchSuspiciousLogins = async () => {
    const { data } = await supabase.from('login_logs').select('user_id, device_fingerprint');
    if (!data) return;

    const fpMap = {};
    data.forEach(log => {
      if (!log.device_fingerprint) return;
      if (!fpMap[log.device_fingerprint]) fpMap[log.device_fingerprint] = new Set();
      fpMap[log.device_fingerprint].add(log.user_id);
    });

    const suspiciousIds = new Set();
    Object.values(fpMap).forEach(users => {
      if (users.size > 1) {
        users.forEach(id => suspiciousIds.add(id));
      }
    });
    setSuspiciousUsers(suspiciousIds);
  };

  const fetchPendingWithdrawals = async () => {
    const { data } = await supabase.from('withdrawals').select('*, profiles(full_name)').eq('status', 'pending');
    if (data) setWithdrawals(data);
  };

  const updateUserStatus = async (id, status) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) toast.error(error.message, 'Update Failed');
    else {
      toast.success(`User has been ${status}.`, 'Success');
      if (tab === 'users_pending') fetchPendingUsers();
      if (tab === 'users_all') fetchAllTaskers();
      if (tab === 'users_approved') fetchApprovedTaskers();
    }
  };

  const processWithdrawal = async (txId, status) => {
    try {
      const { error } = await supabase.rpc('process_withdrawal', {
        p_withdrawal_id: txId,
        p_status: status
      });
      if (error) throw error;
      toast.success(`Withdrawal ${status}.`, 'Success');
      fetchPendingWithdrawals();
    } catch (err) {
      toast.error('Could not process withdrawal.', 'Error');
    }
  };

  const handleApproveTask = async (task) => {
    try {
      const { error } = await supabase.rpc('approve_task', { p_task_id: task.id });
      if (error) throw error;
      toast.success('Task approved and payment released.', 'Success');
      fetchAdminTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to approve Task.', 'Error');
    }
  };

  const handleRejectTask = async (task) => {
    const feedback = window.prompt("Please provide feedback for the required revision:");
    if (!feedback) return; // Cancelled

    try {
      const { error } = await supabase.rpc('reject_task', {
        p_task_id: task.id,
        p_feedback: feedback
      });
      if (error) throw error;
      toast.success('Task sent back for revision.', 'Revision Requested');
      fetchAdminTasks();
    } catch (err) {
      toast.error('Failed to update Task status.', 'Error');
    }
  };
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to terminate this task? This action is irreversible.')) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      toast.success('Task terminated successfully.', 'Success');
      fetchAdminTasks();
    } catch (err) {
      toast.error('Failed to terminate task.', 'Error');
    }
  };

  const handleAcceptBid = async (bidId, taskId, userId) => {
    try {
      // 1. Accept the bid
      await supabase.from('bids').update({ status: 'accepted' }).eq('id', bidId);
      // 2. Reject other bids
      await supabase.from('bids').update({ status: 'rejected' }).eq('task_id', taskId).neq('id', bidId);
      // 3. Assign task
      await supabase.from('tasks').update({
        assigned_to: userId,
        status: 'assigned'
      }).eq('id', taskId);

      toast.success('Bid accepted and task assigned.', 'Success');
      fetchAdminTasks();
      setSelectedTaskBids(null);
    } catch (err) {
      toast.error('Failed to accept bid.', 'Error');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!profile) return toast.error('You must be logged in to post tasks.', 'Auth Required');

    setIsPosting(true);
    try {
      const itemsList = newTask.items.length > 0 ? `\n\nDeliverables:\n${newTask.items.map(i => `• ${i}`).join('\n')}` : '';
      const formattedDescription = `Category: ${newTask.category}\nComplexity: ${newTask.complexity}\n\n${newTask.description}${itemsList}`;

      const { error } = await supabase.from('tasks').insert({
        title: newTask.title,
        description: formattedDescription,
        task_type: newTask.type,
        reward: parseFloat(newTask.reward),
        deadline: newTask.deadline ? new Date(newTask.deadline).toISOString() : null,
        time_limit: parseInt(newTask.time_limit),
        status: 'open',
        user_id: profile.id
      });

      if (error) throw error;

      toast.success('Task posted successfully.', 'Success');
      setNewTask({ title: '', description: '', type: 'auto', reward: 5, deadline: '', time_limit: 60, category: 'Writing', complexity: 'Intermediate', items: [] });
      fetchAdminTasks();
    } catch (err) {
      toast.error(err.message, 'Creation Failed');
    } finally {
      setIsPosting(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title || !broadcast.message) return toast.error('Please fill all fields', 'Validation Error');

    setIsBroadcasting(true);
    try {
      const { error } = await supabase.rpc('broadcast_notification', {
        p_title: broadcast.title,
        p_message: broadcast.message,
        p_type: broadcast.type
      });
      if (error) throw error;
      toast.success('Broadcast sent to all users.', 'Success');
      setBroadcast({ title: '', message: '', type: 'system' });
      if (tab === 'notifications_all') fetchAllNotifications();
    } catch (err) {
      toast.error(err.message, 'Broadcast Failed');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const fetchAllNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setAllNotifications(data);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'users_all', label: 'Freelancers', icon: <Users size={16} /> },
    { id: 'tasks', label: 'Post Task', icon: <PlusCircle size={16} /> },
    { id: 'management', label: 'Tasks', icon: <Zap size={16} /> },
    { id: 'withdrawals', label: 'Payouts', icon: <CreditCard size={16} /> },
  ];

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
          {tab === 'tasks' ? 'Post New Task' :
            tab === 'management' ? (
              filter === 'claimed' ? 'Claimed Tasks' :
                filter === 'correction' ? 'Correction Tasks' :
                  filter === 'submitted' ? 'Submitted Tasks' :
                    filter === 'completed' ? 'Completed Tasks' :
                      'Task Management'
            ) :
              tab === 'users_all' ? 'All Registered Taskers' :
                tab === 'users_approved' ? 'Approved Taskers' :
                  tab === 'users_pending' ? 'Pending Applications' :
                    tab === 'withdrawals' ? 'Payout Management' :
                      tab === 'overview' ? 'Admin Overview' :
                        'Client Dashboard'}
        </h1>
        <p className="text-gray-500 mt-1">
          {tab === 'management' && filter !== 'all'
            ? `Dedicated view for ${filter.replace('_', ' ')} tasks and claimer details.`
            : 'Manage freelancer applications, post tasks, and process payments.'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar pb-px">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`
              flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm border-b-2
              ${tab === t.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-l-4 border-l-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Taskers</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overviewStats.taskers}</h3>
                </div>
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">Registered platform workers</span>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-emerald-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overviewStats.totalTasks}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileText size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">All tasks created</span>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active / Assigned</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overviewStats.assignedTasks}</h3>
                </div>
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Activity size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">Tasks currently being worked on</span>
              </div>
            </Card>
          </div>

          <Card className="p-8 mt-6 border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
                <LayoutDashboard size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Platform Administration</h3>
              <p className="text-gray-500 mt-2 max-w-lg">
                Use the navigation tabs above to manage freelancers, post new tasks, review deliverables, and process payments.
              </p>
              <div className="flex gap-4 mt-8">
                <Button onClick={() => setTab('users_all')} variant="outline" className="flex items-center gap-2">
                  Review Freelancers
                </Button>
                <Button onClick={() => setTab('tasks')} className="flex items-center gap-2">
                  <PlusCircle size={18} /> Post New Task
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Taskers List (All & Approved) */}
      {(tab === 'users_all' || tab === 'users_approved') && (
        <div className="space-y-6">
          {taskers.length === 0 ? (
            <Card className="text-center py-20 border-dashed">
              <UserCheck size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-900 dark:text-white font-semibold text-lg">
                No taskers found for this view.
              </p>
              <p className="text-gray-500 mt-1">
                There are currently no users matching this criteria.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {taskers.map((user) => (
                <Card key={user.id} className="p-6 flex flex-col gap-5 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl shadow-sm border border-indigo-100/50 dark:border-indigo-800/30">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                          {user.full_name}
                          {suspiciousUsers.has(user.id) && (
                            <Badge variant="danger" className="text-[9px] py-0 px-1.5 flex items-center gap-1" title="Multiple accounts detected on same device">
                              <AlertCircle size={10} /> Suspicious
                            </Badge>
                          )}
                        </h4>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">ID: {user.id.substring(0, 8)}...</p>
                          <p className="text-[11px] text-gray-500">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant={user.status === 'approved' ? 'primary' : user.status === 'pending' ? 'warning' : 'outline'} className="capitalize">
                      {user.status}
                    </Badge>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 dark:border-gray-800">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Claimed</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{user.claimed_count || 0}</p>
                    </div>
                    <div className="text-center border-x border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Done</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-500">{user.completed_count || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Fails</p>
                      <p className="text-lg font-bold text-red-500">{user.canceled_count || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/messages?userId=${user.id}`)}
                      className="px-3"
                      title="Send Message"
                    >
                      <MessageSquare size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      wFull
                      onClick={() => navigate(`/admin?tab=management&assigned_to=${user.id}`)}
                      className="text-xs"
                    >
                      Track Activity
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Applications Tab */}
      {tab === 'users_pending' && (
        <div className="space-y-6">
          {pendingUsers.length === 0 ? (
            <Card className="text-center py-20 border-dashed">
              <UserCheck size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-900 dark:text-white font-semibold text-lg">No pending freelancer applications.</p>
              <p className="text-gray-500 mt-1">All requests have been processed.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingUsers.map((user) => (
                <Card key={user.id} className="p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-900 dark:text-white font-bold text-xl">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                        {user.full_name}
                        {suspiciousUsers.has(user.id) && (
                          <Badge variant="danger" className="text-[10px] py-0 px-1.5 flex items-center gap-1" title="Multiple accounts detected on same device">
                            <AlertCircle size={10} /> Suspicious
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/messages?userId=${user.id}`)}
                      className="px-3"
                    >
                      <MessageSquare size={16} />
                    </Button>
                    <Button variant="outline" onClick={() => updateUserStatus(user.id, 'rejected')} className="flex-1 text-red-600 hover:text-red-700 dark:text-red-400">
                      Decline
                    </Button>
                    <Button onClick={() => updateUserStatus(user.id, 'approved')} className="flex-1">
                      Approve
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="max-w-3xl">
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Post a New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                  placeholder="e.g., SEO Article Writing for Tech Blog"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Description</label>
                <textarea
                  className="w-full min-h-[120px] px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white resize-y"
                  placeholder="Describe the requirements and expectations for this Task..."
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Category</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                  >
                    <option value="Writing">Content Writing</option>
                    <option value="Design">Graphic Design</option>
                    <option value="Dev">Development</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Data">Data Entry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Complexity Level</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                    value={newTask.complexity}
                    onChange={e => setNewTask({ ...newTask, complexity: e.target.value })}
                  >
                    <option value="Entry">Entry Level</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert / Pro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Protocol Type</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                    value={newTask.type}
                    onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                  >
                    <option value="auto">Instant Hire</option>
                    <option value="bid">Bidding System</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset Yield ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <DollarSign size={18} />
                    </div>
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                      step="0.01"
                      value={newTask.reward}
                      onChange={e => setNewTask({ ...newTask, reward: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Deliverables / Items</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                    placeholder="Add a requirement or item..."
                    value={currentItem}
                    onChange={e => setCurrentItem(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (currentItem.trim()) {
                          setNewTask({ ...newTask, items: [...newTask.items, currentItem.trim()] });
                          setCurrentItem('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (currentItem.trim()) {
                        setNewTask({ ...newTask, items: [...newTask.items, currentItem.trim()] });
                        setCurrentItem('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {newTask.items.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {newTask.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm group border border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <CheckCircle size={14} className="text-green-500" /> {item}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewTask({ ...newTask, items: newTask.items.filter((_, i) => i !== idx) })}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Termination Deadline</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Gavel size={18} />
                    </div>
                    <input
                      type="datetime-local"
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                      value={newTask.deadline}
                      onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Execution Window (min)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Clock size={18} />
                    </div>
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                      value={newTask.time_limit}
                      onChange={e => setNewTask({ ...newTask, time_limit: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" wFull disabled={isPosting} className="flex items-center justify-center gap-2">
                  {isPosting ? 'Posting...' : 'Post Task'} <ArrowRight size={18} />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Management Tab */}
      {tab === 'management' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {(() => {
              const filteredTasks = adminTasks.filter(task => {
                if (filter === 'all') return true;
                if (filter === 'claimed') return task.status === 'assigned';
                if (filter === 'correction') return task.status === 'correction';
                if (filter === 'submitted') return task.status === 'awaiting_review';
                if (filter === 'completed') return task.status === 'completed';
                return true;
              });

              if (filteredTasks.length === 0) {
                return (
                  <Card className="text-center py-20 border-dashed">
                    <Zap size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-900 dark:text-white font-semibold text-lg">
                      No {filter !== 'all' ? filter : ''} tasks found.
                    </p>
                    <p className="text-gray-500 mt-1">
                      {filter === 'all' ? 'Start by posting your first task.' : `There are currently no tasks with ${filter} status.`}
                    </p>
                  </Card>
                );
              }

              return filteredTasks.map((task) => (
                <div key={task.id} className="space-y-4">
                  <Card className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                          <Badge variant={task.status === 'open' ? 'primary' : 'outline'}>
                            {task.status.toUpperCase()}
                          </Badge>
                          <Badge variant="ghost" className="bg-gray-100 dark:bg-gray-800">
                            {task.task_type === 'auto' ? 'Instant' : 'Bidding'}
                          </Badge>
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-1">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">${task.reward}</div>
                          <div className="text-xs text-gray-500">Yield</div>
                        </div>
                        {task.task_type === 'bid' && task.status === 'open' && (
                          <Button
                            variant={task.bidCount > 0 ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => fetchTaskBids(task.id)}
                            className="relative"
                          >
                            View Proposals
                            {task.bidCount > 0 && (
                              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 font-bold animate-bounce">
                                {task.bidCount}
                              </span>
                            )}
                          </Button>
                        )}
                        {task.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 border-red-200 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        )}
                        {task.status === 'awaiting_review' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectTask(task)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              Revision
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveTask(task)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve & Pay
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {task.assigned_to && (
                      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shadow-sm">
                              {task.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{task.profiles?.full_name || 'Freelancer'}</span>
                                <Badge variant="ghost" className="text-[10px] py-0 px-1.5 bg-gray-100 dark:bg-gray-800">
                                  Claimer
                                </Badge>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5">Task State: <span className="capitalize font-medium text-indigo-600 dark:text-indigo-400">{task.status.replace('_', ' ')}</span></p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/messages?userId=${task.assigned_to}`)}
                              className="flex items-center gap-1.5 text-xs py-1.5 h-auto"
                            >
                              <MessageSquare size={14} />
                              Contact Claimer
                            </Button>
                            {(filter === 'claimed' || filter === 'correction') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin?tab=users&filter=all&id=${task.assigned_to}`)}
                                className="text-xs py-1.5 h-auto text-gray-500 hover:text-indigo-600"
                              >
                                View Profile
                              </Button>
                            )}
                          </div>
                        </div>

                        {task.admin_feedback && task.status === 'correction' && (
                          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                              <AlertCircle size={12} /> Active Revision Request
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 italic">"{task.admin_feedback}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bids List */}
                    {selectedTaskBids?.taskId === task.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Active Bids</h4>
                          <button onClick={() => setSelectedTaskBids(null)} className="text-gray-400 hover:text-gray-600">
                            <XCircle size={18} />
                          </button>
                        </div>
                        {loadingBids ? (
                          <div className="text-center py-4 text-gray-500">Loading bids...</div>
                        ) : selectedTaskBids.bids.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">No bids submitted yet.</div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {selectedTaskBids.bids.map((bid) => (
                              <div key={bid.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 flex justify-between items-center gap-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-white">{bid.profiles?.full_name}</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">${bid.bid_amount}</span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1 truncate">{bid.message}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/messages?userId=${bid.user_id}`)}
                                    className="px-3"
                                  >
                                    <MessageSquare size={14} />
                                  </Button>
                                  <Button size="sm" onClick={() => handleAcceptBid(bid.id, task.id, bid.user_id)}>
                                    Accept
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Withdrawals Tab */}
      {tab === 'withdrawals' && (
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payout Queue</h2>
            <p className="text-gray-500 text-sm mt-1">Review and approve freelancer payout requests.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Operational Agent</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Yield Amount</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Clearance Protocol</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <History size={32} className="text-gray-400" />
                        <span className="text-gray-500 font-medium">No pending settlements in queue.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  withdrawals.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-900 dark:text-white font-bold text-xs shrink-0">
                            {tx.profiles?.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{tx.profiles?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600 dark:text-green-500">${tx.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tx.payout_method || 'Bank Transfer'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => processWithdrawal(tx.id, 'rejected')}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => processWithdrawal(tx.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Messages Section */}
      {tab.startsWith('messages') && (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Communications</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {tab === 'messages_inbox' ? "Your inbox is currently empty. All tasker communications will appear here." : "Start a new conversation with a tasker by selecting their profile."}
          </p>
          <Button className="mt-6" onClick={() => navigate('/messages')}>
            Open Chat Module
          </Button>
        </Card>
      )}

      {/* Notifications Section */}
      {tab.startsWith('notifications') && (
        <div className="space-y-6">
          {tab === 'notifications_create' && (
            <div className="max-w-2xl">
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Broadcast Notification</h3>
                    <p className="text-sm text-gray-500">Send a system-wide alert to all registered users.</p>
                  </div>
                </div>

                <form onSubmit={handleBroadcast} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notification Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      placeholder="e.g., Scheduled Maintenance"
                      value={broadcast.title}
                      onChange={e => setBroadcast({ ...broadcast, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message Content</label>
                    <textarea
                      className="w-full min-h-[100px] px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white resize-y"
                      placeholder="Enter the message you want everyone to see..."
                      value={broadcast.message}
                      onChange={e => setBroadcast({ ...broadcast, message: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alert Type</label>
                    <select
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      value={broadcast.type}
                      onChange={e => setBroadcast({ ...broadcast, type: e.target.value })}
                    >
                      <option value="system">System Info (Blue)</option>
                      <option value="task">Task Alert (Green)</option>
                      <option value="warning">Warning (Yellow/Red)</option>
                      <option value="payout">Financial/Payout (Purple)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" wFull disabled={isBroadcasting} className="flex items-center justify-center gap-2">
                      {isBroadcasting ? 'Broadcasting...' : 'Send Broadcast Now'} <Send size={18} />
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {tab === 'notifications_all' && (
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification History</h2>
                  <p className="text-gray-500 text-sm mt-1">Recently sent system alerts and user notifications.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAllNotifications}>Refresh</Button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {allNotifications.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No notifications found in history.</div>
                ) : (
                  allNotifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{n.title}</span>
                            <Badge variant={n.type === 'warning' ? 'danger' : n.type === 'task' ? 'primary' : 'outline'}>
                              {n.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] text-gray-400">Sent to: <strong>{n.profiles?.full_name || 'System'}</strong></span>
                            <span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        {n.read ? (
                          <Badge variant="ghost" className="text-[10px]">Read</Badge>
                        ) : (
                          <Badge variant="primary" className="text-[10px] animate-pulse">Unread</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Settings Section */}
      {tab.startsWith('settings') && (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/30 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 mx-auto mb-4">
            <Settings size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">System Configuration</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Manage platform rules, security protocols, and administrative access levels.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Button variant="outline">Security Audit</Button>
            <Button>Save Changes</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default AdminPanel;
