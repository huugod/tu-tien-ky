export interface Herb {
  id: string;
  name: string;
  description: string;
}

export const HERBS: Herb[] = [
    { id: 'linh_thao', name: 'Linh Thảo', description: 'Loại cỏ dại phổ biến, chứa một ít linh khí.' },
    { id: 'huyet_tham', name: 'Huyết Sâm', description: 'Loại sâm quý mọc ở nơi âm khí nặng, có tác dụng bổ khí huyết.' },
    { id: 'tinh_nguyet_hoa', name: 'Tinh Nguyệt Hoa', description: 'Bông hoa chỉ nở vào đêm trăng tròn, hấp thụ tinh hoa của trời đất.'}
];
