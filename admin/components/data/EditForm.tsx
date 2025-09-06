import React, { FC, useState } from 'react';
import type { GenericData, FormField } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';
import ListEditor from '../ui/ListEditor';
import ObjectEditor from '../ui/ObjectEditor';
import StringListEditor from '../ui/StringListEditor';

interface EditFormProps {
    initialData: GenericData;
    formFields: FormField[];
    onSave: (data: GenericData) => void;
    onCancel: () => void;
    primaryKey: string;
}
const EditForm: FC<EditFormProps> = ({ initialData, formFields, onSave, onCancel, primaryKey }) => {
    const [formData, setFormData] = useState<GenericData>(() => {
        const data = { ...initialData };
        formFields.forEach(field => {
            // PARSE: If a field is a JSON string from DB, parse it to a JS object/array first.
            const isStructuredField = field.type === 'json' || field.objectAsList || field.arrayAsList || (typeof field.objectAsListSingleton === 'function' ? field.objectAsListSingleton(data) : field.objectAsListSingleton) || field.type === 'list';
            if (isStructuredField && typeof data[field.name] === 'string') {
                try {
                    data[field.name] = JSON.parse(data[field.name]);
                } catch (e) {
                    console.warn(`Could not parse JSON for field ${field.name}, defaulting.`);
                    data[field.name] = (field.type === 'list' || field.arrayAsList) ? [] : {};
                }
            }
            
            // TRANSFORM for UI: Convert JS objects/arrays to the format required by the UI components.
            if (field.objectAsList) {
                const obj = data[field.name] || {};
                data[field.name] = Object.entries(obj).map(([key, value]) => ({ 
                    [field.objectAsList!.keyName]: key, 
                    [field.objectAsList!.valueName]: value 
                }));
            }
            if (field.arrayAsList) {
                const arr = (data[field.name] || []) as string[];
                data[field.name] = arr.map(val => ({ [field.arrayAsList!.valueName]: val }));
            }
            
            const isSingleton = typeof field.objectAsListSingleton === 'function' ? field.objectAsListSingleton(data) : field.objectAsListSingleton;
            if (isSingleton) {
                const obj = data[field.name] || {};
                data[field.name] = [obj];
            }

            // STRINGIFY for UI: If it's a simple JSON textarea, stringify the object for display.
            if (field.type === 'json' && typeof data[field.name] === 'object' && data[field.name] !== null) {
                data[field.name] = JSON.stringify(data[field.name], null, 2);
            }

            // Handle boolean separately
            if (field.type === 'boolean') {
                data[field.name] = !!data[field.name];
            }
        });
        return data;
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleCustomEditorChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleListChange = (name: string, value: GenericData[]) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let dataToSave = { ...formData };
        try {
            formFields.forEach(field => {
                 // DE-TRANSFORM from UI: Convert UI component data back to native JS objects/arrays.
                if (field.objectAsList) {
                    const arr = (dataToSave[field.name] as GenericData[]) || [];
                    dataToSave[field.name] = arr.reduce((acc, row) => {
                        const key = row[field.objectAsList!.keyName];
                        const rawValue = row[field.objectAsList!.valueName];
                        if (key) {
                           acc[key] = field.objectAsList!.valueType === 'number' ? Number(rawValue) : rawValue;
                        }
                        return acc;
                    }, {} as GenericData);
                }
                if (field.arrayAsList) {
                    const arrOfObjects = (dataToSave[field.name] as GenericData[]) || [];
                    dataToSave[field.name] = arrOfObjects
                        .map(row => row[field.arrayAsList!.valueName])
                        .filter(val => val !== undefined && val !== null && val !== '');
                }
                
                const isSingleton = typeof field.objectAsListSingleton === 'function' ? field.objectAsListSingleton(dataToSave) : field.objectAsListSingleton;
                if (isSingleton) {
                    const arr = (dataToSave[field.name] as GenericData[]) || [];
                    dataToSave[field.name] = arr[0] || {};
                }
                
                // PARSE from UI: If it was a simple JSON textarea, parse the string back into an object.
                if (field.type === 'json' && typeof dataToSave[field.name] === 'string' && !field.readOnly) {
                    dataToSave[field.name] = JSON.parse(dataToSave[field.name]);
                }
            });
            onSave(dataToSave);
        } catch (err) {
            alert(`Lỗi phân tích cú pháp: ${(err as Error).message}`);
        }
    };
    
    const isNew = initialData[primaryKey] === undefined || initialData[primaryKey] === null || initialData[primaryKey] === '';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map(field => {
                const propsToSpread = {
                    label: field.label,
                    name: field.name,
                    disabled: (field.isKey && !isNew) || field.readOnly,
                    required: field.required,
                };

                if (field.type === 'list' || field.objectAsList) {
                     const columnsForList = typeof field.columns === 'function' ? field.columns(formData) : field.columns;
                     return (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{field.label}</label>
                            <ListEditor
                                value={formData[field.name] || []}
                                onChange={(newList) => handleListChange(field.name, newList)}
                                columns={columnsForList!}
                            />
                        </div>
                    );
                }

                if (field.type === 'json' && !field.readOnly) {
                    if (field.jsonType === 'object') {
                        return (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-slate-400 mb-1">{field.label}</label>
                                <ObjectEditor
                                    value={formData[field.name] ?? '{}'}
                                    onChange={(newValue) => handleCustomEditorChange(field.name, newValue)}
                                />
                            </div>
                        );
                    }
                    if (field.jsonType === 'string_array') {
                        return (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-slate-400 mb-1">{field.label}</label>
                                <StringListEditor
                                    value={formData[field.name] ?? '[]'}
                                    onChange={(newValue) => handleCustomEditorChange(field.name, newValue)}
                                />
                            </div>
                        );
                    }
                }


                const inputSpecificProps: any = {
                    ...propsToSpread,
                    value: formData[field.name] ?? '',
                    onChange: handleChange,
                };
                if (field.type === 'boolean') {
                    inputSpecificProps.checked = formData[field.name] === true;
                }
                
                if (field.type === 'json') return <TextArea key={field.name} {...inputSpecificProps} readOnly={field.readOnly} />;
                if (field.type === 'boolean') return <Checkbox key={field.name} {...inputSpecificProps} />;
                if (field.type === 'textarea') return <TextArea key={field.name} {...inputSpecificProps} rows={3}/>;
                if (field.inputType === 'select') {
                    const options = typeof field.options === 'function' ? field.options(formData) : field.options;
                    return <Select key={field.name} {...inputSpecificProps} options={options}/>;
                }
                return <Input key={field.name} {...inputSpecificProps} type={field.type || 'text'} />;
            })}
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" onClick={onCancel} className="bg-slate-600 hover:bg-slate-500">Hủy</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Lưu</Button>
            </div>
        </form>
    );
};

export default EditForm;