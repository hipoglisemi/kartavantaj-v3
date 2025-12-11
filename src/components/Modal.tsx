import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {

    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const modalContentRef = React.useRef<HTMLDivElement>(null);

    // Arka plan scroll'u engelleme
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Internal Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            if (modalContentRef.current) {
                setShowScrollTop(modalContentRef.current.scrollTop > 300);
            }
        };

        const ref = modalContentRef.current;
        if (ref) {
            ref.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (ref) ref.removeEventListener('scroll', handleScroll);
        };
    }, [isOpen]);

    const scrollToTop = () => {
        modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                ref={modalContentRef}
                className="relative bg-white rounded-2xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto scroll-smooth"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Kapat Butonu */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
                    title="Kapat"
                >
                    <X size={24} />
                </button>
                {/* İçerik */}
                <div className="p-8">{children}</div>

                {/* Modal Scroll To Top */}
                <button
                    onClick={scrollToTop}
                    className={`sticky bottom-4 left-full mr-4 mb-4 p-2 bg-purple-600/90 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 transform ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                    style={{ float: 'right', marginTop: '-3rem' }} // Trick to position it relative to sticky
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up">
                        <path d="m18 15-6-6-6 6" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Modal;