import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import {
  Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUpRight, ClipboardList, ArrowRight, Zap
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

function MyTasks() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('status') || 'active';

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (profile?.id) fetchMyTasks();
  }, [profile, currentTab]);

  const fetchMyTasks = async () => {
    setLoading(true);
    let query = supabase.from('tasks').select('*').eq('assigned_to', profile.id);

    if (currentTab === 'active') {
      query = query.or('status.eq.assigned,status.eq.correction');
    } else if (currentTab === 'review') {
      query = query.eq('status', 'awaiting_review');
    } else if (currentTab === 'completed') {
      query = query.eq('status', 'completed');
    } else if (currentTab === 'rejected') {
      query = query.eq('status', 'rejected');
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) setTasks(data);
    setLoading(false);
  };

  const handleSubmitWork = async (taskId) => {
    try {
      const { error } = await supabase.rpc('submit_task', {
        p_task_id: taskId,
        p_user_id: profile.id
      });

      if (error) throw error;

      toast.success('Project submitted for review. Assets held in escrow.', 'Success');
      fetchMyTasks();
    } catch (err) {
      toast.error('Failed to submit project.', 'Error');
    }
  };

  const tabs = [
    { id: 'active', label: 'In Progress', icon: <Clock size={16} /> },
    { id: 'review', label: 'Under Review', icon: <Zap size={16} /> },
    { id: 'completed', label: 'Finished', icon: <CheckCircle size={16} /> },
    { id: 'rejected', label: 'Dismissed', icon: <XCircle size={16} /> },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      assigned: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400',
      completed: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
      rejected: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
      correction: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
    };
    const labels = { assigned: 'Ongoing', completed: 'Approved', rejected: 'Rejected', correction: 'Revision Req.' };
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${styles[status] || 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">My Projects</h1>
          <p className="text-gray-500 mt-1">Track your active tasks and review completed projects.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar pb-px">
          {tabs.map(tab => (
            <Link
              key={tab.id}
              to={`/my-tasks?status=${tab.id}`}
              className={`
              flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm border-b-2
              ${currentTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}
            `}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-4 pt-2">
          {loading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="h-32 animate-pulse flex items-center justify-center border-dashed">
                <ClipboardList className="text-gray-300 dark:text-gray-700" size={32} />
              </Card>
            ))
          ) : tasks.length === 0 ? (
            <Card className="text-center py-20 border-dashed">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4">
                <ClipboardList size={32} />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Projects Found</h3>
                <p className="text-gray-500 text-sm">You don't have any projects with this status. Browse available tasks to get started.</p>
              </div>
              <div className="mt-8">
                <Button as={Link} to="/tasks" className="inline-flex items-center gap-2">
                  Find Tasks <ArrowRight size={18} />
                </Button>
              </div>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-indigo-500/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 flex-wrap mb-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Zap size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(task.status)}
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">ID: {task.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 md:pl-14">{task.description}</p>
                  <div className="flex gap-4 items-center flex-wrap mt-4 md:pl-14">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <Clock size={14} className="text-indigo-600 dark:text-indigo-400" /> Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-200 dark:border-gray-800 pt-6 md:pt-0">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-500">${task.reward.toFixed(2)}</div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTask(task)}
                      className="w-full md:w-auto flex items-center justify-center gap-2"
                    >
                      View Project <ArrowUpRight size={16} />
                    </Button>
                    {(task.status === 'assigned' || task.status === 'correction') && (
                      <Button
                        onClick={() => {
                          handleSubmitWork(task.id);
                          setSelectedTask(null);
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600"
                      >
                        Submit for Review <CheckCircle size={16} />
                      </Button>
                    )}
                    {task.status === 'awaiting_review' && (
                      <div className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-4 py-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                        Locked for Review
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Project Workspace"
        maxWidth="max-w-2xl"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {getStatusBadge(selectedTask.status)}
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                  ID: #{selectedTask.id.slice(0, 8)}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{selectedTask.title}</h2>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Asset Yield</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-500">
                    ${selectedTask.reward.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Deadline</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {new Date(selectedTask.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedTask.status === 'correction' && selectedTask.admin_feedback && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                    <h4 className="font-semibold text-red-900 dark:text-red-400 flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
                      <AlertCircle size={14} /> Admin Revision Feedback
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {selectedTask.admin_feedback}
                    </p>
                  </div>
                )}

                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider text-xs opacity-70">
                  Project Instructions
                </h4>
                <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                  {selectedTask.description.split('Deliverables:')[0]}
                </div>

                {selectedTask.description.includes('Deliverables:') && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider opacity-80">
                      Required Deliverables
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedTask.description.split('Deliverables:')[1].trim().split('\n').map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item.replace('• ', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(selectedTask.status === 'assigned' || selectedTask.status === 'correction') && (
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-col gap-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      <strong>Submission Protocol:</strong> Ensure all deliverables listed above are completed before finalizing your submission. Funds will be released upon client authorization.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      handleSubmitWork(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="w-full py-4 text-lg flex items-center justify-center gap-2"
                  >
                    Finalize & Submit <CheckCircle size={20} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default MyTasks;
