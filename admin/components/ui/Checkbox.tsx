import React, { FC } from 'react';

type CheckboxProps = { label: string } & React.InputHTMLAttributes<HTMLInputElement>;

const Checkbox: FC<CheckboxProps> = ({ label, ...props }) => (
    <div className="flex items-center">
        <input type="checkbox" {...props} className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-600" />
        <label className="ml-2 block text-sm text-slate-300">{label}</label>
    </div>
);

export default Checkbox;
