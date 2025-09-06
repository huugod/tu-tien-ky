import React, { FC } from 'react';
import type { Option } from '../../types';

type SelectProps = { label: string; options?: Option[] } & React.SelectHTMLAttributes<HTMLSelectElement>;

const Select: FC<SelectProps> = ({ label, options = [], ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <select {...props} className="block w-full bg-slate-800 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50">
             <option value="">-- Chọn --</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export default Select;
