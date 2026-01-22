import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera } from 'react-native-image-picker';

interface SearchHeaderProps {
    query?: string;
    onQueryChange?: (text: string) => void;
    onSubmitEditing?: () => void;
    onBackPress: () => void;
    onCameraPress?: () => void;
    showCamera?: boolean;
    isDark: boolean;
    textColor: string;
    placeholderColor: string;
    editable?: boolean;
    onSearchPress?: () => void;
    onFilterPress?: () => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
    query = "",
    onQueryChange,
    onSubmitEditing,
    onBackPress,
    onCameraPress,
    showCamera = false,
    isDark,
    textColor,
    placeholderColor,
    editable = true,
    onSearchPress,
    onFilterPress
}) => {
    const handleDefaultCameraPress = async () => {
        try {
            const result = await launchCamera({
                mediaType: 'photo',
                cameraType: 'back',
                quality: 0.8,
            });

            if (result.didCancel) {
                console.log('User cancelled camera');
            } else if (result.errorCode) {
                console.log('Camera Error: ', result.errorMessage);
            } else if (result.assets && result.assets.length > 0) {
                const image = result.assets[0];
                console.log('Image captured:', image.uri);
            }
        } catch (error) {
            console.error("Camera launch failed", error);
        }
    };

    const finalOnCameraPress = onCameraPress || (showCamera ? handleDefaultCameraPress : undefined);

    return (
        <View
            className="flex-row items-center px-4 py-3 pb-4"
            style={{
                zIndex: 10,
                backgroundColor: isDark ? '#040404ff' : '#FFFFFF'
            }}
        >
            <TouchableOpacity
                onPress={onBackPress}
                className="p-2 -ml-1 mr-1 rounded-full"
                activeOpacity={0.7}
            >
                <Icon name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
                className="flex-1 flex-row items-center h-12 rounded-3xl pl-4 pr-2"
                style={{
                    backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                    borderWidth: 1,
                    borderColor: isDark ? '#2D3038' : 'transparent'
                }}
                activeOpacity={editable ? 1 : 0.7}
                onPress={!editable ? onSearchPress : undefined}
            >
                <Icon name="search" size={20} color={placeholderColor} className="mr-2 opacity-70" />
                <TextInput
                    className="flex-1 text-base font-medium h-full"
                    style={{ color: textColor }}
                    placeholder="Search medicines, vitamins..."
                    placeholderTextColor={placeholderColor}
                    value={query}
                    onChangeText={onQueryChange}
                    onSubmitEditing={onSubmitEditing}
                    returnKeyType="search"
                    autoFocus={editable} // Only autofocus if editable
                    editable={editable}
                    onPressIn={!editable ? onSearchPress : undefined}
                />

                <View className="flex-row items-center gap-x-2">
                    {editable && query.length > 0 && onQueryChange && (
                        <TouchableOpacity onPress={() => onQueryChange('')} className="p-1">
                            <Icon name="close-circle" size={18} color={placeholderColor} />
                        </TouchableOpacity>
                    )}

                    {finalOnCameraPress && (
                        <TouchableOpacity
                            onPress={finalOnCameraPress}
                            className="p-1 -mr-1"
                            activeOpacity={0.7}
                        >
                            <Icon name="camera-outline" size={22} color={textColor} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>

            {onFilterPress && (
                <TouchableOpacity
                    onPress={onFilterPress}
                    className="p-2 ml-1 -mr-1 rounded-full"
                    activeOpacity={0.7}
                >
                    <Icon name="options-outline" size={24} color={textColor} />
                </TouchableOpacity>
            )}
        </View>
    );
};

export default SearchHeader;
