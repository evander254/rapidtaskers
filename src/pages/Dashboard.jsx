import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../services/supabase';
import { 
  Wallet, Clock, ArrowRight, TrendingUp,
  DollarSign, Zap, Star, Activity, Layers, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

function Trophy(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  );
}

function Dashboard() {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState({ completed: 0, ongoing: 0, level: 'Bronze', totalEarned: 0 });
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (profile?.id) fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { count: completedCount } = await supabase
      .from('tasks').select('*', { count: 'exact', head: true })
      .eq('assigned_to', profile.id).eq('status', 'completed');

    const { count: ongoingCount } = await supabase
      .from('tasks').select('*', { count: 'exact', head: true })
      .eq('assigned_to', profile.id)
      .or('status.eq.assigned,status.eq.correction');

    const { data: tasks } = await supabase
      .from('tasks').select('*').eq('status', 'open')
      .order('created_at', { ascending: false }).limit(4);

    let level = 'Bronze';
    if (completedCount >= 50) level = 'Gold';
    else if (completedCount >= 10) level = 'Silver';

    setStats({
      completed: completedCount || 0,
      ongoing: ongoingCount || 0,
      level,
      totalEarned: (profile.balance_available || 0) + (profile.balance_pending || 0)
    });
    if (tasks) setAvailableTasks(tasks);
    setLoading(false);
  };

  if (loading && !profile) return (
    <div className="space-y-6 animate-pulse pb-12">
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Pending Status Alert */}
      {profile?.status === 'pending' && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 flex items-center gap-3">
          <Shield className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold text-amber-900 dark:text-amber-200">Account Under Review:</span> Your profile is being verified. Some features like task acceptance and withdrawals will be enabled once approved.
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Welcome, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-1">Here's your performance overview for today.</p>
        </div>
        
        <Card className="flex items-center gap-4 px-4 py-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
            stats.level === 'Gold' ? 'bg-amber-500' : 
            stats.level === 'Silver' ? 'bg-slate-400' : 
            'bg-indigo-600'
          }`}>
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Level</span>
            <div className="text-base font-semibold text-gray-900 dark:text-white leading-none">{stats.level} Tier</div>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Wallet size={20} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Available Balance</p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${profile?.balance_available?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 flex items-center font-medium">
              <TrendingUp size={16} className="mr-1" /> +12%
            </span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Clock size={20} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Earnings</p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${profile?.balance_pending?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              {stats.ongoing} projects in progress
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-indigo-600 text-white border-transparent">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
              <Star size={20} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-100">Success Rate</p>
            <div className="text-2xl font-bold mt-1">{stats.completed > 0 ? '98.5%' : 'N/A'}</div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-indigo-100">
             {stats.completed} Projects Completed
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Tasks</h2>
              <p className="text-sm text-gray-500">Recommended projects for your profile</p>
            </div>
            <Link to="/tasks" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1 transition-colors">
              Explore All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {availableTasks.length === 0 ? (
              <Card className="text-center py-12 border-dashed">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium">No active tasks found.</p>
                <p className="text-gray-500 text-sm mt-1">Check back later for new projects.</p>
              </Card>
            ) : (
              availableTasks.map((task) => (
                <Card key={task.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{task.title}</h4>
                        <Badge variant="primary" size="sm">Premium</Badge>
                      </div>
                      <div className="flex gap-4 items-center text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {task.time_limit}m
                        </span>
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-500 font-medium">
                          <DollarSign size={14} /> ${task.reward.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button as={Link} to="/tasks" variant="outline" className="w-full sm:w-auto">
                    View
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          
          <Card className="p-6">
             <span className="text-sm font-medium text-gray-500">Total Lifetime Earnings</span>
             <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1 mb-6">${stats.totalEarned.toFixed(2)}</div>
             <div className="space-y-3">
               <Button as={Link} to="/wallet" wFull>
                 Request Payout
               </Button>
               <Button as={Link} to="/my-tasks" variant="outline" wFull>
                 My Workspace
               </Button>
             </div>
          </Card>

          <div className="space-y-3">
             {profile?.role === 'admin' && (
               <Card as={Link} to="/admin" className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer block">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Client Hub</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Administrative Controls</p>
                </div>
              </Card>
             )}
             
             <Card as={Link} to="/profile" className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer block">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Freelancer Profile</h4>
                  <p className="text-xs text-gray-500 mt-0.5">View Performance</p>
                </div>
              </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
