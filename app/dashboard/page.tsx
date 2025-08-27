'use client';

import { motion } from 'framer-motion';
import DashboardStats from '@/components/Dashboard/Dashboard';
import ShipmentCard from '@/components/Dashboard/ShipmentCard';
import StatusTimeline from '@/components/Dashboard/StatusTimeline';
import { Shipment } from '@/types';

// Example dummy shipment data for demonstration
const exampleShipments: Shipment[] = [
  {
    id: 1,
    destination: 'PCEA Kikuyu Hospital',
    address: '123 Main St, kikuyu',
    contact_person: 'Dr. Smith',
    contact_phone: '071-456-7890',
    status: 'dispatched',
    dispatched_at: new Date().toISOString(),
    items: 10,
  },
  {
    id: 2,
    destination: 'County Clinic',
    address: '456 Elm St, Machakos',
    contact_person: 'Nurse Jane',
    contact_phone: '011-654-3210',
    status: 'in_transit',
    dispatched_at: new Date().toISOString(),
    items: 5,
  },
  {
    id: 3,
    destination: 'General Hospital',
    address: '789 Wtn St, Bungoma',
    contact_person: 'Dr. Lee',
    contact_phone: '075-123-4567',
    status: 'delivered',
    dispatched_at: new Date().toISOString(),
    items: 8,
  },
  {
    id: 4,
    destination: 'Nairobi West Hospital',
    address: '12 Langata Rd, Nairobi',
    contact_person: 'Dr. Achieng',
    contact_phone: '0722-100-200',
    status: 'in_transit',
    dispatched_at: new Date().toISOString(),
    items: 15,
  },
  {
    id: 5,
    destination: 'Aga Khan University Hospital',
    address: '3rd Parklands Ave, Nairobi',
    contact_person: 'Prof. Kamau',
    contact_phone: '0733-111-222',
    status: 'dispatched',
    dispatched_at: new Date().toISOString(),
    items: 20,
  },
  {
    id: 6,
    destination: 'Mater Hospital',
    address: 'Doonholm Rd, Nairobi',
    contact_person: 'Sister Wanjiru',
    contact_phone: '0725-222-333',
    status: 'in_transit',
    dispatched_at: new Date().toISOString(),
    items: 12,
  },
  {
    id: 7,
    destination: 'Moi Teaching & Referral Hospital',
    address: 'Nandi Rd, Eldoret',
    contact_person: 'Dr. Kiptoo',
    contact_phone: '0790-333-444',
    status: 'delivered',
    dispatched_at: new Date().toISOString(),
    items: 18,
  },
  {
    id: 8,
    destination: 'Kenyatta National Hospital',
    address: 'Ngong Rd, Nairobi',
    contact_person: 'Dr. Nyambura',
    contact_phone: '0701-444-555',
    status: 'pending',
    dispatched_at: new Date().toISOString(),
    items: 25,
  },
  {
    id: 9,
    destination: 'Coast General Hospital',
    address: 'Makadara Rd, Mombasa',
    contact_person: 'Nurse Ali',
    contact_phone: '0720-555-666',
    status: 'dispatched',
    dispatched_at: new Date().toISOString(),
    items: 9,
  },
  {
    id: 10,
    destination: 'Kisii Teaching & Referral Hospital',
    address: 'Kisii Town',
    contact_person: 'Dr. Ogeto',
    contact_phone: '0734-666-777',
    status: 'in_transit',
    dispatched_at: new Date().toISOString(),
    items: 7,
  },
  {
    id: 11,
    destination: 'Machakos Level 5 Hospital',
    address: 'Kangundo Rd, Machakos',
    contact_person: 'Dr. Musyoka',
    contact_phone: '0712-777-888',
    status: 'delivered',
    dispatched_at: new Date().toISOString(),
    items: 14,
  },
  {
    id: 12,
    destination: 'Nyeri County Referral Hospital',
    address: 'Ring Rd, Nyeri',
    contact_person: 'Dr. Maina',
    contact_phone: '0755-888-999',
    status: 'delivered',
    dispatched_at: new Date().toISOString(),
    items: 6,
  },
  {
    id: 13,
    destination: 'Kakamega General Hospital',
    address: 'Bukura Rd, Kakamega',
    contact_person: 'Nurse Wekesa',
    contact_phone: '0760-999-000',
    status: 'dispatched',
    dispatched_at: new Date().toISOString(),
    items: 11,
  },
  {
    id: 14,
    destination: 'Kericho County Hospital',
    address: 'Kericho Town',
    contact_person: 'Dr. Rono',
    contact_phone: '0799-101-202',
    status: 'in_transit',
    dispatched_at: new Date().toISOString(),
    items: 8,
  },
  {
    id: 15,
    destination: 'Garissa County Referral Hospital',
    address: 'Garissa Town',
    contact_person: 'Dr. Hassan',
    contact_phone: '0707-303-404',
    status: 'delivered',
    dispatched_at: new Date().toISOString(),
    items: 10,
  },
  {
    id: 16,
    destination: 'Kitale County Hospital',
    address: 'Kitale Town',
    contact_person: 'Nurse Chebet',
    contact_phone: '0724-505-606',
    status: 'in_transit',
    dispatched_at: new Date().toISOString(),
    items: 13,
  },
  {
    id: 17,
    destination: 'Thika Level 5 Hospital',
    address: 'Thika Town',
    contact_person: 'Dr. Kariuki',
    contact_phone: '0730-606-707',
    status: 'dispatched',
    dispatched_at: new Date().toISOString(),
    items: 19,
  },
  {
    id: 18,
    destination: 'Isiolo County Hospital',
    address: 'Isiolo Town',
    contact_person: 'Dr. Noor',
    contact_phone: '0740-707-808',
    status: 'in_transit',
    dispatched_at: new Date().toISOString(),
    items: 4,
  },
  {
    id: 19,
    destination: 'Meru Teaching & Referral Hospital',
    address: 'Meru Town',
    contact_person: 'Prof. Gitonga',
    contact_phone: '0719-808-909',
    status: 'delivered',
    dispatched_at: new Date().toISOString(),
    items: 16,
  },
  {
    id: 20,
    destination: 'Nakuru Level 5 Hospital',
    address: 'Nakuru Town',
    contact_person: 'Dr. Wairimu',
    contact_phone: '0722-909-101',
    status: 'delivered',
    dispatched_at: new Date().toISOString(),
    items: 21,
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-8 space-y-10">
      {/* Dashboard Stats */}
      <DashboardStats shipments={exampleShipments} />

      {/* Shipments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exampleShipments.map((shipment) => (
          <motion.div
            key={shipment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ShipmentCard shipment={shipment} />
          </motion.div>
        ))}
      </div>

      {/* Example: Timeline for first shipment */}
      <div className="max-w-2xl mx-auto">
        <StatusTimeline
          status={exampleShipments[0].status}
          dispatchDate={new Date(exampleShipments[0].dispatched_at)}
        />
      </div>
    </div>
  );
}
