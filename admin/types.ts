// --- Type Definitions ---
export type Option = { value: string | number; label: string };

export type ColumnDefinition = {
    name: string;
    label: string;
    type?: string;
    inputType?: 'select';
    options?: Option[] | ((rowData: GenericData) => Option[]);
    // FIX: Add 'readOnly' property to support read-only fields in ListEditor.
    readOnly?: boolean;
};

export type FormField = {
    name: string;
    label: string;
    isKey?: boolean;
    required?: boolean;
    type?: string;
    jsonType?: 'object' | 'string_array';
    inputType?: 'select';
    options?: Option[] | ((formData: GenericData) => Option[]);
    objectAsList?: {
        keyName: string;
        valueName: string;
        valueType?: 'number' | 'string';
    };
    arrayAsList?: {
        valueName: string;
    };
    objectAsListSingleton?: boolean | ((formData: GenericData) => boolean);
    columns?: ColumnDefinition[] | ((formData: GenericData) => ColumnDefinition[]);
    readOnly?: boolean;
};

export type DisplayColumn = {
    key: string;
    label: string;
};

export type AdminStats = {
    playerCount: number;
    guildCount: number;
};

export type ItemIdOption = {
    value: string;
    label: string;
};

export type AdminMetadata = {
    bonusTypes: Option[];
    buffTypes: Option[];
    equipmentSlots: Option[];
    itemIds: {
        pills: ItemIdOption[];
        herbs: ItemIdOption[];
        equipment: ItemIdOption[];
        avatars: ItemIdOption[]; // NEW: For avatar rewards
    };
    rarities: Option[];
    guilds: Option[];
    insights: Option[];
    animations: Option[];
};

export type GenericData = Record<string, any>;

export interface Rarity {
    id: string;
    name: string;
    style: any;
}