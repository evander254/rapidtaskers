import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { Rocket } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

function Signup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '',
    grammarQ1: '', grammarQ2: '', essayText: ''
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const handleNext = (e) => { e.preventDefault(); setStep(step + 1); };
  const handlePrev = () => { setStep(step - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(formData.email, formData.password, formData.fullName);
      toast.success('Registration Initiated', 'Your profile has been created and is currently under review by our administrative team.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white mx-auto shadow-sm">
            <Rocket size={24} />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Step {step} of 3
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="John Doe"
                />
                <Input
                  label="Email address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="name@example.com"
                />
                <Input
                  label="Password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
                    1. Select the correct grammar:
                  </label>
                  <div className="space-y-2">
                    {[
                      "The writer performs their review.",
                      "The writer performs they're review.",
                      "The writer performs there review."
                    ].map((opt, idx) => (
                      <div key={idx} className="flex items-center">
                        <input
                          id={`q1-${idx}`}
                          name="q1"
                          type="radio"
                          required
                          checked={formData.grammarQ1 === opt}
                          onChange={() => setFormData({...formData, grammarQ1: opt})}
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <label htmlFor={`q1-${idx}`} className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                          {opt}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
                    2. Define a micro-task:
                  </label>
                  <div className="space-y-2">
                    {[
                      "A long-term project requiring specialized teams.",
                      "A small, focused task completed independently.",
                      "A high-level strategic business proposal."
                    ].map((opt, idx) => (
                      <div key={idx} className="flex items-center">
                        <input
                          id={`q2-${idx}`}
                          name="q2"
                          type="radio"
                          required
                          checked={formData.grammarQ2 === opt}
                          onChange={() => setFormData({...formData, grammarQ2: opt})}
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <label htmlFor={`q2-${idx}`} className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                          {opt}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
                    Why are you a good fit? (min 10 words)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.essayText}
                    onChange={(e) => setFormData({...formData, essayText: e.target.value})}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                    placeholder="Describe your expertise..."
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handlePrev} className="flex-1">
                  Back
                </Button>
              )}
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Processing...' : step === 3 ? 'Complete Registration' : 'Next Step'}
              </Button>
            </div>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
