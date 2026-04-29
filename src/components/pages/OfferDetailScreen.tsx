import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  TextInput,
  Clipboard,
  Alert,
  Share,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';
import Icon from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../AppNavigator';

// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'OfferDetail'>;

const OfferDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { offer } = route.params;
  const { isDark } = useThemePalette();
  const [couponCode, setCouponCode] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'bank' | 'cashback' | 'mycoupon'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Sample bank offers (you can replace with actual data from API)
  const bankOffers = offer.offerDetails?.bankOffers || [
    { id: '1', bank: 'HDFC Bank', code: 'HDFC10', discount: '10% OFF up to ₹200', description: 'Get 10% instant discount on HDFC credit/debit cards' },
    { id: '2', bank: 'Paytm', code: 'PAYTM20', discount: '20% Cashback up to ₹100', description: 'Get 20% cashback on Paytm wallet' },
    { id: '3', bank: 'ICICI Bank', code: 'ICICI15', discount: '15% OFF up to ₹300', description: 'Get 15% instant discount on ICICI cards' },
  ];

  const showToast = (message: string) => {
    Alert.alert('Success', message, [{ text: 'OK' }]);
  };

  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    showToast(`Code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const applyCode = async () => {
    if (couponCode.trim()) {
      setIsApplying(true);
      // Simulate API call
      setTimeout(() => {
        setIsApplying(false);
        Alert.alert(
          'Coupon Applied!',
          `Coupon code "${couponCode}" has been applied successfully.`,
          [{ text: 'OK' }]
        );
        setCouponCode('');
      }, 1000);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing offer: ${offer.offerText || '50'}% off! Use code: ${offer.offerDetails?.couponCode || 'FIRST50'}`,
        title: offer.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShopNow = () => {
    Alert.alert(
      'Shop Now',
      'This will take you to the products page with the offer applied.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => navigation.navigate('Products' as any) },
      ]
    );
  };

  const renderOfferCard = (offerItem: any) => (
    <View
      key={offerItem.id}
      className={`rounded-2xl p-4 mb-3 border ${
        isDark ? 'bg-[#1E2026] border-[#2A2D35]' : 'bg-white border-gray-200'
      }`}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {offerItem.bank}
          </Text>
          <Text className="text-sm font-bold mb-1.5 text-green-500">
            {offerItem.discount}
          </Text>
          <Text className={`text-xs leading-[18px] mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {offerItem.description}
          </Text>
          <TouchableOpacity
            className="flex-row items-center gap-1 mt-1"
            onPress={() => {
              // Navigate to terms & conditions
            }}
          >
            <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Terms & condition
            </Text>
            <Icon name="arrow-forward" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>
        <View className="items-center ml-3">
          <View className={`py-2 px-3 rounded-lg mb-2 ${isDark ? 'bg-[#2A2D35]' : 'bg-red-100'}`}>
            <Text className={`text-sm font-black tracking-wide ${isDark ? 'text-red-500' : 'text-red-700'}`}>
              {offerItem.code}
            </Text>
          </View>
          <TouchableOpacity
            className={`p-2 rounded-full ${copiedCode === offerItem.code ? 'bg-green-100' : ''}`}
            onPress={() => copyToClipboard(offerItem.code)}
            accessibilityLabel="Copy code"
          >
            <Icon 
              name={copiedCode === offerItem.code ? "checkmark-circle" : "copy-outline"} 
              size={20} 
              color={copiedCode === offerItem.code ? "#22C55E" : "#22C55E"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#181A20]' : 'bg-white'}`}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1E2026', '#181A20'] : ['#FFFFFF', '#F9FAFB']}
        className={`flex-row items-center justify-between px-4 border-b border-black/5 ${Platform.OS === 'ios' ? 'pt-12' : 'pt-4'} pb-4`}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-[#2A2D35]' : 'bg-gray-100'
          }`}
        >
          <Icon
            name="arrow-back"
            size={24}
            color={isDark ? '#FFFFFF' : '#111827'}
          />
        </TouchableOpacity>
        <Text
          className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Offers & Deals
        </Text>
        <TouchableOpacity
          onPress={handleShare}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-[#2A2D35]' : 'bg-gray-100'
          }`}
          accessibilityLabel="Share offer"
        >
          <Icon
            name="share-social-outline"
            size={22}
            color={isDark ? '#FFFFFF' : '#111827'}
          />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-5 mt-4 rounded-3xl p-5 flex-row items-center overflow-hidden min-h-[180px]"
        >
          <View className="flex-1">
            <Text className="text-5xl font-black text-white tracking-tighter">{offer.offerText || '50'}% off</Text>
            <Text className="text-base text-white mt-1 font-semibold">Buy On your first order</Text>
            <Text className="text-sm text-white mt-2 font-bold">Code: {offer.offerDetails?.couponCode || 'FIRST50'}</Text>
            <TouchableOpacity 
              className="bg-white py-2.5 px-6 rounded-[25px] self-start mt-4 flex-row items-center gap-1.5"
              onPress={handleShopNow}
              accessibilityLabel="Shop now with offer"
            >
              <Text className="text-red-500 font-bold text-sm">Shop Now</Text>
              <Icon name="arrow-forward" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: offer.imageUrl }}
            className="w-[120px] h-[120px] ml-2.5"
            resizeMode="contain"
          />
        </LinearGradient>

        {/* Coupon Code Input */}
        <View className="px-5 mt-5">
          <View
            className={`flex-row items-center rounded-xl border px-4 py-1 ${
              isDark ? 'bg-[#1E2026] border-[#2A2D35]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <TextInput
              className={`flex-1 text-base py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
              placeholder="Enter coupon code"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={applyCode}
            />
            <TouchableOpacity
              className="bg-red-500 py-2.5 px-6 rounded-lg"
              style={{ opacity: (couponCode.trim() && !isApplying) ? 1 : 0.5 }}
              onPress={applyCode}
              disabled={!couponCode.trim() || isApplying}
              accessibilityLabel="Apply coupon code"
            >
              {isApplying ? (
                <Text className="text-white font-bold text-sm">...</Text>
              ) : (
                <Text className="text-white font-bold text-sm">Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="mt-6 px-5 border-b border-black/5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'bank', 'cashback', 'mycoupon'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`py-3 px-4 mr-2 border-b-2 ${
                  activeTab === tab ? 'border-red-500' : 'border-transparent'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  } ${
                    activeTab === tab ? (isDark ? 'text-white font-bold' : 'text-gray-900 font-bold') : ''
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'bank' ? 'Bank' : tab === 'cashback' ? 'Cash bank' : 'My coupon'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Offers List */}
        <View className="px-5 mt-4">
          {bankOffers.map(renderOfferCard)}

          {/* Offer Description */}
          {offer.description && (
            <View className="mt-6">
              <Text className={`text-lg font-extrabold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Offer Details
              </Text>
              <Text className={`text-sm leading-[22px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {offer.description}
              </Text>
            </View>
          )}

          {/* Terms & Conditions */}
          {offer.offerDetails?.termsAndConditions && (
            <View className="mt-6">
              <Text className={`text-lg font-extrabold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Terms & Conditions
              </Text>
              {offer.offerDetails.termsAndConditions.map((term, index) => (
                <View key={index} className="flex-row mb-2">
                  <Text className={`mr-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>•</Text>
                  <Text className={`flex-1 text-sm leading-[22px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {term}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
export default OfferDetailScreen;
