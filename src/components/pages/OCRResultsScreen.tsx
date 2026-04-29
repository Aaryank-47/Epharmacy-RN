
import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../hooks/useThemePalette';
import FilterModal from '../modals/FilterModal'; 

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// --- Types ---
interface Medicine {
  id: string;
  name: string;
  dosage: string;
  availableStoresCount: number;
}

interface Store {
  id: string;
  name: string;
  distance: string;
  availabilityCount: string; // e.g. "3/5"
  medicines: { name: string; available: boolean; price?: string }[];
}

interface OCRInfo {
  extractedText: string;
  doctorName: string;
  prescriptionDate: string;
  confidence: number;
  notes: string;
}

const OCRResultsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { isDark, accentColor, surfaceColor, textColor, backgroundColor, inputBg, placeholderColor } = useThemePalette();
  
  // Tabs
  const tabs = [
    { id: 'medical', label: 'Medical', icon: 'store-outline' },
    { id: 'medicines', label: 'Medicines', icon: 'pill' },
    { id: 'other', label: 'Other Info', icon: 'information-outline' },
    { id: 'bucket', label: 'Bucket', icon: 'basket-outline' },
  ];
  
  const [activeTab, setActiveTab] = useState('medical');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const toggleExpand = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  }, []);
  
  // Mock Data (In production, this would come from route.params or context)
  const mockMedicines: Medicine[] = [
    { id: 'm1', name: 'Amoxicillin 500mg', dosage: '500mg', availableStoresCount: 4 },
    { id: 'm2', name: 'Paracetamol 650mg', dosage: '650mg', availableStoresCount: 6 },
    { id: 'm3', name: 'Cetrizine 10mg', dosage: '10mg', availableStoresCount: 2 },
  ];

  const mockStores: Store[] = [
    {
      id: 's1',
      name: 'LifeCare Pharmacy',
      distance: '1.2 km away',
      availabilityCount: '3/3',
      medicines: [
        { name: 'Amoxicillin 500mg', available: true, price: '₹45' },
        { name: 'Paracetamol 650mg', available: true, price: '₹20' },
        { name: 'Cetrizine 10mg', available: true, price: '₹15' },
      ],
    },
    {
      id: 's2',
      name: 'Apollo Pharmacy',
      distance: '2.5 km away',
      availabilityCount: '2/3',
      medicines: [
        { name: 'Amoxicillin 500mg', available: true, price: '₹48' },
        { name: 'Paracetamol 650mg', available: true, price: '₹22' },
        { name: 'Cetrizine 10mg', available: false },
      ],
    },
  ];

  const ocrInfo: OCRInfo = {
    extractedText: 'Rx\nAmoxicillin 500mg tid x 5 days\nParacetamol 650mg prn for fever\nCetrizine 10mg hs x 3 days\nDr. Rajesh Kumar\n28/04/2026',
    doctorName: 'Dr. Rajesh Kumar',
    prescriptionDate: '28/04/2026',
    confidence: 92,
    notes: 'Text is clear. Dosage for Cetrizine might need confirmation.',
  };

  // --- Header ---
  const renderHeader = () => (
    <View className="flex-row items-center px-4 py-3" style={{ backgroundColor }}>
      <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
        <Ionicon name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <Text className="text-xl font-bold ml-4" style={{ color: textColor }}>
        Find Medicines & Stores
      </Text>
    </View>
  );

  // --- Search Bar ---
  const renderSearchBar = () => (
    <View className="px-4 mb-4 flex-row items-center">
      <View className="flex-1 flex-row items-center px-4 py-3 rounded-2xl" style={{ backgroundColor: inputBg, elevation: 1 }}>
        <Ionicon name="search-outline" size={20} color={placeholderColor} />
        <TextInput
          className="flex-1 ml-2 text-base"
          style={{ color: textColor, paddingVertical: 0 }}
          placeholder="Search medicines or stores..."
          placeholderTextColor={placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity className="p-1">
          <Ionicon name="mic-outline" size={22} color={accentColor} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        onPress={() => setShowFilterModal(true)}
        className="ml-3 p-3.5 rounded-2xl" 
        style={{ backgroundColor: accentColor, elevation: 4 }}
      >
        <Ionicon name="options-outline" size={22} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // --- Tab Pills ---
  const renderTabs = () => (
    <View className="mb-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-row items-center px-5 py-3 rounded-full mr-3 border ${isActive ? '' : 'border-transparent'}`}
              style={{
                backgroundColor: isActive ? accentColor : (isDark ? '#2D3038' : '#F3F4F6'),
                elevation: isActive ? 6 : 0,
              }}
            >
              <Icon name={tab.icon} size={18} color={isActive ? '#FFF' : (isDark ? '#AAA' : '#666')} />
              <Text 
                className="ml-2 font-semibold" 
                style={{ color: isActive ? '#FFF' : (isDark ? '#DDD' : '#444') }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // --- Tab Content: Medical ---
  const renderMedicalTab = () => (
    <FlatList
      data={mockStores}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      renderItem={({ item }) => {
        const isExpanded = expandedId === item.id;
        return (
          <View className="mb-4 rounded-3xl overflow-hidden shadow-sm" style={{ backgroundColor: isDark ? '#262A34' : '#FFF', elevation: 2 }}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => toggleExpand(item.id)}
              className="p-4 flex-row items-center"
            >
              <View className="w-14 h-14 rounded-2xl bg-blue-100 items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EBF5FF' }}>
                <Icon name="store-outline" size={30} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-lg font-bold" style={{ color: textColor }}>{item.name}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicon name="location-outline" size={14} color={placeholderColor} />
                  <Text className="text-sm ml-1" style={{ color: placeholderColor }}>{item.distance}</Text>
                </View>
              </View>
              <View className="items-end">
                <View className="bg-green-100 px-2 py-1 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#D1FAE5' }}>
                  <Text className="text-xs font-bold text-green-600">{item.availabilityCount} available</Text>
                </View>
                <Ionicon name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={placeholderColor} className="mt-2" />
              </View>
            </TouchableOpacity>
            
            {isExpanded && (
              <View className="px-4 pb-4 border-t" style={{ borderColor: isDark ? '#3D4048' : '#F3F4F6' }}>
                <Text className="text-xs font-bold uppercase mt-4 mb-2" style={{ color: placeholderColor }}>Medicines Availability</Text>
                {item.medicines.map((med, idx) => (
                  <View key={idx} className="flex-row justify-between items-center py-2.5">
                    <View className="flex-row items-center">
                      <Icon 
                        name={med.available ? "check-circle" : "close-circle"} 
                        size={18} 
                        color={med.available ? '#10B981' : '#EF4444'} 
                      />
                      <Text className="ml-2 font-medium" style={{ color: textColor }}>{med.name}</Text>
                    </View>
                    {med.available ? (
                      <Text className="font-bold text-base" style={{ color: accentColor }}>{med.price}</Text>
                    ) : (
                      <Text className="text-xs font-bold text-red-500 uppercase">Out of Stock</Text>
                    )}
                  </View>
                ))}
                <TouchableOpacity 
                  className="mt-4 py-4 rounded-2xl items-center" 
                  style={{ backgroundColor: accentColor, elevation: 4 }}
                >
                  <Text className="text-white font-bold text-base">Add to Bucket</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }}
    />
  );

  // --- Tab Content: Medicines ---
  const renderMedicinesTab = () => (
    <FlatList
      data={mockMedicines}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      renderItem={({ item }) => {
        const isExpanded = expandedId === item.id;
        return (
          <View className="mb-4 rounded-3xl overflow-hidden shadow-sm" style={{ backgroundColor: isDark ? '#262A34' : '#FFF', elevation: 2 }}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => toggleExpand(item.id)}
              className="p-4 flex-row items-center"
            >
              <View className="w-14 h-14 rounded-2xl bg-purple-100 items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(147, 51, 234, 0.1)' : '#F3E8FF' }}>
                <Icon name="pill" size={30} color={isDark ? '#A855F7' : '#9333EA'} />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-lg font-bold" style={{ color: textColor }}>{item.name}</Text>
                <Text className="text-sm font-medium" style={{ color: placeholderColor }}>Dosage: {item.dosage}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-bold text-blue-600" style={{ color: isDark ? '#60A5FA' : '#2563EB' }}>In {item.availableStoresCount} stores</Text>
                <Ionicon name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={placeholderColor} className="mt-2" />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View className="px-4 pb-4 border-t" style={{ borderColor: isDark ? '#3D4048' : '#F3F4F6' }}>
                <Text className="text-xs font-bold uppercase mt-4 mb-2" style={{ color: placeholderColor }}>Available in Stores</Text>
                {mockStores.map((store, idx) => {
                  const storeMed = store.medicines.find(m => m.name === item.name);
                  if (!storeMed || !storeMed.available) return null;
                  return (
                    <View key={idx} className="flex-row justify-between items-center py-3 border-b border-gray-50" style={{ borderBottomColor: isDark ? '#1F222A' : '#F9FAFB' }}>
                      <View>
                        <Text className="font-bold text-base" style={{ color: textColor }}>{store.name}</Text>
                        <View className="flex-row items-center mt-0.5">
                          <Ionicon name="location-outline" size={12} color={placeholderColor} />
                          <Text className="text-xs ml-1" style={{ color: placeholderColor }}>{store.distance}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold text-lg" style={{ color: accentColor }}>{storeMed.price}</Text>
                        <Text className="text-[10px] uppercase font-black text-green-600">In Stock</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      }}
    />
  );

  // --- Tab Content: Other Info ---
  const renderOtherInfoTab = () => (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View className="rounded-3xl p-6 mb-4 shadow-sm" style={{ backgroundColor: isDark ? '#262A34' : '#FFF', elevation: 2 }}>
        <Text className="text-xl font-bold mb-5" style={{ color: textColor }}>OCR Insights</Text>
        
        <View className="mb-6">
          <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: placeholderColor }}>Extracted Text Preview</Text>
          <View className="mt-3 p-4 rounded-2xl bg-gray-50 border border-gray-100" style={{ backgroundColor: isDark ? '#1F222A' : '#F9FAFB', borderColor: isDark ? '#3D4048' : '#F3F4F6' }}>
            <Text style={{ color: textColor, lineHeight: 24, fontSize: 15 }}>{ocrInfo.extractedText}</Text>
          </View>
        </View>

        <View className="flex-row mb-6">
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: placeholderColor }}>Detected Doctor</Text>
            <View className="flex-row items-center mt-2">
              <Icon name="account-tie-outline" size={20} color={accentColor} />
              <Text className="text-base font-bold ml-2" style={{ color: textColor }}>{ocrInfo.doctorName}</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: placeholderColor }}>Prescription Date</Text>
            <View className="flex-row items-center mt-2">
              <Icon name="calendar-outline" size={18} color={accentColor} />
              <Text className="text-base font-bold ml-2" style={{ color: textColor }}>{ocrInfo.prescriptionDate}</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: placeholderColor }}>OCR Confidence Level</Text>
          <View className="flex-row items-center">
             <View className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#3D4048' : '#F3F4F6' }}>
               <View className="h-full bg-green-500" style={{ width: `${ocrInfo.confidence}%` }} />
             </View>
             <Text className="ml-4 font-black text-lg" style={{ color: '#10B981' }}>{ocrInfo.confidence}%</Text>
          </View>
        </View>

        <View>
          <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: placeholderColor }}>Notes / Warnings</Text>
          <View className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex-row items-start" style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB', borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }}>
            <Ionicon name="warning" size={20} color="#D97706" style={{ marginTop: 1 }} />
            <Text className="ml-3 flex-1 text-sm leading-5 font-medium" style={{ color: isDark ? '#F59E0B' : '#D97706' }}>{ocrInfo.notes}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // --- Tab Content: Bucket ---
  const renderBucketTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 180 }}>
        {mockStores.slice(0, 1).map((store) => (
          <View key={store.id} className="rounded-3xl p-6 mb-4 shadow-sm" style={{ backgroundColor: isDark ? '#262A34' : '#FFF', elevation: 2 }}>
            <View className="flex-row justify-between items-center mb-5">
              <View>
                <Text className="text-xl font-bold" style={{ color: textColor }}>{store.name}</Text>
                <Text className="text-xs font-medium mt-0.5" style={{ color: placeholderColor }}>Items ready for pickup</Text>
              </View>
              <TouchableOpacity className="p-2 bg-red-50 rounded-full" style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }}>
                <Ionicon name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {store.medicines.map((med, idx) => (
              <View key={idx} className="flex-row justify-between items-center py-3.5 border-b border-gray-50" style={{ borderBottomColor: isDark ? '#1F222A' : '#F9FAFB' }}>
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center mr-4" style={{ backgroundColor: isDark ? '#1F222A' : '#F3F4F6' }}>
                    <Icon name="pill" size={18} color={accentColor} />
                  </View>
                  <View>
                    <Text className="font-bold text-base" style={{ color: textColor }}>{med.name}</Text>
                    <Text className="text-[10px] uppercase font-bold text-blue-600">Prescribed</Text>
                  </View>
                </View>
                <Text className="font-black text-lg" style={{ color: textColor }}>{med.price}</Text>
              </View>
            ))}

            <View className="mt-5 pt-5 border-t border-gray-100 flex-row justify-between items-center" style={{ borderTopColor: isDark ? '#3D4048' : '#F3F4F6' }}>
              <Text className="text-base font-bold" style={{ color: textColor }}>Subtotal</Text>
              <Text className="text-2xl font-black" style={{ color: accentColor }}>₹80.00</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Sticky Bottom Summary Container */}
      <View 
        className="absolute bottom-0 left-0 right-0 p-6 rounded-t-[40px] shadow-2xl" 
        style={{ 
          backgroundColor: isDark ? '#1F222A' : '#000',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: isDark ? '#AAA' : '#666' }}>Estimated Total</Text>
            <Text className="text-3xl font-black mt-1" style={{ color: '#FFF' }}>₹80.00</Text>
          </View>
          <View className="items-end">
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-xs font-bold text-white">3 Medicines</Text>
            </View>
            <Text className="text-[10px] mt-1 font-medium" style={{ color: '#888' }}>Tax included in price</Text>
          </View>
        </View>
        <TouchableOpacity 
          className="py-4.5 rounded-2xl items-center shadow-lg" 
          style={{ backgroundColor: accentColor }}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ShoppingBagScreen')}
        >
          <Text className="text-white font-bold text-lg uppercase tracking-wider">Proceed to Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
      <View style={{ paddingTop: Platform.OS === 'ios' ? 50 : 10 }}>
        {renderHeader()}
        {renderSearchBar()}
        {renderTabs()}
      </View>
      
      <View className="flex-1">
        {activeTab === 'medical' && renderMedicalTab()}
        {activeTab === 'medicines' && renderMedicinesTab()}
        {activeTab === 'other' && renderOtherInfoTab()}
        {activeTab === 'bucket' && renderBucketTab()}
      </View>

      <FilterModal 
        visible={showFilterModal} 
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          console.log('Applied filters:', filters);
          // Here you would typically filter your data based on the applied criteria
        }}
      />
    </View>
  );
};

export default OCRResultsScreen;
