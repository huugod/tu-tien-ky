import { FC, useState, useEffect } from 'react';
import Button from './Button';

interface StringListEditorProps {
    value?: string; // Expects a JSON string of an array of strings
    onChange: (newValue: string) => void;
}

const StringListEditor: FC<StringListEditorProps> = ({ value = '[]', onChange }) => {
    const [items, setItems] = useState<Array<{ id: number, value: string }>>([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(value || '[]');
            if (Array.isArray(parsed)) {
                setItems(parsed.map((val, index) => ({ id: index, value: String(val) })));
            }
        } catch (e) {
            setItems([]);
        }
    }, [value]);

    const updateParent = (updatedItems: typeof items) => {
        const newArray = updatedItems.map(item => item.value).filter(Boolean);
        onChange(JSON.stringify(newArray, null, 2));
    };

    const handleItemChange = (index: number, fieldValue: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], value: fieldValue };
        setItems(newItems);
        updateParent(newItems);
    };

    const addRow = () => {
        const newItems = [...items, { id: Date.now(), value: '' }];
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
                        placeholder="ID"
                        value={item.value}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="flex-1 text-sm bg-slate-700 border border-slate-600 rounded py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <button type="button" onClick={() => removeRow(index)} className="flex-shrink-0 w-8 h-8 rounded bg-red-600/50 hover:bg-red-600 text-white font-bold">
                        &times;
                    </button>
                </div>
            ))}
            <Button type="button" onClick={addRow} className="w-full bg-slate-600 hover:bg-slate-500 text-sm py-1">
                + Thêm ID
            </Button>
        </div>
    );
};

export default StringListEditor;