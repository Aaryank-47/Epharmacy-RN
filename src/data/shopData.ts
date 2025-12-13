/**
 * Hardcoded Shop Data for Raipur
 * Contains shop details: name, address, contact, distance, and available medicines
 */

export interface Medicine {
  name: string;
  price: number;
}

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
  availableMedicines: Medicine[]; // Generic medicine names available with price
}

export const RAIPUR_SHOPS: Shop[] = [
  {
    id: 'shop_SN_001',
    name: 'Satyam Medical Store',
    address: 'Durga Para, Santoshi Nagar, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9827123456',
    email: 'satyam.medical@raipur.com',
    distance: 3.1,
    isOpen: true,
    openTime: '09:00 AM',
    closeTime: '09:00 PM',
    latitude: 21.2391,
    longitude: 81.6294,
    availableMedicines: [
      { name: 'Paracetamol', price: 24 },
      { name: 'Ibuprofen', price: 45 },
      { name: 'Cough Syrup', price: 105 },
      { name: 'Cetirizine', price: 30 },
    ],
  },
  {
    id: 'shop_SN_002',
    name: 'Laxmi Medical Store',
    address: 'Main Road, Santoshi Nagar, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9893456781',
    email: 'laxmi.medical@raipur.com',
    distance: 3.0,
    isOpen: true,
    openTime: '08:30 AM',
    closeTime: '10:00 PM',
    latitude: 21.2402,
    longitude: 81.6301,
    availableMedicines: [
      { name: 'Paracetamol', price: 22 },
      { name: 'Amoxicillin', price: 90 },
      { name: 'Pantoprazole', price: 80 },
    ],
  },
  {
    id: 'shop_SN_003',
    name: 'Shubham Medical Store',
    address: 'Pragati Vihar Colony, Santoshi Nagar, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9754212345',
    email: 'shubham.medical@raipur.com',
    distance: 3.3,
    isOpen: true,
    openTime: '09:00 AM',
    closeTime: '09:30 PM',
    latitude: 21.2387,
    longitude: 81.6286,
    availableMedicines: [
      { name: 'Paracetamol', price: 23 },
      { name: 'Ibuprofen', price: 46 },
      { name: 'Cetirizine', price: 40 },
      { name: 'Pantoprazole', price: 75 },
    ],
  },
  {
    id: 'shop_SN_004',
    name: 'Arihant Medical Store',
    address: 'Nahar Road, Santoshi Nagar, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9811122334',
    email: 'arihant.medical@raipur.com',
    distance: 3.4,
    isOpen: true,
    openTime: '09:30 AM',
    closeTime: '10:30 PM',
    latitude: 21.2379,
    longitude: 81.6310,
    availableMedicines: [
      { name: 'Ibuprofen', price: 48 },
      { name: 'Pantoprazole', price: 78 },
      { name: 'Cough Syrup', price: 110 },
    ],
  },
  {
    id: 'shop_SN_005',
    name: 'Apollo Pharmacy – Santoshi Nagar',
    address: 'Old Dhamtari Road, Santoshi Nagar, Raipur',
    city: 'Raipur',
    contactNumber: '+91-7714001935',
    email: 'apollo.santoshi@raipur.com',
    distance: 3.2,
    isOpen: true,
    openTime: '07:00 AM',
    closeTime: '11:00 PM',
    latitude: 21.2410,
    longitude: 81.6322,
    availableMedicines: [
      { name: 'Paracetamol', price: 25 },
      { name: 'Ibuprofen', price: 50 },
      { name: 'Amoxicillin', price: 95 },
      { name: 'Metformin', price: 45 },
    ],
  },
  {
    id: 'shop_SN_006',
    name: 'Dava India – Generic Pharmacy',
    address: 'Santoshi Nagar Road, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9009911223',
    email: 'davaindia@raipur.com',
    distance: 3.5,
    isOpen: true,
    openTime: '09:00 AM',
    closeTime: '10:00 PM',
    latitude: 21.2368,
    longitude: 81.6335,
    availableMedicines: [
      { name: 'Paracetamol', price: 15 },
      { name: 'Pantoprazole', price: 25 },
      { name: 'Metformin', price: 30 },
    ],
  },
  {
    id: 'shop_SN_007',
    name: 'Gupta Medical Store',
    address: 'Santoshi Nagar Chowk, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9827011122',
    email: 'gupta.medical@raipur.com',
    distance: 3.1,
    isOpen: true,
    openTime: '08:00 AM',
    closeTime: '10:00 PM',
    latitude: 21.2408,
    longitude: 81.6299,
    availableMedicines: [
      { name: 'Paracetamol', price: 22 },
      { name: 'Ibuprofen', price: 45 },
      { name: 'Cough Syrup', price: 110 },
    ],
  },
  {
    id: 'shop_SN_008',
    name: 'New Santoshi Medical',
    address: 'Durga Para Lane, Santoshi Nagar, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9755099988',
    email: 'newsantoshi@raipur.com',
    distance: 3.4,
    isOpen: true,
    openTime: '09:00 AM',
    closeTime: '09:30 PM',
    latitude: 21.2395,
    longitude: 81.6281,
    availableMedicines: [
      { name: 'Pantoprazole', price: 35 },
      { name: 'Cetirizine', price: 30 },
    ],
  },
  {
    id: 'shop_SN_009',
    name: 'Maa Santoshi Medical Store',
    address: 'Main Santoshi Nagar Road, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9301203344',
    email: 'maasantoshi@raipur.com',
    distance: 3.6,
    isOpen: true,
    openTime: '08:30 AM',
    closeTime: '10:30 PM',
    latitude: 21.2374,
    longitude: 81.6328,
    availableMedicines: [
      { name: 'Paracetamol', price: 24 },
      { name: 'Metformin', price: 45 },
      { name: 'Amoxicillin', price: 92 },
    ],
  },
  {
    id: 'shop_SN_010',
    name: 'Shree Balaji Medical',
    address: 'Pragati Vihar Colony, Santoshi Nagar, Raipur',
    city: 'Raipur',
    contactNumber: '+91-9893222110',
    email: 'balaji.medical@raipur.com',
    distance: 3.2,
    isOpen: true,
    openTime: '09:00 AM',
    closeTime: '09:00 PM',
    latitude: 21.2382,
    longitude: 81.6307,
    availableMedicines: [
      { name: 'Paracetamol', price: 22 },
      { name: 'Cetirizine', price: 30 },
      { name: 'Cough Syrup', price: 108 },
    ],
  },
];


/**
 * Function to find shops that have a specific medicine
 */
export const findShopsWithMedicine = (medicineName: string): Shop[] => {
  return RAIPUR_SHOPS.filter(shop =>
    shop.availableMedicines.some(medicine =>
      medicine.name.toLowerCase().includes(medicineName.toLowerCase())
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
