import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';

interface FilterChipsProps {
  chips: string[];
  activeChip: string;
  onSelect: (chip: string) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ chips, activeChip, onSelect }) => {
  const cardBgClass = 'bg-[#14161C]';
  const pinkAccent = '#F472B6';

  return (
    <View className="mb-4">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {chips.map((chip) => {
          const isActive = activeChip === chip;
          return (
            <TouchableOpacity
              key={chip}
              onPress={() => onSelect(chip)}
              activeOpacity={0.7}
              className={`px-5 py-2.5 rounded-full justify-center items-center border ${
                isActive 
                  ? 'border-transparent' 
                  : 'border-white/5'
              }`}
              style={{
                backgroundColor: isActive ? pinkAccent : '#14161C',
                shadowColor: isActive ? pinkAccent : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isActive ? 0.3 : 0,
                shadowRadius: 8,
                elevation: isActive ? 8 : 0,
              }}
            >
              <Text
                className={`text-[14px] font-bold`}
                style={{ color: isActive ? '#000000' : '#9CA3AF' }}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default React.memo(FilterChips);
