export interface Dosimetry {
  id: number;
  serial_number: string;
  status: 'dispatched' | 'in_transit' | 'received';
  dispatched_at: Date;
  received_at?: Date;
  hospital_name?: string;
  received_by?: string;
  receiver_title?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Shipment {
  id: number;
  destination: string;
  address?: string;
  contact_person: string;
  contact_phone: string;
  status: 'dispatched' | 'in_transit' | 'delivered';
  dispatched_at: Date;
  estimated_delivery?: Date;
  created_at: Date;
  items?: number;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export interface DispatchFormData {
  hospital: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  dosimetries: string[];
}

export interface ReceiveFormData {
  hospitalName: string;
  receiverName: string;
  receiverTitle: string;
  serialNumbers: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
