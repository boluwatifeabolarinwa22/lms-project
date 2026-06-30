import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          icon: <CheckCircle className="w-5 h-5 text-emerald-600" />
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200 text-red-700',
          icon: <AlertCircle className="w-5 h-5 text-red-600" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          icon: <Info className="w-5 h-5 text-blue-600" />
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border bg-white shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 ${style.bg}`}>
      {style.icon}
      <span className="text-sm font-semibold">{message}</span>
      <button 
        onClick={onClose} 
        className="p-1 rounded-md hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 text-slate-500 hover:text-slate-800" />
      </button>
    </div>
  );
}
