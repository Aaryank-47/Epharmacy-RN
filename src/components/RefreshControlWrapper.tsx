/**
 * REFRESH CONTROL WRAPPER COMPONENT
 * Wrap your scrollable content with this component to add pull-to-refresh functionality
 */

import React, { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  View,
  ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemePalette from '../hooks/useThemePalette';

interface RefreshControlWrapperProps {
  isRefreshing: boolean;

  onRefresh: () => void | Promise<void>;

  children: ReactNode;

  isList?: boolean;

  scrollViewProps?: ScrollViewProps;

  viewProps?: ViewProps;

  tintColor?: string;

  enabled?: boolean;
}

export const RefreshControlWrapper: React.FC<RefreshControlWrapperProps> = ({
  isRefreshing,
  onRefresh,
  children,
  isList = false,
  scrollViewProps,
  viewProps,
  tintColor,
  enabled = true,
}) => {
  const { isDark, ctaGradient } = useThemePalette();
  const insets = useSafeAreaInsets();

  const refreshColor = tintColor || ctaGradient[0];

  if (isList) {
    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        tintColor={refreshColor}
        colors={[refreshColor]}
        enabled={enabled}
      />
    );
  }


  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={refreshColor}
          colors={[refreshColor]}
          enabled={enabled}
        />
      }
      showsVerticalScrollIndicator={true}
      scrollEventThrottle={16}
      {...scrollViewProps}
    >
      <View {...viewProps}>{children}</View>
    </ScrollView>
  );
};

/**
 * Standalone RefreshControl for use with FlatList/SectionList
 */
export const createRefreshControl = (
  isRefreshing: boolean,
  onRefresh: () => void | Promise<void>,
  tintColor?: string
): React.ReactElement => {
  const { ctaGradient } = useThemePalette();
  const refreshColor = tintColor || ctaGradient[0];

  return (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={refreshColor}
      colors={[refreshColor]}
    />
  );
};

export type { RefreshControlWrapperProps };
