import React, { FC } from 'react';

type TextAreaProps = { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const TextArea: FC<TextAreaProps> = ({ label, ...props }) => (
     <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <textarea {...props} rows={props.rows || 5} className="block w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 font-mono text-sm disabled:opacity-50" />
    </div>
);

export default TextArea;
