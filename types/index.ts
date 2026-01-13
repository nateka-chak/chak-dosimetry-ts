export interface dosimeter {
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
  courier_name?: string;
  courier_staff?: string;
  status: 'dispatched' | 'in_transit' | 'delivered' | 'returned';
  dispatched_at: Date;
  estimated_delivery?: Date;
  created_at: Date;
  items?: number;
  delivered_at?: string;
  returned_at?: string;
  serialNumber?: string;
  dispatchDate?: any;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export interface Option {
  id: number;
  serial_number: string;
  model?: string;
  type?: string;
  status?: string;
  hospital_name?: string;
}

export interface DispatchFormData {
  dispatchType: "toHospital" | "toChak";
  hospital: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  courierName: string;
  courierStaff: string;
  dosimeters: Option[];
  comment: string;
  supplies: {
    device: boolean;
    case: boolean;
    pin: boolean;
    strap: boolean;
  };
  newStatus?: string; // Added to hold the new status based on dispatch type
}

export interface ReceiveFormData {
  shipmentId: number | null;
  hospitalName: string;
  receiverName: string;
  receiverTitle: string;
  receiveType: "fromHospital" | "fromChak";
  dosimeters: Option[]; // this alone is enough
  dosimeterDevice: boolean;
  dosimeterCase: boolean;
  pinForHolder: boolean;
  strapClipForHolder: boolean;
  comment: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
