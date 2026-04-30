
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
  ImageBackground,
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
  price: string;
  discount: string;
  prescribed: boolean;
  genericAvailable: boolean;
}

interface Store {
  id: string;
  name: string;
  distance: string;
  time: string;
  rating: string;
  isVerified: boolean;
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
  
  // Medicare Specific Tokens
  const themeBg = '#08090D';
  const cardBg = '#14161C';
  const pinkAccent = '#F472B6';
  const textWhite = '#FFFFFF';
  const textGray = '#9CA3AF';

  // Tabs
  const tabs = [
    { id: 'medical', label: 'Medical Stores', icon: 'storefront-outline' },
    { id: 'medicines', label: 'Medicines', icon: 'link-variant' },
    { id: 'other', label: 'OCR Insights', icon: 'star-four-points-outline' },
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
  
  // Mock Data
  const mockMedicines: Medicine[] = [
    { 
      id: 'm1', name: 'Amoxicillin', dosage: '500mg', 
      availableStoresCount: 4, price: '₹45', discount: '13% OFF', 
      prescribed: true, genericAvailable: true 
    },
    { 
      id: 'm2', name: 'Paracetamol', dosage: '650mg', 
      availableStoresCount: 6, price: '₹20', discount: '17% OFF', 
      prescribed: true, genericAvailable: false 
    },
    { 
      id: 'm3', name: 'Cetrizine', dosage: '10mg', 
      availableStoresCount: 2, price: '₹15', discount: '11% OFF', 
      prescribed: true, genericAvailable: true 
    },
  ];

  const mockStores: Store[] = [
    {
      id: 's1',
      name: 'LifeCare Pharmacy',
      distance: '1.2 km',
      time: '8 min',
      rating: '4.8',
      isVerified: true,
      availabilityCount: '3/3',
      medicines: [
        { name: 'Amoxicillin', available: true, price: '₹45' },
        { name: 'Paracetamol', available: true, price: '₹20' },
        { name: 'Cetrizine', available: true, price: '₹15' },
      ],
    },
    {
      id: 's2',
      name: 'Apollo Pharmacy',
      distance: '2.5 km',
      time: '12 min',
      rating: '4.5',
      isVerified: true,
      availabilityCount: '2/3',
      medicines: [
        { name: 'Amoxicillin', available: true, price: '₹48' },
        { name: 'Paracetamol', available: true, price: '₹22' },
        { name: 'Cetrizine', available: false },
      ],
    },
  ];

  const ocrInfo: OCRInfo = {
    extractedText: 'Rx\nAmoxicillin 500mg - 1 tab tid x 5 days\nParacetamol 650mg - prn for fever\nCetrizine 10mg - 1 tab hs x 3 days\nSigned,\nDr. R. Kumar',
    doctorName: 'Dr. R. Kumar',
    prescriptionDate: '28 Apr 2026',
    confidence: 100,
    notes: 'Text is clear. Dosage for Cetrizine might need confirmation.',
  };

  // --- Header ---
  const renderHeader = () => (
    <View className="px-4 py-3 pb-1" style={{ backgroundColor: themeBg }}>
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2 bg-white/5 rounded-full">
          <Ionicon name="arrow-back" size={20} color={textWhite} />
        </TouchableOpacity>
        <View>
          <Text className="text-[10px] font-black tracking-widest uppercase mb-0.5" style={{ color: pinkAccent }}>MEDICARE</Text>
          <Text className="text-xl font-bold" style={{ color: textWhite }}>
            Find Medicines
          </Text>
        </View>
        <View className="flex-1" />
        <TouchableOpacity className="p-2 border border-white/10 rounded-xl relative">
          <Icon name="basket-outline" size={24} color={textWhite} />
          <View className="absolute -top-1 -right-1 bg-pink-500 w-5 h-5 rounded-full items-center justify-center">
            <Text className="text-white text-[10px] font-bold">3</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Search Bar ---
  const renderSearchBar = () => (
    <View className="px-4 mt-4 mb-4 flex-row items-center">
      <View className="flex-1 flex-row items-center px-4 py-3.5 rounded-full border border-white/5" style={{ backgroundColor: cardBg }}>
        <Ionicon name="search-outline" size={18} color={textGray} />
        <TextInput
          className="flex-1 ml-2 text-sm"
          style={{ color: textWhite, paddingVertical: 0 }}
          placeholder="Amoxicillin, paracetamol..."
          placeholderTextColor={textGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity className="p-1">
          <Ionicon name="mic-outline" size={20} color={textGray} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        onPress={() => setShowFilterModal(true)}
        className="ml-3 p-3.5 rounded-2xl items-center justify-center" 
        style={{ 
          backgroundColor: pinkAccent, 
          shadowColor: pinkAccent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Icon name="tune-variant" size={22} color="#000" />
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
              className="flex-row items-center px-4 py-2.5 rounded-full mr-3 border border-white/5"
              style={{
                backgroundColor: isActive ? pinkAccent : cardBg,
                shadowColor: isActive ? pinkAccent : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isActive ? 0.3 : 0,
                shadowRadius: 8,
                elevation: isActive ? 8 : 0,
              }}
            >
              <Icon name={tab.icon} size={16} color={isActive ? '#000' : textGray} />
              <Text 
                className="ml-2 text-xs font-bold" 
                style={{ color: isActive ? '#000' : textGray }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // --- Tab Content: Medical Stores ---
  const renderMedicalTab = () => (
    <View style={{ flex: 1 }}>
      <View className="flex-row justify-between items-center px-5 mb-3">
        <Text className="text-white font-bold"><Text className="font-black">3 stores</Text> within 5 km</Text>
        <View className="flex-row bg-white/10 rounded-full">
          <TouchableOpacity className="p-2 bg-pink-400 rounded-full shadow-lg shadow-pink-500/50">
            <Icon name="format-list-bulleted" size={16} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 rounded-full">
            <Icon name="map-outline" size={16} color={textWhite} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {/* Placeholder for Map View */}
        <View className="h-48 rounded-3xl mb-4 border border-white/10 overflow-hidden bg-gray-900 justify-center items-center">
             <Icon name="map" size={48} color="#333" />
             <Text className="text-gray-500 font-bold mt-2">Map View Placeholder</Text>
        </View>

        {mockStores.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} className="mb-4 rounded-3xl overflow-hidden border border-white/5" style={{ backgroundColor: cardBg }}>
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => toggleExpand(item.id)}
                className="p-5 flex-row items-center"
              >
                <View className="w-12 h-12 rounded-2xl items-center justify-center relative" style={{ backgroundColor: '#1E293B' }}>
                  <Icon name="storefront-outline" size={24} color="#60A5FA" />
                  <View className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                </View>
                <View className="flex-1 ml-4">
                  <View className="flex-row items-center">
                    <Text className="text-base font-bold" style={{ color: textWhite }}>{item.name}</Text>
                    {item.isVerified && <Icon name="check-decagram" size={14} color="#3B82F6" className="ml-1" />}
                  </View>
                  <View className="flex-row items-center mt-1">
                    <Icon name="walk" size={12} color={textGray} />
                    <Text className="text-xs ml-1" style={{ color: textGray }}>{item.distance}</Text>
                    <Text className="text-xs mx-1.5" style={{ color: textGray }}>•</Text>
                    <Icon name="clock-outline" size={12} color={textGray} />
                    <Text className="text-xs ml-1" style={{ color: textGray }}>{item.time}</Text>
                    <Text className="text-xs mx-1.5" style={{ color: textGray }}>•</Text>
                    <Icon name="star" size={12} color="#FBBF24" />
                    <Text className="text-xs ml-1 font-bold text-yellow-400">{item.rating}</Text>
                  </View>
                </View>
                <View className="items-center justify-center bg-white/5 w-8 h-8 rounded-full">
                  <Ionicon name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={textWhite} />
                </View>
              </TouchableOpacity>
              
              {isExpanded && (
                <View className="px-5 pb-5 border-t border-white/5 pt-4">
                  {item.medicines.map((med, idx) => (
                    <View key={idx} className="flex-row justify-between items-center py-2">
                      <View className="flex-row items-center">
                        <Text className="text-sm font-bold" style={{ color: med.available ? textWhite : textGray }}>{med.name}</Text>
                      </View>
                      {med.available ? (
                        <Text className="font-bold text-sm" style={{ color: textWhite }}>{med.price}</Text>
                      ) : (
                        <Text className="text-xs font-bold text-red-400 uppercase">Out of Stock</Text>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity 
                    className="mt-4 py-3.5 rounded-2xl items-center" 
                    style={{ backgroundColor: pinkAccent }}
                  >
                    <Text className="text-black font-bold text-sm">Add to Bucket</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  // --- Tab Content: Medicines ---
  const renderMedicinesTab = () => (
    <View style={{ flex: 1 }}>
      <View className="flex-row justify-between items-center px-5 mb-3">
        <Text className="text-white font-medium"><Text className="font-bold text-white">3 medicines</Text> <Text style={{color: textGray}}>· from your Rx</Text></Text>
        <View className="bg-green-500/20 px-2 py-1 rounded border border-green-500/30 flex-row items-center">
          <Icon name="check" size={12} color="#4ADE80" />
          <Text className="text-[10px] font-bold text-green-400 ml-1">ALL FOUND</Text>
        </View>
      </View>

      <FlatList
        data={mockMedicines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="mb-4 rounded-3xl p-5 border border-white/5" style={{ backgroundColor: cardBg }}>
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-row flex-1">
                <View className="w-12 h-12 rounded-2xl bg-indigo-900/40 items-center justify-center border border-indigo-500/20">
                  <Icon name="pill" size={24} color="#818CF8" />
                </View>
                <View className="ml-4 flex-1">
                  <View className="flex-row items-end">
                    <Text className="text-lg font-bold text-white">{item.name}</Text>
                    <Text className="text-xs font-medium ml-1 mb-0.5" style={{ color: textGray }}>{item.dosage}</Text>
                  </View>
                  <Text className="text-xs mt-1" style={{ color: textGray }}>Capsule · 10 caps · <Text className="font-bold text-white">In {item.availableStoresCount} stores</Text></Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-black text-white">{item.price}</Text>
                <Text className="text-[10px] font-black text-green-400">{item.discount}</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap mb-4">
              {item.prescribed && (
                <View className="bg-blue-900/40 px-2 py-1 rounded border border-blue-500/30 mr-2 mb-2 flex-row items-center">
                  <Text className="text-[9px] font-black text-blue-400">Rx PRESCRIBED</Text>
                </View>
              )}
              {item.genericAvailable && (
                <View className="bg-purple-900/40 px-2 py-1 rounded border border-purple-500/30 mb-2 flex-row items-center">
                  <Text className="text-[9px] font-black text-purple-400">GENERIC AVAILABLE</Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-x-3">
              <TouchableOpacity className="flex-1 py-3 rounded-2xl items-center bg-white/5 border border-white/10">
                <Text className="text-white text-sm font-bold">Compare stores</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 py-3 rounded-2xl items-center" style={{ backgroundColor: pinkAccent }}>
                <Text className="text-black text-sm font-bold">+ Add to Bucket</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );

  // --- Tab Content: OCR Insights ---
  const renderOtherInfoTab = () => (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View className="rounded-3xl border border-white/5 overflow-hidden" style={{ backgroundColor: cardBg }}>
        {/* Header */}
        <View className="p-4 flex-row justify-between items-center border-b border-white/5">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-pink-500/20 items-center justify-center mr-3">
              <Icon name="star-four-points" size={20} color={pinkAccent} />
            </View>
            <View>
              <Text className="text-base font-bold text-white">OCR Insights</Text>
              <Text className="text-xs text-gray-400">Auto-extracted by AI</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20 flex-row items-center">
            <Icon name="lightning-bolt" size={14} color={pinkAccent} />
            <Text className="text-xs font-bold ml-1" style={{ color: pinkAccent }}>Re-scan</Text>
          </TouchableOpacity>
        </View>

        {/* Rx Paper Block */}
        <View className="p-5" style={{ backgroundColor: '#F0EFE9' }}>
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-2xl font-serif text-red-800 font-bold">Rx</Text>
            <View className="items-end">
              <Text className="text-xs font-bold text-gray-800">{ocrInfo.doctorName}, MD</Text>
              <Text className="text-[10px] text-gray-500">Reg: MCI-2018-39A • 28/04/26</Text>
            </View>
          </View>
          
          <View className="border-t border-gray-300 pt-3">
            <View className="flex-row mb-2">
              <Text className="text-sm text-gray-800"><Text className="font-bold bg-pink-200/50">Amoxicillin</Text> <Text className="font-bold">500mg</Text> · 1 tab tid x 5 days</Text>
            </View>
            <View className="flex-row mb-2">
              <Text className="text-sm text-gray-800"><Text className="font-bold bg-pink-200/50">Paracetamol</Text> <Text className="font-bold">650mg</Text> · prn for fever</Text>
            </View>
            <View className="flex-row mb-5">
              <Text className="text-sm text-gray-800"><Text className="font-bold bg-pink-200/50">Cetrizine</Text> <Text className="font-bold">10mg</Text> · 1 tab hs x 3 days</Text>
            </View>
            
            <Text className="text-[10px] text-gray-400 italic">Signed,</Text>
            <Text className="text-sm text-gray-600 font-serif italic">R. Kumar</Text>
          </View>
        </View>
      </View>

      {/* Validation Cards */}
      <View className="flex-row gap-x-3 mt-4">
        <View className="flex-1 rounded-2xl p-4 border border-white/5" style={{ backgroundColor: cardBg }}>
          <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">DOCTOR</Text>
          <Text className="text-sm font-bold text-white mb-1">Dr. R. Kumar</Text>
          <Text className="text-xs font-bold text-green-400">Verified ✓</Text>
        </View>
        <View className="flex-1 rounded-2xl p-4 border border-white/5" style={{ backgroundColor: cardBg }}>
          <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">DATE</Text>
          <Text className="text-sm font-bold text-white mb-1">28 Apr 2026</Text>
          <Text className="text-xs font-bold text-green-400">Recent · valid</Text>
        </View>
      </View>
    </ScrollView>
  );

  // --- Tab Content: Bucket ---
  const renderBucketTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 180 }}>
        {mockStores.slice(0, 1).map((store) => (
          <View key={store.id} className="rounded-3xl p-5 mb-4 border border-white/5" style={{ backgroundColor: cardBg }}>
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl items-center justify-center bg-blue-500/20 mr-3">
                  <Text className="text-blue-400 font-bold text-sm">LP</Text>
                </View>
                <View>
                  <Text className="text-base font-bold text-white">{store.name}</Text>
                  <Text className="text-xs text-gray-400">{store.distance} · ready in {store.time}</Text>
                </View>
              </View>
            </View>

            {store.medicines.map((med, idx) => (
              <View key={idx} className="flex-row justify-between items-center py-3 border-t border-white/5">
                <View className="flex-row items-center flex-1">
                  <View className="w-8 h-8 rounded-lg bg-white/10 items-center justify-center mr-3">
                    <Icon name="pill" size={16} color={pinkAccent} />
                  </View>
                  <View>
                    <Text className="font-bold text-sm text-white">{med.name}</Text>
                    <Text className="text-[9px] font-black text-blue-400 uppercase">Rx PRESCRIBED</Text>
                  </View>
                </View>
                <View className="flex-row items-center bg-white/5 rounded-lg">
                  <TouchableOpacity className="px-2.5 py-1.5"><Text className="text-white font-bold">-</Text></TouchableOpacity>
                  <Text className="text-white font-bold mx-2">1</Text>
                  <TouchableOpacity className="px-2.5 py-1.5"><Text className="text-white font-bold">+</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Sticky Bottom Summary Container */}
      <View 
        className="absolute bottom-0 left-0 right-0 p-6 rounded-t-[32px] border-t border-white/10" 
        style={{ backgroundColor: themeBg }}
      >
        <View className="flex-row justify-between items-center mb-5">
          <View>
            <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">DELIVERY</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="walk" size={16} color={textWhite} />
              <Text className="text-sm font-bold text-white ml-2">Pickup</Text>
            </View>
            <Text className="text-xs text-gray-400 ml-6">Ready in 8 min</Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">TOTAL</Text>
            <Text className="text-2xl font-black text-white mt-1">₹80</Text>
          </View>
        </View>
        <TouchableOpacity 
          className="py-4 rounded-2xl items-center" 
          style={{ backgroundColor: pinkAccent }}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ShoppingBagScreen')}
        >
          <Text className="text-black font-black text-sm uppercase tracking-wider">Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: themeBg }}>
      <StatusBar barStyle="light-content" backgroundColor={themeBg} />
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
        }}
      />
    </View>
  );
};

export default OCRResultsScreen;
