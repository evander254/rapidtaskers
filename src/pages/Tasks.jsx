import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { Clock, DollarSign, Search, RefreshCcw, Zap, Gavel, Calendar, ArrowRight, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

function Tasks() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskBids, setSelectedTaskBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [bidAmount, setBidAmount] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { 
    fetchTasks(); 
    
    // Live System: Real-time updates for tasks
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new, ...prev]);
          toast.success('New Task Available', 'A new project has just been posted.');
        } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          fetchTasks(); // Refresh list to reflect changes in status or deletions
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    // Fetch tasks with bid counts
    const { data, error } = await supabase
      .from('tasks')
      .select('*, bids(count)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error(error.message, 'Connection Error');
    } else if (data) {
      // Map counts to a simpler property name
      setTasks(data.map(t => ({ ...t, bidCount: t.bids?.[0]?.count || 0 })));
    }
    setLoading(false);
  };

  const fetchTaskBids = async (taskId) => {
    setLoadingBids(true);
    const { data, error } = await supabase
      .from('bids')
      .select('*, profiles(full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    
    if (error) toast.error(error.message, 'Bid Sync Error');
    else setSelectedTaskBids(data || []);
    setLoadingBids(false);
  };

  useEffect(() => {
    if (selectedTask && selectedTask.task_type === 'bid') {
      fetchTaskBids(selectedTask.id);
    } else {
      setSelectedTaskBids([]);
    }
  }, [selectedTask]);

  const claimAutoTask = async (taskId) => {
    if (profile?.status !== 'approved') {
      toast.error('Authorization Required', 'Your account must be approved before accepting projects.');
      return;
    }
    const { error } = await supabase.rpc('accept_task', {
      p_task_id: taskId,
      p_user_id: profile.id
    });
    if (error) {
      toast.error(error.message, 'Protocol Denial');
    } else {
      toast.success('Project Accepted', 'The task has been added to your workspace.');
      setSelectedTask(null);
      fetchTasks();
    }
  };

  const submitBid = async (taskId) => {
    if (profile?.status !== 'approved') {
      toast.error('Authorization Required', 'Your account must be approved before submitting proposals.');
      return;
    }
    const amount = parseFloat(bidAmount[taskId]);
    if (!amount || amount <= 0) { toast.warning('Invalid Bid', 'Specify a valid asset amount.'); return; }
    const { error } = await supabase.from('bids').insert({
      task_id: taskId, user_id: profile.id, bid_amount: amount, message: 'Institutional quality delivery guaranteed.'
    });
    if (error) toast.error(error.message, 'Bid Rejected');
    else { 
      toast.success('Proposal Sent', 'Your bid has been submitted for review.'); 
      setBidAmount(prev => ({...prev, [taskId]: ''}));
      setSelectedTask(null);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filterType === 'all' || t.task_type === filterType;
    const matchesSearch = (t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
                         (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Available Tasks</h1>
          <p className="text-gray-500 mt-1">Browse and accept projects from top clients in real-time.</p>
        </div>
        <Button 
          onClick={fetchTasks} 
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCcw size={16} className={`${loading ? 'animate-spin' : ''}`} /> 
          Refresh List
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-2 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search active protocols..." 
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none text-gray-900 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="md:w-48 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none text-gray-900 dark:text-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Projects</option>
            <option value="auto">Instant Hire</option>
            <option value="bid">Bidding Projects</option>
          </select>
          <div className="bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 font-medium text-sm px-6 py-3 rounded-xl flex items-center justify-center whitespace-nowrap hidden sm:flex">
            {filteredTasks.length} Available
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {loading && tasks.length === 0 ? (
          [1, 2, 3, 4].map(i => (
            <Card key={i} className="h-32 animate-pulse flex items-center justify-center border-dashed">
               <Zap className="text-gray-300 dark:text-gray-700" size={32} />
            </Card>
          ))
        ) : filteredTasks.length === 0 ? (
          <Card className="text-center py-20 border-dashed">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4">
              <Search size={32} />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-lg">No assignments match your authorization.</p>
            <p className="text-gray-500 mt-1">Try adjusting your filters or search query.</p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-indigo-500/30 transition-colors group cursor-pointer" onClick={() => setSelectedTask(task)}>
              <div className="flex items-start gap-5 flex-1 min-w-0">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  task.task_type === 'auto' 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900'
                }`}>
                  {task.task_type === 'auto' ? <Zap size={24} /> : <Gavel size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={task.task_type === 'auto' ? 'success' : 'primary'}>
                      {task.task_type === 'auto' ? 'Instant Hire' : 'Open for Bids'}
                    </Badge>
                    {task.reward > 50 && (
                      <Badge variant="warning">
                        High Priority
                      </Badge>
                    )}
                    <Badge variant="ghost" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                      {task.category || 'General'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {task.complexity || 'Intermediate'}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-1 mb-4">{task.description}</p>
                  
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <Clock size={14} className="text-indigo-600 dark:text-indigo-400" /> {task.time_limit}m Window
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" /> Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </span>
                    {task.task_type === 'bid' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                        <Gavel size={12} /> {task.bidCount || 0} Bids Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-auto shrink-0 border-t lg:border-t-0 border-gray-200 dark:border-gray-800 pt-6 lg:pt-0 mt-2 lg:mt-0" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-end gap-3">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500 flex items-center gap-1 mb-1">
                    <DollarSign size={20} />
                    ${task.reward.toFixed(2)}
                  </div>
                  <Button 
                    onClick={() => setSelectedTask(task)}
                    className={`w-full lg:w-48 flex items-center justify-center gap-2 ${task.task_type === 'auto' ? 'bg-indigo-600' : 'bg-gray-900'}`}
                  >
                    {task.task_type === 'auto' ? (
                      <><Zap size={18} /> Review & Accept</>
                    ) : (
                      <><Gavel size={18} /> Review & Bid</>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Task Details Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Project Brief & Authorization"
        maxWidth="max-w-2xl"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={selectedTask.task_type === 'auto' ? 'success' : 'primary'}>
                  {selectedTask.task_type === 'auto' ? 'Instant Hire' : 'Bidding System'}
                </Badge>
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                  ID: #{selectedTask.id.slice(0, 8)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="primary" className="bg-indigo-600 text-white border-none">
                  {selectedTask.category || 'General'}
                </Badge>
                <Badge variant="outline">
                  {selectedTask.complexity || 'Intermediate'}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{selectedTask.title}</h2>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Asset Yield</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-500 flex items-center gap-1">
                    <DollarSign size={18} /> ${selectedTask.reward.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Execution Window</p>
                  <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-1.5">
                    <Clock size={16} className="text-indigo-600 dark:text-indigo-400" /> {selectedTask.time_limit} Minutes
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Termination</p>
                  <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-1.5">
                    <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" /> {new Date(selectedTask.deadline).toLocaleDateString()}
                  </p>
                </div>
                {selectedTask.task_type === 'bid' && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Competition</p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5">
                      <Gavel size={16} /> {selectedTask.bidCount || 0} Proposals
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider text-xs opacity-70">
                  Detailed Instructions & Scope
                </h4>
                <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                  {selectedTask.description.split('Deliverables:')[0]}
                </div>
                
                {selectedTask.description.includes('Deliverables:') && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider opacity-80">
                      Deliverables / Items
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedTask.description.split('Deliverables:')[1].trim().split('\n').map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                          <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item.replace('• ', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              {selectedTask.task_type === 'auto' ? (
                <div className="flex flex-col gap-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      <strong>Deployment Notice:</strong> By accepting this project, you commit to delivery within the {selectedTask.time_limit} minute execution window. Late submissions may result in asset forfeiture.
                    </p>
                  </div>
                  <Button 
                    onClick={() => claimAutoTask(selectedTask.id)} 
                    className="w-full py-4 text-lg flex items-center justify-center gap-2"
                  >
                    Accept Project <ArrowRight size={20} />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current Bids List */}
                  <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider opacity-70 mb-4">
                      Active Proposals ({selectedTaskBids.length})
                    </h4>
                    
                    {loadingBids ? (
                      <div className="flex flex-col items-center py-4 gap-2">
                        <div className="w-5 h-5 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] text-gray-500 font-medium uppercase">Syncing Bids...</p>
                      </div>
                    ) : selectedTaskBids.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4 italic">No bids submitted yet. Be the first!</p>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pr-2">
                        {selectedTaskBids.map((bid, idx) => (
                          <div key={bid.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-right-2" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                {bid.profiles?.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{bid.profiles?.full_name}</span>
                            </div>
                            <span className="text-sm font-bold text-green-600 dark:text-green-500">${bid.bid_amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-3 font-medium uppercase">Your Proposal</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <DollarSign size={18} />
                        </div>
                        <input 
                          type="number" 
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white" 
                          placeholder="Your Bid Amount" 
                          value={bidAmount[selectedTask.id] || ''} 
                          onChange={e => setBidAmount(prev => ({...prev, [selectedTask.id]: e.target.value}))} 
                        />
                      </div>
                      <Button 
                        onClick={() => submitBid(selectedTask.id)} 
                        className="px-8"
                      >
                        Submit Bid
                      </Button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">Maximum Authorization: ${selectedTask.reward.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Tasks;
