import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Product } from '../../../hooks/useProductDetail';

interface ProductInfoCardProps {
    product: Product;
    isDark: boolean;
    selectedUnit: string;
    setSelectedUnit: (unit: string) => void;
    onShare: () => void;
}

const LANGUAGES = [
    'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati',
    'Kannada', 'Odia', 'Punjabi', 'Malayalam', 'Assamese', 'Maithili'
];

const ProductInfoCard: React.FC<ProductInfoCardProps> = memo(({
    product,
    isDark,
    selectedUnit,
    setSelectedUnit,
    onShare
}) => {
    const [selectedLang, setSelectedLang] = useState('Hindi'); // Default Hindi logic
    const [showLangModal, setShowLangModal] = useState(false);

    const renderUnit = (unit: string) => (
        <TouchableOpacity
            key={unit}
            className={`px-4 py-2.5 rounded-xl mr-2.5 border ${selectedUnit === unit
                ? isDark
                    ? 'border-[#40C057] bg-[#40C057]/20'
                    : 'border-[#40C057] bg-[#40C057]/10'
                : isDark
                    ? 'border-neutral-700 bg-neutral-800'
                    : 'border-gray-200 bg-gray-50'
                }`}
            onPress={() => setSelectedUnit(unit)}
        >
            <Text className={`text-sm font-semibold ${selectedUnit === unit
                ? 'text-[#40C057]'
                : isDark ? 'text-white' : 'text-neutral-800'
                }`}>
                {unit}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View className="-mt-6 rounded-t-[24px] px-5 py-6 bg-white dark:bg-[#1A1A1A] shadow-lg">
            {/* Product title and price */}
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-xl font-bold flex-1 mr-4 text-neutral-900 dark:text-white">
                    {product.name}
                </Text>
                <View className="items-end">
                    <Text className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                        ₹{product.finalPrice}
                    </Text>
                    {Number(product.discountPercent) > 0 && (
                        <Text className="text-base text-gray-400 line-through mt-0.5">
                            ₹{product.price}
                        </Text>
                    )}
                </View>
            </View>

            {/* Discount badge */}
            {Number(product.discountPercent) > 0 && (
                <View className="mb-3">
                    <View className="bg-[#FA5252] px-2.5 py-1 rounded-md self-start">
                        <Text className="text-white font-bold text-xs">
                            {product.discountPercent}% OFF
                        </Text>
                    </View>
                </View>
            )}

            {/* Rating and reviews + Translator */}
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                    <View className="flex-row mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Icon
                                key={star}
                                name={star <= Math.floor(product.rating) ? "star" : "star-outline"}
                                size={16}
                                color="#FFD166"
                            />
                        ))}
                    </View>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                        {product.reviews.toLocaleString()} reviews
                    </Text>
                </View>

                {/* Minimal Translator Button */}
                <TouchableOpacity
                    onPress={() => setShowLangModal(true)}
                    className="flex-row items-center py-1 px-2"
                >
                    <Icon name="language" size={14} color="#40C057" style={{ marginRight: 4 }} />
                    <Text className="text-xs font-medium text-neutral-600 dark:text-gray-400">
                        English <Text className="text-neutral-400">→</Text> <Text className="text-[#40C057]">{selectedLang}</Text>
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Trust Markers */}
            <View className="flex-row items-center justify-between mb-5 mt-2 bg-gray-50 dark:bg-neutral-800 p-3 rounded-xl border border-gray-100 dark:border-neutral-700">
                <View className="flex-row items-center gap-1.5">
                    <Icon name="shield-checkmark" size={16} color="#40C057" />
                    <Text className="text-xs font-semibold text-neutral-700 dark:text-gray-300">100% Genuine</Text>
                </View>
                <View className="h-4 w-[1px] bg-gray-300 dark:bg-neutral-600" />
                <View className="flex-row items-center gap-1.5">
                    <Icon name="cube-outline" size={16} color="#228BE6" />
                    <Text className="text-xs font-semibold text-neutral-700 dark:text-gray-300">Easy Returns</Text>
                </View>
                <View className="h-4 w-[1px] bg-gray-300 dark:bg-neutral-600" />
                <View className="flex-row items-center gap-1.5">
                    <Icon name="ribbon-outline" size={16} color="#FAB005" />
                    <Text className="text-xs font-semibold text-neutral-700 dark:text-gray-300">Top Rated</Text>
                </View>
            </View>

            {/* Safety Advice Card */}
            {product.safetyAdvice.length > 0 && (
                <View className="mb-6 bg-white dark:bg-[#1A1A1A] rounded-lg  p-4 border border-gray-200 dark:border-neutral-900 ">
                    <View className="flex-row items-center mb-3">
                        <Icon name="shield-checkmark" size={20} color="#3B82F6" />
                        <Text className="ml-2 text-base font-bold text-neutral-800 dark:text-gray-100 uppercase tracking-wide">
                            Safety Advice
                        </Text>
                    </View>
                    {product.safetyAdvice.map((advice, idx) => (
                        <View key={idx} className="flex-row items-start mb-2 last:mb-0">
                            <Text className="text-sm font-bold text-blue-500 mr-2 mt-0.5 min-w-[16px]">
                                {idx + 1}.
                            </Text>
                            <Text className="text-sm text-gray-600 dark:text-gray-300 flex-1 leading-5 font-medium">
                                {advice}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Short description */}
            <Text className="text-base text-gray-500 dark:text-gray-400 mb-4">
                {product.shortTitle}
            </Text>

            {/* Benefits */}
            {product.benefits && product.benefits.length > 0 && (
                <View className="mb-5">
                    <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Key Benefits</Text>
                    {product.benefits.map((benefit, index) => (
                        <View key={index} className="flex-row items-center mt-2.5">
                            <View className="w-6 h-6 rounded-full justify-center items-center mr-2.5 bg-gray-100 dark:bg-neutral-800">
                                <Icon name="checkmark" size={16} color="#40C057" />
                            </View>
                            <Text className="text-sm flex-1 text-gray-500 dark:text-gray-400">
                                {benefit}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Ingredients */}
            {product.ingredients.length > 0 && (
                <View className="mb-5">
                    <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Ingredients</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {product.ingredients.map((item, idx) => (
                            <View key={idx} className="bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-neutral-700">
                                <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Side Effects */}
            {product.sideEffects.length > 0 && (
                <View className="mb-6">
                    <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                        Possible Side Effects
                    </Text>
                    {product.sideEffects.map((effect, idx) => (
                        <View key={idx} className="flex-row items-center mt-2.5">
                            <View className="w-6 h-6 rounded-full justify-center items-center mr-2.5 bg-red-50 dark:bg-red-900/20">
                                <Icon name="alert-circle-outline" size={16} color="#EF4444" />
                            </View>
                            <Text className="text-sm flex-1 text-gray-500 dark:text-gray-400">
                                {effect}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Unit selection */}
            <View className="mb-5">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-bold text-neutral-900 dark:text-white">
                        Select Unit
                    </Text>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="-mx-1"
                    contentContainerStyle={{ paddingHorizontal: 4 }}
                >
                    {product.units.map(renderUnit)}
                </ScrollView>
            </View>

            {/* Description */}
            <View className="mb-5">
                <Text className="text-lg font-bold mb-3 text-neutral-900 dark:text-white">
                    Description
                </Text>
                <Text className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                    {product.description}
                </Text>
            </View>

            {/* Delivery info */}
            <View className="flex-row items-center p-4 rounded-xl mb-4 bg-gray-50 dark:bg-neutral-800">
                <Icon name="time-outline" size={24} color="#40C057" />
                <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold mb-1 text-neutral-900 dark:text-white">
                        Delivery in {product.deliveryTime}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                        Order in the next 2 hours to get it by {product.deliveryTime}
                    </Text>
                </View>
            </View>

            {/* GST info */}
            <View className="mb-5">
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                    GST: {product.gst}
                </Text>
            </View>

            {/* Language Selection Modal */}
            <Modal
                transparent={true}
                visible={showLangModal}
                animationType="fade"
                onRequestClose={() => setShowLangModal(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/50 justify-center items-center p-5"
                    activeOpacity={1}
                    onPress={() => setShowLangModal(false)}
                >
                    <View className="w-full max-w-sm bg-white dark:bg-[#1E1E1E] rounded-3xl p-5 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">Select Language</Text>
                            <TouchableOpacity onPress={() => setShowLangModal(false)} className="p-1">
                                <Icon name="close" size={24} color={isDark ? '#FFF' : '#000'} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={LANGUAGES}
                            numColumns={2}
                            keyExtractor={(item) => item}
                            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedLang(item);
                                        setShowLangModal(false);
                                    }}
                                    className={`w-[48%] py-3 px-4 rounded-xl mb-2 flex-row items-center justify-between border ${selectedLang === item
                                            ? 'bg-[#40C057]/10 border-[#40C057]'
                                            : 'bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700'
                                        }`}
                                >
                                    <Text className={`font-semibold ${selectedLang === item
                                            ? 'text-[#40C057]'
                                            : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {item}
                                    </Text>
                                    {selectedLang === item && (
                                        <Icon name="checkmark-circle" size={18} color="#40C057" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
});

export default ProductInfoCard;
