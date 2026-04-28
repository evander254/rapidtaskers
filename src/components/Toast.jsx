import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const iconMap = {
  success: <CheckCircle size={18} className="text-emerald-500 shrink-0" />,
  error: <XCircle size={18} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
  info: <Info size={18} className="text-blue-500 shrink-0" />,
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const borderAccent = {
    success: 'border-l-emerald-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-indigo-500',
  };

  return (
    <div 
      className={`
        bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 ${borderAccent[toast.type]} border-l-4
        rounded-xl p-4 shadow-2xl flex items-start gap-4 
        min-w-[320px] sm:min-w-[380px] max-w-[480px] 
        backdrop-blur-md transition-all duration-300 transform
        ${exiting 
          ? 'opacity-0 translate-y-[-20px] scale-95' 
          : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-4 duration-300'}
        glow-primary
      `}
    >
      <div className="mt-0.5">{iconMap[toast.type]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-bold text-sm text-gray-900 dark:text-white mb-0.5 tracking-tight">{toast.title}</p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, title = '', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title, duration }]);
  }, []);

  const toast = useCallback({
    success: (message, title) => addToast('success', message, title),
    error: (message, title) => addToast('error', message, title),
    warning: (message, title) => addToast('warning', message, title),
    info: (message, title) => addToast('info', message, title),
  }, [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
