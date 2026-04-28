import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import useThemePalette from '../../hooks/useThemePalette';

interface FilterChipsProps {
  chips: string[];
  activeChip: string;
  onSelect: (chip: string) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ chips, activeChip, onSelect }) => {
  const { isDark } = useThemePalette(); // success is #10B981, natively handled with className "bg-[#10B981]"

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
              className={`px-5 py-2.5 rounded-full justify-center items-center ${
                isActive 
                  ? 'bg-[#10B981] shadow-md shadow-[#10B981]/30 elevation-2 border-0' 
                  : isDark 
                    ? 'bg-[#2A2A2A] border border-[#3A3A3A]' 
                    : 'bg-[#F3F4F6] border border-[#E5E7EB]'
              }`}
            >
              <Text
                className={`text-[14px] ${
                  isActive 
                    ? 'text-white font-bold' 
                    : isDark 
                      ? 'text-[#D1D5DB] font-medium' 
                      : 'text-[#4B5563] font-medium'
                }`}
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
