import { Link } from 'react-router-dom';
import { Rocket, ArrowRight, ShieldCheck, Zap, Globe, Clock, CheckCircle, Star, Quote, HelpCircle, DollarSign, Users, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/ui/Button';
import { useState } from 'react';

function Home() {
  const { user } = useAuthStore();
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How do I get paid?",
      a: "Payments are processed apon approval to your RapidTaskers wallet once a task is approved. You can withdraw to your Mpesa or crypto wallet."
    },
    {
      q: "Are tasks verified?",
      a: "Yes, all tasks go through our automated verification system and manual review to ensure they are legitimate and free of scams."
    },
    {
      q: "How long does approval take?",
      a: "Most tasks are reviewed and approved within 2-4 hours. High-quality taskers often receive automatic instant approvals."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-gray-950">
        {/* Animated background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Best Task Stop
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
            Earn Money Online by Completing Simple, <br className="hidden md:block" />
            <span className="text-indigo-600 dark:text-indigo-500">High-Paying Tasks.</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Join thousands of verified taskers earning daily. No hidden fees, no complicated processes — just your skills and consistency.
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

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
          <svg className="relative block w-full h-[60px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C50.25,84.7,100.91,73.47,150.31,56.44Z" className="fill-gray-50 dark:fill-gray-900/50"></path>
          </svg>
        </div>
      </section>

      {/* Trust & Stats */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-20 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { label: 'Total Users', val: '1,000+', icon: <Users className="text-indigo-600 dark:text-indigo-400" size={24} /> },
              { label: 'Tasks Completed', val: '10K+', icon: <CheckCircle className="text-indigo-600 dark:text-indigo-400" size={24} /> },
              { label: 'Avg. Payout Time', val: '2 Weeks', icon: <Clock className="text-indigo-600 dark:text-indigo-400" size={24} /> }
            ].map((stat, i) => (
              <div key={i} className="group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center mx-auto mb-4 group-hover:border-indigo-500/50 transition-colors">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{stat.val}</div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Start Earning in 4 Simple Steps</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">No complicated onboarding. Get setup in minutes and start claiming your first paid tasks immediately.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your free account and verify your email.', icon: <Rocket size={20}/> },
              { step: '02', title: 'Pick a Task', desc: 'Browse our marketplace and claim tasks that fit your skills.', icon: <Globe size={20}/> },
              { step: '03', title: 'Complete Work', desc: 'Follow the simple instructions and submit your proof of work.', icon: <CheckCircle size={20}/> },
              { step: '04', title: 'Get Paid', desc: 'Funds are credited to your wallet securely and instantly.', icon: <DollarSign size={20}/> }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <div className="text-5xl font-extrabold text-gray-100 dark:text-gray-800 absolute top-6 right-6 opacity-50 group-hover:text-indigo-50 dark:group-hover:text-indigo-900/20 transition-colors">{item.step}</div>
                <div className="relative z-10">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{item.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-10">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                  Everything you need to succeed.
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  We built RapidTaskers to protect your time and maximize your earnings.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Fast Payouts', desc: 'Withdraw to your M-Pesa or crypto wallet with industry-leading speed.', icon: <Zap className="text-indigo-600" size={20} /> },
                  { title: 'Verified Tasks', desc: 'Say goodbye to scams. Every task is pre-funded and strictly vetted.', icon: <ShieldCheck className="text-indigo-600" size={20} /> },
                  { title: 'Easy to Use', desc: 'Our intuitive dashboard makes managing tasks and earnings a breeze.', icon: <Rocket className="text-indigo-600" size={20} /> },
                  { title: 'Global Access', desc: 'Work from anywhere in the world. No geographical restrictions.', icon: <Globe className="text-indigo-600" size={20} /> },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors">
                    <div className="w-10 h-10 shrink-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">{item.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 w-full animate-float">
              <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-gray-800">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/30 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Earnings Dashboard</div>
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Available Balance</div>
                      <div className="text-3xl font-bold">$240.50</div>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                       <DollarSign size={24} />
                    </div>
                  </div>
                  <div className="h-px bg-gray-800 w-full"></div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-gray-400">150 words Discussion Post</span>
                       <span className="text-green-400">+$1.00</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-gray-400">Power Slides</span>
                       <span className="text-green-400">+$15.00</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-gray-400">AI Removal</span>
                       <span className="text-green-400">+$0.50</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-gray-950">
         <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Trusted by Freelancers Worldwide</h2>
               <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Don't just take our word for it. Here's what our community has to say.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  { name: "Sarah Otsieno", country: "Kenya", text: "RapidTaskers completely changed how I earn on the side. The interface is clean, and the payouts hit my account. Highly recommend!" },
                  { name: "Ahmed Yasin", country: "Kenya", text: "I've tried many local task sites, but this one actually has verified tasks that pay fairly. It's a reliable source of income for me now." },
                  { name: "Duncan Ochieng", country: "Kenya", text: "The dashboard is beautiful and the tasks are very straightforward. I made my first $50 within 2 days of signing up." }
               ].map((review, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 relative">
                     <Quote className="text-indigo-200 dark:text-indigo-900/50 absolute top-6 right-6" size={48} />
                     <div className="flex gap-1 mb-6">
                        {[1,2,3,4,5].map(star => <Star key={star} size={18} className="fill-yellow-400 text-yellow-400" />)}
                     </div>
                     <p className="text-gray-700 dark:text-gray-300 mb-8 relative z-10 font-medium leading-relaxed">"{review.text}"</p>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                           {review.name.charAt(0)}
                        </div>
                        <div>
                           <h5 className="font-semibold text-gray-900 dark:text-white">{review.name}</h5>
                           <span className="text-sm text-gray-500">{review.country}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
         <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
               {faqs.map((faq, index) => (
                  <div key={index} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                     <button 
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                     >
                        <span className="font-semibold text-gray-900 dark:text-white">{faq.q}</span>
                        <ChevronDown className={`text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} size={20} />
                     </button>
                     <div className={`px-6 pb-5 text-gray-600 dark:text-gray-400 ${openFaq === index ? 'block' : 'hidden'}`}>
                        {faq.a}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 bg-white dark:bg-gray-950 overflow-hidden">
        {/* Top Wave */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180 z-0">
          <svg className="relative block w-full h-[40px] md:h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C50.25,84.7,100.91,73.47,150.31,56.44Z" className="fill-gray-50 dark:fill-gray-900/50"></path>
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl animate-float-delayed">
            {/* Background elements for CTA */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
               <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
               <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Ready to Start Earning Today?
              </h2>
              <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
                Join thousands of digital professionals today. RapidTaskers is the first stop for your freelance journey.
              </p>
              <div className="flex justify-center pt-4">
                <Button as={Link} to="/signup" size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 flex items-center justify-center gap-2 px-8 py-4 text-lg">
                  Create Your Free Account <ArrowRight size={20} />
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
