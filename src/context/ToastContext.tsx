import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const helpers = {
        addToast,
        success: (msg: string) => addToast(msg, 'success'),
        error: (msg: string) => addToast(msg, 'error'),
        info: (msg: string) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={helpers}>
            {children}
            {/* Toast Container - Bottom Right */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto
                            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border
                            min-w-[300px] max-w-[400px]
                            animate-in slide-in-from-right-10 fade-in duration-300
                            ${toast.type === 'success' ? 'bg-white border-green-100 text-gray-800' : ''}
                            ${toast.type === 'error' ? 'bg-white border-red-100 text-gray-800' : ''}
                            ${toast.type === 'info' ? 'bg-white border-blue-100 text-gray-800' : ''}
                        `}
                    >
                        {/* Icon */}
                        <div className={`p-1 rounded-full 
                            ${toast.type === 'success' ? 'text-green-600 bg-green-50' : ''}
                            ${toast.type === 'error' ? 'text-red-600 bg-red-50' : ''}
                            ${toast.type === 'info' ? 'text-blue-600 bg-blue-50' : ''}
                        `}>
                            {toast.type === 'success' && <CheckCircle size={20} />}
                            {toast.type === 'error' && <XCircle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                        </div>

                        {/* Content */}
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>

                        {/* Close Button */}
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
