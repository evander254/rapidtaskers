import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { supabase } from '../services/supabase';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  DollarSign,
  TrendingUp,
  History,
  Download,
  ShieldCheck
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

function Wallet() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mpesa');

  useEffect(() => {
    if (profile?.id) fetchTransactions();
  }, [profile]);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (data) setWithdrawals(data);
    setLoading(false);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val < 10) {
      toast.warning('Minimum Settlement', 'The minimum liquidation amount is $10.00');
      return;
    }
    if (val > profile.balance_available) {
      toast.error('Insufficient Assets', 'Your cleared balance is below the requested amount.');
      return;
    }

    try {
      // Use atomic RPC for withdrawal
      const { error } = await supabase.rpc('request_withdrawal', {
        p_user_id: profile.id,
        p_amount: val,
        p_method: method
      });

      if (error) throw error;

      toast.success('Liquidation Initialized', 'Your assets have been moved to escrow for processing.');
      setAmount('');
      fetchTransactions();
    } catch (error) {
      toast.error('Transaction Denial', error.message);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Settlement Hub</h1>
          <p className="text-gray-500 mt-1">Monitor your earnings and initialize professional liquidations.</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download size={16} /> Audit Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balance Card */}
            <Card className="p-8 bg-indigo-600 text-white border-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-white/20 rounded-lg text-white">
                      <WalletIcon size={20} />
                    </div>
                    <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Liquid Assets</span>
                  </div>
                  <div className="text-4xl font-bold mb-2">${profile?.balance_available?.toFixed(2) || '0.00'}</div>
                  <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium">
                    <TrendingUp size={16} /> +18.4% Efficiency Gain
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/20 flex justify-between items-center">
                  <div className="text-xs font-medium text-indigo-100">
                    Liquidation Status: Nominal
                  </div>
                  <ShieldCheck size={20} className="text-indigo-200" />
                </div>
              </div>
            </Card>

            {/* Pending Card */}
            <Card className="p-8 flex flex-col justify-between border-dashed">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                    <Clock size={20} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Escrowed Assets</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">${profile?.balance_pending?.toFixed(2) || '0.00'}</div>
                <p className="text-sm text-gray-500 mt-2">Processing across active assignments awaiting final verification.</p>
              </div>
              <div className="mt-8 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Next Settlement Hub Cycle: Wed 09:00 UTC
              </div>
            </Card>
          </div>

          {/* History Table */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <History size={18} className="text-indigo-600 dark:text-indigo-400" /> Operational Transaction Log
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">TX Identifier</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Category</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="5" className="p-6"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <History size={32} className="text-gray-400" />
                          <p className="text-gray-500 font-medium">No transactional history found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">TX-{tx.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium capitalize">{tx.category?.replace('_', ' ') || 'Transfer'}</td>
                        <td className={`px-6 py-4 font-bold ${tx.type === 'credit' ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-white'}`}>
                          {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Badge variant={
                            tx.status === 'completed' ? 'success' :
                            tx.status === 'failed' ? 'danger' :
                            'primary'
                          } className="inline-flex items-center gap-1.5">
                            {tx.status === 'completed' ? <CheckCircle size={12} /> : 
                             tx.status === 'failed' ? <XCircle size={12} /> : 
                             <Clock size={12} />}
                            {tx.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4">
          <Card className="p-6 md:p-8 sticky top-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Initialize Settlement</h3>
            <form onSubmit={handleWithdraw} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Liquidation Volume ($)</label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <DollarSign size={20} />
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-xl font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white" 
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-gray-500 font-medium">Min: $10.00</span>
                  <button 
                    type="button"
                    onClick={() => setAmount(profile?.balance_available?.toFixed(2))}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors uppercase tracking-wider"
                  >
                    Max Available
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Settlement Endpoint</label>
                <select 
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                >
                  <option value="mpesa">M-Pesa Mobile Money</option>
                  <option value="usdt">USDT (TRC-20)</option>
                </select>
              </div>

              <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Network Processing Fee</span>
                  <span className="text-gray-900 dark:text-white font-medium">$0.00</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-3 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-gray-900 dark:text-white">Total Credit</span>
                  <span className="text-indigo-600 dark:text-indigo-400">${amount ? parseFloat(amount).toFixed(2) : '0.00'}</span>
                </div>
              </div>

              <Button type="submit" wFull className="flex items-center justify-center gap-2 py-3">
                <ArrowUpRight size={18} />
                Confirm Settlement
              </Button>
              
              <p className="text-xs text-center text-gray-500 px-4 leading-relaxed">
                Transfers are subject to institutional processing windows of 1-3 protocol cycles.
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
