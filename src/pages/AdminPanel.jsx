import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { 
  Users, PlusCircle, CreditCard, CheckCircle, XCircle, 
  UserCheck, History, ArrowRight, Zap, Gavel, DollarSign, Clock
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

function AdminPanel() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const [tab, setTab] = useState('users');
  const [pendingUsers, setPendingUsers] = useState([]);
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

  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true);
      if (tab === 'users') await fetchPendingUsers();
      if (tab === 'withdrawals') await fetchPendingWithdrawals();
      if (tab === 'management' || tab === 'tasks') await fetchAdminTasks();
      setIsInitialLoading(false);
    };
    loadData();
  }, [tab]);

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

  const fetchPendingUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending');
    if (data) setPendingUsers(data);
  };

  const fetchPendingWithdrawals = async () => {
    const { data } = await supabase.from('withdrawals').select('*, profiles(full_name)').eq('status', 'pending');
    if (data) setWithdrawals(data);
  };

  const updateUserStatus = async (id, status) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) toast.error(error.message, 'Update Failed');
    else { toast.success(`User has been ${status}.`, 'Success'); fetchPendingUsers(); }
  };

  const processWithdrawal = async (txId, status, userId, amount) => {
    try {
      if (status === 'completed') {
        // Balance already deducted on request in Wallet.jsx (Wait, I'll update Wallet.jsx next)
        // So here we just update the status
      } else if (status === 'failed') {
        // Refund the balance
        const { data: p } = await supabase.from('profiles').select('balance_available').eq('id', userId).single();
        await supabase.from('profiles').update({ balance_available: (p.balance_available || 0) + amount }).eq('id', userId);
      }
      
      await supabase.from('withdrawals').update({ status }).eq('id', txId);
      toast.success(`Withdrawal ${status}.`, 'Success');
      fetchPendingWithdrawals();
    } catch (err) {
      toast.error('Could not process withdrawal.', 'Error');
    }
  };

  const handleApproveTask = async (task) => {
    try {
      // 1. Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', task.id);
      
      if (taskError) throw taskError;

      // 2. Get current balance
      const { data: p, error: pError } = await supabase
        .from('profiles')
        .select('balance_available, balance_pending')
        .eq('id', task.assigned_to)
        .single();
      
      if (pError) throw pError;

      // 3. Update balances (Move from pending to available)
      const { error: balError } = await supabase
        .from('profiles')
        .update({ 
          balance_available: (p.balance_available || 0) + task.reward,
          balance_pending: Math.max(0, (p.balance_pending || 0) - task.reward)
        })
        .eq('id', task.assigned_to);

      if (balError) throw balError;

      toast.success('Project approved and payment released.', 'Success');
      fetchAdminTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to approve project.', 'Error');
    }
  };

  const handleRejectTask = async (task) => {
    try {
      // 1. Update task status to revision
      await supabase.from('tasks').update({ status: 'correction' }).eq('id', task.id);

      // 2. Clear pending balance
      const { data: p } = await supabase.from('profiles').select('balance_pending').eq('id', task.assigned_to).single();
      await supabase.from('profiles').update({ 
        balance_pending: Math.max(0, (p.balance_pending || 0) - task.reward) 
      }).eq('id', task.assigned_to);

      toast.success('Project sent back for revision.', 'Revision Requested');
      fetchAdminTasks();
    } catch (err) {
      toast.error('Failed to update project status.', 'Error');
    }
  };
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to terminate this project? This action is irreversible.')) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      toast.success('Project terminated successfully.', 'Success');
      fetchAdminTasks();
    } catch (err) {
      toast.error('Failed to terminate project.', 'Error');
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

  const tabs = [
    { id: 'users', label: 'Freelancers', icon: <Users size={16} /> },
    { id: 'tasks', label: 'Post Project', icon: <PlusCircle size={16} /> },
    { id: 'management', label: 'Projects', icon: <Zap size={16} /> },
    { id: 'withdrawals', label: 'Payouts', icon: <CreditCard size={16} /> },
  ];

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Synchronizing Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Client Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage freelancer applications, post tasks, and process payments.</p>
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

      {/* Users Tab */}
      {tab === 'users' && (
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
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">{user.full_name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-auto">
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Post a New Project</h2>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Title</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                  placeholder="e.g., SEO Article Writing for Tech Blog"
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Description</label>
                <textarea 
                  className="w-full min-h-[120px] px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white resize-y"
                  placeholder="Describe the requirements and expectations for this project..."
                  value={newTask.description} 
                  onChange={e => setNewTask({...newTask, description: e.target.value})} 
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Category</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                    value={newTask.category} 
                    onChange={e => setNewTask({...newTask, category: e.target.value})}
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
                    onChange={e => setNewTask({...newTask, complexity: e.target.value})}
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
                    onChange={e => setNewTask({...newTask, type: e.target.value})}
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
                      onChange={e => setNewTask({...newTask, reward: parseFloat(e.target.value)})} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Deliverables / Items</label>
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
                          setNewTask({...newTask, items: [...newTask.items, currentItem.trim()]});
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
                        setNewTask({...newTask, items: [...newTask.items, currentItem.trim()]});
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
                          onClick={() => setNewTask({...newTask, items: newTask.items.filter((_, i) => i !== idx)})}
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
                      onChange={e => setNewTask({...newTask, deadline: e.target.value})} 
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
                      onChange={e => setNewTask({...newTask, time_limit: parseInt(e.target.value)})} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" wFull disabled={isPosting} className="flex items-center justify-center gap-2">
                  {isPosting ? 'Posting...' : 'Post Project'} <ArrowRight size={18} />
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
            {adminTasks.length === 0 ? (
              <Card className="text-center py-20 border-dashed">
                <Zap size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-900 dark:text-white font-semibold text-lg">No projects posted yet.</p>
                <p className="text-gray-500 mt-1">Start by posting your first task.</p>
              </Card>
            ) : (
              adminTasks.map((task) => (
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
                      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                        <UserCheck size={14} className="text-indigo-500" />
                        <span>Assigned to: <strong>{task.profiles?.full_name || 'Freelancer'}</strong></span>
                        <span className="mx-2">•</span>
                        <span>Status: <strong className="capitalize">{task.status.replace('_', ' ')}</strong></span>
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
                                <Button size="sm" onClick={() => handleAcceptBid(bid.id, task.id, bid.user_id)}>
                                  Accept
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              ))
            )}
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
                            {tx.profiles?.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{tx.profiles?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600 dark:text-green-500">${tx.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <Badge variant="primary">{tx.method}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => processWithdrawal(tx.id, 'failed', tx.user_id, tx.amount)} 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Decline"
                          >
                            <XCircle size={20} />
                          </button>
                          <button 
                            onClick={() => processWithdrawal(tx.id, 'completed', tx.user_id, tx.amount)} 
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Authorize"
                          >
                            <CheckCircle size={20} />
                          </button>
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
    </div>
  );
}

export default AdminPanel;
