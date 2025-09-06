import React, { FC } from 'react';

type InputProps = { label: string } & React.InputHTMLAttributes<HTMLInputElement>;

const Input: FC<InputProps> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <input {...props} className="block w-full bg-slate-800 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50" />
    </div>
);

export default Input;
