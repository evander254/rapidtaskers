import { Link } from 'react-router-dom';
import { Rocket, ArrowRight, ShieldCheck, Zap, Globe, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/ui/Button';

function Home() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navbar placeholder for spacing, actual navbar is in MainLayout or App.jsx but wait, Home is outside MainLayout? 
          Actually Navbar is rendered in MainLayout or App depending on routing. We'll just assume standard padding. */}
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            RapidTaskers v3.0 Is Live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
            Earn Money Online by Completing Simple, <br className="hidden md:block" />
            <span className="text-indigo-600 dark:text-indigo-500">High-Paying Tasks.</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Join thousands of verified taskers earning daily. No Hidden charges — just your skills and consistency.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Button as={Link} to="/dashboard" size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2">
                Enter Dashboard <ArrowRight size={20} />
              </Button>
            ) : (
              <>
                <Button as={Link} to="/signup" size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2">
                  Start Earning Now <ArrowRight size={20} />
                </Button>
                <Button as={Link} to="/login" variant="outline" size="lg" className="w-full sm:w-auto flex items-center justify-center">
                  Tasker Login
                </Button>
              </>
            )}
          </div>

          <div className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
            {['Microsoft', 'Stripe', 'Figma', 'Linear', 'Replicate'].map(brand => (
              <span key={brand} className="text-xl font-semibold text-gray-900 dark:text-white">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Stats */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-20 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { label: 'Tasks', val: 'Rapid', icon: <Zap className="text-indigo-600 dark:text-indigo-400" /> },
              { label: 'Global', val: 'clients', icon: <Globe className="text-indigo-600 dark:text-indigo-400" /> },
              { label: 'Task Completion', val: '+ 10k', icon: <Clock className="text-indigo-600 dark:text-indigo-400" /> }
            ].map((stat, i) => (
              <div key={i}>
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{stat.val}</div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-10">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                  Why Taskers Love RapidTaskers
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  We connect you to real tasks that pay. No spam, no wasted time — just simple work and real earnings.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { title: 'Create Your Account', desc: 'Sign up and complete a quick verification.', icon: <CheckCircle className="text-indigo-600" size={24} /> },
                  { title: 'Pick a Task', desc: 'Browse available tasks and start instantly.', icon: <CheckCircle className="text-indigo-600" size={24} /> },
                  { title: 'Complete Work', desc: 'Submit your task and wait for approval.', icon: <CheckCircle className="text-indigo-600" size={24} /> },
                  { title: 'Get Paid', desc: 'Receive your money directly to your wallet.', icon: <CheckCircle className="text-indigo-600" size={24} /> },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                    <div className="shrink-0 pt-1">{item.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">RapidTaskers Home</div>
                </div>
                <div className="space-y-6">
                  <div className="h-4 w-2/3 bg-gray-800 rounded"></div>
                  <div className="h-4 w-full bg-gray-800 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-800 rounded"></div>
                  <div className="grid grid-cols-2 gap-4 pt-8">
                    <div className="bg-indigo-600 rounded-2xl p-5 flex flex-col justify-between h-32">
                      <div className="text-xs font-medium text-indigo-200 uppercase tracking-wider">Earnings</div>
                      <div className="text-2xl font-bold">$200.00</div>
                    </div>
                    <div className="bg-gray-800 rounded-2xl p-5 flex flex-col justify-between h-32">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</div>
                      <div className="text-lg font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Verified
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Start Earning Today — Don’t Miss Out</h2>
            <p className="text-gray-600 dark:text-gray-400">Join thousands already making money daily on RapidTaskers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Onboarding', desc: 'Complete your profile and undergo verification.' },
              { step: '02', title: 'Allocation', desc: 'Browse and accept assignments that match your skill.' },
              { step: '03', title: 'Execution', desc: 'Deliver high-quality work within the specified time.' },
              { step: '04', title: 'Payout', desc: 'Receive instant settlement into your secure wallet.' }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm relative">
                <div className="text-4xl font-bold text-gray-100 dark:text-gray-800 absolute top-4 right-6">{item.step}</div>
                <div className="relative z-10 pt-8">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-indigo-600 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Start Earning Today
              </h2>
              <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
                Join thousands of digital professionals today. RapidTaskers is the first stop for your freelance journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button as={Link} to="/signup" className="bg-white text-indigo-600 hover:bg-gray-50 flex items-center justify-center">
                  Create Free Account
                </Button>
                <Button as={Link} to="/tasks" className="bg-indigo-700 hover:bg-indigo-800 text-white flex items-center justify-center">
                  Browse Assignments
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Rocket size={18} />
              </div>
              <span className="font-semibold text-xl text-gray-900 dark:text-white">RapidTaskers</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-gray-500">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Status</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2026 RapidTaskers Protocol. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
