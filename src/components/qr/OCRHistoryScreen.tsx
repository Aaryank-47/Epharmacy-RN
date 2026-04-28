import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemePalette } from '../../hooks/useThemePalette';

type OcrHistoryItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  matchCount: number;
};

const OCR_HISTORY_DATA: OcrHistoryItem[] = [
  {
    id: '1',
    title: 'Amoxicillin 500mg Capsule',
    subtitle: 'Prescription OCR result from scanned image',
    date: 'Today, 10:12 AM',
    matchCount: 8,
  },
  {
    id: '2',
    title: 'Paracetamol 650mg Tablet',
    subtitle: 'OCR from gallery upload',
    date: 'Yesterday, 04:45 PM',
    matchCount: 6,
  },
  {
    id: '3',
    title: 'Cetirizine 10mg Tablet',
    subtitle: 'Prescription OCR result from camera capture',
    date: '27 Apr, 11:20 AM',
    matchCount: 5,
  },
  {
    id: '4',
    title: 'Metformin 500mg Tablet',
    subtitle: 'OCR result with dosage details extracted',
    date: '26 Apr, 08:03 PM',
    matchCount: 7,
  },
];

const OCRHistoryScreen: React.FC<any> = ({ navigation }) => {
  const { isDark } = useThemePalette();

  const renderItem = ({ item }: { item: OcrHistoryItem }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#374151' : '#E5E7EB' },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isDark ? '#312E81' : '#EDE9FE' }]}>
        <Icon name="text-box-search-outline" size={22} color={isDark ? '#C4B5FD' : '#6D28D9'} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.matchCount} matches</Text>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={2}>
          {item.subtitle}
        </Text>

        <Text style={[styles.date, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#030712' : '#F3F4F6' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderBottomColor: isDark ? '#1F2937' : '#E5E7EB' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color={isDark ? '#F9FAFB' : '#111827'} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>OCR History</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Hard-coded sample OCR records</Text>
        </View>
      </View>

      <FlatList
        data={OCR_HISTORY_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="folder-search-outline" size={40} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>No OCR history yet</Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>This screen currently uses sample data until history storage is connected.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  date: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
  },
  badgeText: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 40,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default OCRHistoryScreen;