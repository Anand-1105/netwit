import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext();

const ICONS = {
    success: <FiCheckCircle size={16} className="text-emerald-500 flex-shrink-0" />,
    error:   <FiXCircle    size={16} className="text-red-500 flex-shrink-0" />,
    warning: <FiAlertCircle size={16} className="text-amber-500 flex-shrink-0" />,
    info:    <FiInfo       size={16} className="text-blue-500 flex-shrink-0" />,
};

const BG = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error:   'border-red-500/30 bg-red-500/10 text-red-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    info:    'border-blue-500/30 bg-blue-500/10 text-blue-300',
};

let id = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'info', duration = 3500) => {
        const tid = ++id;
        setToasts(prev => [...prev, { id: tid, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), duration);
    }, []);

    const remove = (tid) => setToasts(prev => prev.filter(t => t.id !== tid));

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm pointer-events-auto ${BG[t.type]}`}
                    >
                        {ICONS[t.type]}
                        <span className="flex-1 leading-snug">{t.message}</span>
                        <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity">
                            <FiX size={13} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
