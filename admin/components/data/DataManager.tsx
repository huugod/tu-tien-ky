import { FC, useState, useEffect, useCallback } from 'react';
import type { GenericData, FormField, DisplayColumn } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EditForm from './EditForm';
import { API_BASE_URL } from '../../config/config';

interface DataManagerProps {
    token: string;
    tableName: string;
    title: string;
    primaryKey?: string;
    formFields: FormField[];
    displayColumns: DisplayColumn[];
}
const DataManager: FC<DataManagerProps> = ({ token, tableName, title, primaryKey = 'id', formFields, displayColumns }) => {
    const [data, setData] = useState<GenericData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<GenericData | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/${tableName}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Không thể tải dữ liệu.');
            const jsonData = await res.json();
            setData(jsonData);
        } catch (error) {
            alert(`Lỗi tải ${tableName}: ` + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [token, tableName]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (submittedItem: GenericData) => {
        if (!editingItem) return;

        const isNew = editingItem[primaryKey] === undefined || editingItem[primaryKey] === null || editingItem[primaryKey] === '';
        
        const url = isNew ? `${API_BASE_URL}/admin/${tableName}` : `${API_BASE_URL}/admin/${tableName}/${submittedItem[primaryKey]}`;
        const method = isNew ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(submittedItem),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            alert(`Lỗi lưu ${tableName}: ` + (error as Error).message);
        }
    };

    const handleDelete = async (item: GenericData) => {
        if (!confirm(`Bạn có chắc muốn xóa '${item[displayColumns[1].key]}' không?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/${tableName}/${item[primaryKey]}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            fetchData();
        } catch (error) {
             alert(`Lỗi xóa ${tableName}: ` + (error as Error).message);
        }
    };
    
    const handleCreateNew = () => {
        setEditingItem({});
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
            <header className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-cyan-300">{title}</h2>
                <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700">+ Tạo Mới</Button>
            </header>
            
            {isLoading ? <p>Đang tải...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                            <tr>
                                {displayColumns.map(col => <th key={col.key} scope="col" className="px-6 py-3">{col.label}</th>)}
                                <th scope="col" className="px-6 py-3 text-right">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item[primaryKey]} className="border-b border-slate-700 hover:bg-slate-800">
                                    {displayColumns.map(col => <td key={`${item[primaryKey]}-${col.key}`} className="px-6 py-4">{item[col.key]?.toString()}</td>)}
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => setEditingItem(item)} className="font-medium text-blue-400 hover:underline">Sửa</button>
                                        <button onClick={() => handleDelete(item)} className="font-medium text-red-400 hover:underline">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editingItem && (
                <Modal title={editingItem[primaryKey] !== undefined && editingItem[primaryKey] !== '' ? `Sửa ${title}` : `Tạo Mới ${title}`} onClose={() => setEditingItem(null)}>
                    <EditForm initialData={editingItem} formFields={formFields} onSave={handleSave} onCancel={() => setEditingItem(null)} primaryKey={primaryKey} />
                </Modal>
            )}
        </div>
    );
};

export default DataManager;