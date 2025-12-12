/**
 * Hardcoded Shop Data for Raipur
 * Contains shop details: name, address, contact, distance, and available medicines
 */

export interface Shop {
  id: string;
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  email: string;
  distance: number; // in km
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  latitude: number;
  longitude: number;
  availableMedicines: string[]; // Generic medicine names available
}

export const RAIPUR_SHOPS: Shop[] = [
  {
    id: 'shop_001',
    name: 'MediCare Plus Pharmacy',
    address: 'Plot No. 15, Ravindranagar, Civil Lines, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9876543210',
    email: 'medcare.raipur@pharmacy.com',
    distance: 1.2,
    isOpen: true,
    openTime: '08:00 AM',
    closeTime: '10:00 PM',
    latitude: 21.2506,
    longitude: 81.6171,
    availableMedicines: [
      'Ibuprofen',
      'Paracetamol',
      'Amoxicillin',
      'Cough Syrup',
      'Vitamin D',
      'Aspirin',
      'Diclofenac',
      'Omeprazole',
    ],
  },
  {
    id: 'shop_002',
    name: 'HealthFirst Chemist',
    address: 'Amanaka Chowk, High School Road, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9765432109',
    email: 'healthfirst.raipur@mail.com',
    distance: 2.5,
    isOpen: true,
    openTime: '09:00 AM',
    closeTime: '09:30 PM',
    latitude: 21.2411,
    longitude: 81.6307,
    availableMedicines: [
      'Paracetamol',
      'Ibuprofen',
      'Antibiotics',
      'Cough Syrup',
      'Antacid',
      'Blood Pressure Medicine',
      'Diabetes Medicine',
    ],
  },
  {
    id: 'shop_003',
    name: 'Royal Pharmacy Store',
    address: 'Shastri Nagar, Lakhanpur Road, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9654321098',
    email: 'royal.pharmacy@business.com',
    distance: 3.8,
    isOpen: true,
    openTime: '07:00 AM',
    closeTime: '11:00 PM',
    latitude: 21.2245,
    longitude: 81.6404,
    availableMedicines: [
      'Ibuprofen',
      'Aspirin',
      'Paracetamol',
      'Cough Syrup',
      'Vitamin Supplements',
      'Pain Relief Gel',
      'Antihistamine',
      'Sleeping Pills',
    ],
  },
  {
    id: 'shop_004',
    name: 'Prime Medical Pharmacy',
    address: 'Tilak Nagar, Tatanagar Road, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9543210987',
    email: 'prime.medical@pharmacy.net',
    distance: 4.1,
    isOpen: true,
    openTime: '08:30 AM',
    closeTime: '10:00 PM',
    latitude: 21.2156,
    longitude: 81.6289,
    availableMedicines: [
      'Paracetamol',
      'Ibuprofen',
      'Cough Syrup',
      'Amoxicillin',
      'Metformin',
      'Lisinopril',
      'Atorvastatin',
      'Multivitamin',
    ],
  },
  {
    id: 'shop_005',
    name: 'QuickCure Chemist',
    address: 'Gondwana Bazaar, Main Market, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9432109876',
    email: 'quickcure.raipur@contact.com',
    distance: 1.8,
    isOpen: true,
    openTime: '08:00 AM',
    closeTime: '09:00 PM',
    latitude: 21.2598,
    longitude: 81.6145,
    availableMedicines: [
      'Ibuprofen',
      'Paracetamol',
      'Cough Syrup',
      'Antibiotic Ointment',
      'Bandages',
      'Thermometer',
      'Antacid',
      'Allergy Medicine',
    ],
  },
  {
    id: 'shop_006',
    name: 'Wellness Pharmacy Hub',
    address: 'Fafadih, Ring Road, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9321098765',
    email: 'wellness.hub@pharmacy.com',
    distance: 5.2,
    isOpen: true,
    openTime: '07:30 AM',
    closeTime: '10:30 PM',
    latitude: 21.1876,
    longitude: 81.6512,
    availableMedicines: [
      'Paracetamol',
      'Ibuprofen',
      'Aspirin',
      'Cough Syrup',
      'Vitamin D3',
      'Calcium Supplements',
      'Joint Pain Relief',
      'Sleeping Aids',
      'Ringguard'
    ],
  },
  {
    id: 'shop_007',
    name: 'CarePoint Medicines',
    address: 'Pandri, CG College Road, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9210987654',
    email: 'carepoint.medicines@mail.com',
    distance: 2.3,
    isOpen: true,
    openTime: '08:00 AM',
    closeTime: '09:30 PM',
    latitude: 21.2389,
    longitude: 81.6456,
    availableMedicines: [
      'Ibuprofen',
      'Paracetamol',
      'Amoxicillin',
      'Cough Syrup',
      'Antihistamine',
      'Decongestant',
      'Throat Lozenges',
      'Indigestion Tablets',
      'luliconazole'
    ],
  },
  {
    id: 'shop_008',
    name: 'LifePlus Pharmacy',
    address: 'Vidhan Sabha Road, Near Hospital, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9109876543',
    email: 'lifeplus.raipur@service.com',
    distance: 3.4,
    isOpen: true,
    openTime: '08:00 AM',
    closeTime: '11:00 PM',
    latitude: 21.2001,
    longitude: 81.6378,
    availableMedicines: [
      'Paracetamol',
      'Ibuprofen',
      'Aspirin',
      'Cough Syrup',
      'Blood Pressure Medicine',
      'Heart Medicine',
      'Diabetes Medicine',
      'Thyroid Medicine',
    ],
  },
  {
    id: 'shop_009',
    name: 'HealthBridge Medical Store',
    address: 'Amanaka, Super Market Area, Raipur',
    city: 'Raipur',
    contactNumber: '+91-8998765432',
    email: 'healthbridge.store@pharmacy.net',
    distance: 2.7,
    isOpen: true,
    openTime: '08:00 AM',
    closeTime: '10:00 PM',
    latitude: 21.2445,
    longitude: 81.6289,
    availableMedicines: [
      'Ibuprofen',
      'Paracetamol',
      'Cough Syrup',
      'Antibiotic',
      'Antifungal Cream',
      'Pain Relief Spray',
      'Muscle Relaxant',
      'Anti-Anxiety Medicine',
    ],
  },
  {
    id: 'shop_010',
    name: 'SafeCare Pharmacy',
    address: 'Jaistambh Chowk, Congress Avenue, Raipur',
    city: 'Raipur',
    contactNumber: '+91-8887654321',
    email: 'safecare.pharmacy@contact.com',
    distance: 1.5,
    isOpen: true,
    openTime: '07:30 AM',
    closeTime: '10:00 PM',
    latitude: 21.2534,
    longitude: 81.6234,
    availableMedicines: [
      'Paracetamol',
      'Ibuprofen',
      'Aspirin',
      'Cough Syrup',
      'First Aid Kit',
      'Dressing Material',
      'Antibiotic Powder',
      'Steroid Cream',
    ],
  },
  {
    id: 'shop_011',
    name: 'VitaPlus Chemist',
    address: 'Kota, Tatanagar, Raipur',
    city: 'Raipur',
    contactNumber: '+91-8776543210',
    email: 'vitaplus.chemist@mail.com',
    distance: 4.6,
    isOpen: true,
    openTime: '08:00 AM',
    closeTime: '09:00 PM',
    latitude: 21.1945,
    longitude: 81.6601,
    availableMedicines: [
      'Ibuprofen',
      'Paracetamol',
      'Vitamin Supplements',
      'Cough Syrup',
      'Mineral Supplements',
      'Immune Booster',
      'Energy Drink',
      'Protein Powder',
    ],
  },
  {
    id: 'shop_012',
    name: 'Apollo Medical Center',
    address: 'Raipur Central District, Main Bazaar, Raipur',
    city: 'Raipur',
    contactNumber: '+91-8665432109',
    email: 'apollo.medical@hospital.com',
    distance: 2.9,
    isOpen: true,
    openTime: '08:00 AM',
    closeTime: '11:00 PM',
    latitude: 21.2367,
    longitude: 81.6423,
    availableMedicines: [
      'Paracetamol',
      'Ibuprofen',
      'Amoxicillin',
      'Cough Syrup',
      'Prescription Medicines',
      'Cardiac Medicine',
      'Respiratory Medicine',
      'Neurological Medicine',
    ],
  },
];

/**
 * Function to find shops that have a specific medicine
 */
export const findShopsWithMedicine = (medicineName: string): Shop[] => {
  return RAIPUR_SHOPS.filter(shop =>
    shop.availableMedicines.some(medicine =>
      medicine.toLowerCase().includes(medicineName.toLowerCase())
    )
  ).sort((a, b) => a.distance - b.distance); // Sort by distance
};

/**
 * Function to get all shops sorted by distance
 */
export const getAllShopsSortedByDistance = (): Shop[] => {
  return [...RAIPUR_SHOPS].sort((a, b) => a.distance - b.distance);
};

/**
 * Function to get a shop by ID
 */
export const getShopById = (shopId: string): Shop | undefined => {
  return RAIPUR_SHOPS.find(shop => shop.id === shopId);
};
