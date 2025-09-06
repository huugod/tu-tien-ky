import { FC, useState, useEffect } from 'react';
import type { GenericData } from '../../types';
import Button from './Button';

interface ObjectEditorProps {
    value?: string; // Expects a JSON string
    onChange: (newValue: string) => void;
}

const ObjectEditor: FC<ObjectEditorProps> = ({ value = '{}', onChange }) => {
    const [items, setItems] = useState<Array<{ id: number, key: string, value: string }>>([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(value || '{}');
            const initialItems = Object.entries(parsed).map(([key, val], index) => ({
                id: index,
                key,
                value: typeof val === 'object' ? JSON.stringify(val) : String(val)
            }));
            setItems(initialItems);
        } catch (e) {
            setItems([]);
        }
    }, [value]);

    const updateParent = (updatedItems: typeof items) => {
        const newObject = updatedItems.reduce((acc, item) => {
            if (item.key) {
                try {
                    // Try to parse value back to number/boolean/object if possible
                    acc[item.key] = JSON.parse(item.value);
                } catch (e) {
                    // if it fails to parse (e.g. it's just a string), use the string value
                    if (item.value === 'true') acc[item.key] = true;
                    else if (item.value === 'false') acc[item.key] = false;
                    else if (!isNaN(Number(item.value)) && item.value.trim() !== '') acc[item.key] = Number(item.value);
                    else acc[item.key] = item.value;
                }
            }
            return acc;
        }, {} as GenericData);
        onChange(JSON.stringify(newObject, null, 2));
    };

    const handleItemChange = (index: number, field: 'key' | 'value', fieldValue: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: fieldValue };
        setItems(newItems);
        updateParent(newItems);
    };

    const addRow = () => {
        const newItems = [...items, { id: Date.now(), key: '', value: '' }];
        setItems(newItems);
    };

    const removeRow = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        updateParent(newItems);
    };

    return (
        <div className="space-y-2 p-2 border border-slate-700 rounded-md bg-slate-900/50">
            {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-800 rounded">
                    <input
                        type="text"
                        placeholder="Key"
                        value={item.key}
                        onChange={(e) => handleItemChange(index, 'key', e.target.value)}
                        className="flex-1 text-sm bg-slate-700 border border-slate-600 rounded py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <input
                        type="text"
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                        className="flex-1 text-sm bg-slate-700 border border-slate-600 rounded py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <button type="button" onClick={() => removeRow(index)} className="flex-shrink-0 w-8 h-8 rounded bg-red-600/50 hover:bg-red-600 text-white font-bold">
                        &times;
                    </button>
                </div>
            ))}
            <Button type="button" onClick={addRow} className="w-full bg-slate-600 hover:bg-slate-500 text-sm py-1">
                + Thêm Thuộc Tính
            </Button>
        </div>
    );
};

export default ObjectEditor;