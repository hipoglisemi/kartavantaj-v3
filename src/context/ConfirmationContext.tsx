import React, { createContext, useContext, useState, useRef } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmationOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
}

interface ConfirmationContextType {
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
    alert: (message: string, title?: string) => Promise<void>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<ConfirmationOptions>({ message: '' });
    const [isAlert, setIsAlert] = useState(false);

    // We use a ref to store the resolve function of the promise
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = (options: ConfirmationOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfig({
                confirmText: 'Evet, Onayla',
                cancelText: 'Vazgeç',
                type: 'danger',
                ...options
            });
            setIsAlert(false);
            setIsOpen(true);
            resolveRef.current = resolve;
        });
    };

    const showAlert = (message: string, title: string = 'Bilgi'): Promise<void> => {
        return new Promise((resolve) => {
            setConfig({
                title,
                message,
                confirmText: 'Tamam',
                type: 'info'
            });
            setIsAlert(true);
            setIsOpen(true);
            resolveRef.current = () => resolve();
        });
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolveRef.current) {
            resolveRef.current(true);
            resolveRef.current = null;
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolveRef.current) {
            resolveRef.current(false);
            resolveRef.current = null;
        }
    };

    // Determine Icon and Color based on type
    const getIcon = () => {
        switch (config.type) {
            case 'danger': return <Trash2 size={24} />;
            case 'warning': return <AlertTriangle size={24} />;
            case 'success': return <CheckCircle size={24} />;
            default: return <AlertTriangle size={24} />; // Info
        }
    };

    const getColorClass = () => {
        switch (config.type) {
            case 'danger': return 'bg-red-100 text-red-600';
            case 'warning': return 'bg-amber-100 text-amber-600';
            case 'success': return 'bg-green-100 text-green-600';
            default: return 'bg-blue-100 text-blue-600';
        }
    };

    const getButtonClass = () => {
        switch (config.type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700';
            case 'success': return 'bg-green-600 hover:bg-green-700';
            default: return 'bg-blue-600 hover:bg-blue-700';
        }
    };

    return (
        <ConfirmationContext.Provider value={{ confirm, alert: showAlert }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${getColorClass()}`}>
                                {getIcon()}
                            </div>

                            {config.title && (
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{config.title}</h3>
                            )}

                            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                {config.message}
                            </p>

                            <div className="flex gap-3">
                                {!isAlert && (
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors text-sm"
                                    >
                                        {config.cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 px-4 py-2.5 text-white font-bold rounded-lg transition-colors shadow-lg text-sm ${getButtonClass()}`}
                                >
                                    {config.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmationContext.Provider>
    );
};

export const useConfirmation = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirmation must be used within a ConfirmationProvider');
    }
    return context;
};
