import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-xl shadow-sm mb-2">
            <button
                className="flex items-center justify-between w-full p-4 text-gray-800 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{title}</span>
                <ChevronDown className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`p-4 overflow-hidden transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
                {children}
            </div>
        </div>
    );
};

export default Accordion;