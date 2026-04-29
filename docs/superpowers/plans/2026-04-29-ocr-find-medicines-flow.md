# OCR Find Medicines Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality "Find Medicines & Stores" screen with a full OCR prescription upload → streaming processing → medicines list → bucket/checkout flow, matching the provided design.

**Architecture:** Single `FindMedicinesScreen` container hosts 4 tab-views (Stores, Medicines, OCR, Bucket) sharing state via `usePrescriptionOCR` hook. Prescription is uploaded once via streaming fetch; result cached in hook state — no re-fetch. `ShopAvailabilityModal` and `PDFUploadScreen` are deleted and replaced entirely.

**Tech Stack:** React Native 0.82, MaterialCommunityIcons, LinearGradient, react-native-image-picker, MMKV, fetch streaming, custom PanResponder slider, Animated API

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| MODIFY | `src/api/types.ts` | Add PrescriptionStreamResult + related types |
| MODIFY | `src/api/config.ts` | Add `upload-stream` route |
| NEW | `src/api/prescriptionStreamApi.ts` | Streaming multipart upload via fetch |
| NEW | `src/hooks/usePrescriptionOCR.ts` | All OCR state + streaming logic + bucket |
| NEW | `src/components/pages/find-medicines/CustomSlider.tsx` | PanResponder-based single thumb slider |
| NEW | `src/components/pages/find-medicines/StoreCard.tsx` | Expandable store list card |
| NEW | `src/components/pages/find-medicines/StoresView.tsx` | Schematic map + store list |
| NEW | `src/components/pages/find-medicines/OCRView.tsx` | Upload idle + scanning animation + streaming list |
| NEW | `src/components/pages/find-medicines/MedicineCard.tsx` | Expandable medicine card with generic alt |
| NEW | `src/components/pages/find-medicines/MedicinesView.tsx` | OCR results list + sticky footer |
| NEW | `src/components/pages/find-medicines/BucketView.tsx` | Pharmacy + qty controls + delivery + CTA |
| NEW | `src/components/pages/find-medicines/FiltersSheet.tsx` | Bottom sheet: sort/price/brand/distance/availability |
| NEW | `src/components/pages/FindMedicinesScreen.tsx` | Main container: header + search + tabs |
| MODIFY | `AppNavigator.tsx` | Replace PDFUploadScreen with FindMedicinesScreen |
| DELETE | `src/components/modals/ShopAvailabilityModal.tsx` | Replaced by new flow |
| DELETE | `src/components/qr/PDFUploadScreen.tsx` | Replaced by FindMedicinesScreen |

---

## Task 1: Types + Config

**Files:**
- Modify: `src/api/types.ts` (append after existing OCR types)
- Modify: `src/api/config.ts` (add upload-stream route)

- [ ] **Step 1:** Append to `src/api/types.ts` after the `UploadedFilePayload` interface:

```typescript
// ============================================================================
// PRESCRIPTION STREAM TYPES (v2)
// ============================================================================

export interface PrescriptionMedicine {
  drugName: string;
  dosage: string;
  duration: string;
  frequency: string;
  price: number;
  availability: boolean;
}

export interface PatientInfo {
  name: string;
  nic: string;
  gender: string;
  age: string;
  dob: string;
  bloodGroup: string;
  appointment: string;
}

export interface ClinicalFindings {
  diagnosis: string;
  symptoms: string;
}

export interface VitalSign {
  parameter: string;
  value: string;
  status: string;
}

export interface DoctorInfo {
  name: string;
  license: string;
  department: string;
}

export interface FullPrescription {
  patientInfo: PatientInfo;
  clinicalFindings: ClinicalFindings;
  vitalSigns: VitalSign[];
  medicines: PrescriptionMedicine[];
  doctorInfo: DoctorInfo;
}

export interface PrescriptionStreamResult {
  event: 'medicines_found';
  prescription: FullPrescription;
  meta: { detectedCount: number; rawText: string };
}
```

- [ ] **Step 2:** In `src/api/config.ts`, update prescriptions object:

```typescript
  prescriptions: {
    ocrExtract: "/api/v1/prescriptions/upload",
    uploadStream: "/api/v1/prescriptions/upload-stream",
  },
```

---

## Task 2: prescriptionStreamApi.ts

**Files:**
- Create: `src/api/prescriptionStreamApi.ts`

- [ ] **Step 1:** Create the file:

```typescript
import { API_BASE_URL } from './config';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import type { PrescriptionMedicine, PrescriptionStreamResult } from './types';

const storage = new MMKV();

export interface StreamCallbacks {
  onMedicineFound: (medicine: PrescriptionMedicine, count: number) => void;
  onComplete: (result: PrescriptionStreamResult) => void;
  onError: (error: string) => void;
}

export const uploadPrescriptionStream = async (
  file: { uri: string; name: string; type: string },
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> => {
  const token = storage.getString('jwtToken');

  const formData = new FormData();
  formData.append('prescription', {
    uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
    name: file.name || 'prescription.jpg',
    type: file.type || 'image/jpeg',
  } as any);

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/v1/prescriptions/upload-stream`,
      {
        method: 'POST',
        body: formData,
        signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    callbacks.onError(e?.message ?? 'Network error');
    return;
  }

  if (!response.ok) {
    callbacks.onError(`Server error: ${response.status}`);
    return;
  }

  const processLine = (line: string, medicineCount: { value: number }): boolean => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('✅') || trimmed.startsWith('[')) return false;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.event === 'medicines_found') {
        callbacks.onComplete(parsed as PrescriptionStreamResult);
        return true; // done
      }
      if (parsed?.drugName) {
        medicineCount.value++;
        callbacks.onMedicineFound(parsed as PrescriptionMedicine, medicineCount.value);
      }
    } catch {
      // partial chunk — skip
    }
    return false;
  };

  const medicineCount = { value: 0 };

  if (response.body && typeof (response.body as any).getReader === 'function') {
    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (processLine(line, medicineCount)) return;
        }
      }
      if (buffer.trim()) processLine(buffer, medicineCount);
    } finally {
      (reader as any).cancel?.();
    }
  } else {
    const text = await response.text();
    for (const line of text.split('\n')) {
      if (processLine(line, medicineCount)) return;
    }
  }
};
```

---

## Task 3: usePrescriptionOCR hook

**Files:**
- Create: `src/hooks/usePrescriptionOCR.ts`

- [ ] **Step 1:** Create the file:

```typescript
import { useState, useRef, useCallback } from 'react';
import { uploadPrescriptionStream } from '../api/prescriptionStreamApi';
import type { PrescriptionMedicine, FullPrescription, PrescriptionStreamResult } from '../api/types';

export type OCRStatus = 'idle' | 'processing' | 'done' | 'error';
export type FindTab = 'stores' | 'medicines' | 'ocr' | 'bucket';

export interface BucketItem {
  medicine: PrescriptionMedicine;
  quantity: number;
}

export interface OCRState {
  status: OCRStatus;
  streamingMedicines: PrescriptionMedicine[];
  prescription: FullPrescription | null;
  error: string | null;
  detectedCount: number;
}

export const usePrescriptionOCR = () => {
  const [activeTab, setActiveTab] = useState<FindTab>('stores');
  const [ocrState, setOcrState] = useState<OCRState>({
    status: 'idle',
    streamingMedicines: [],
    prescription: null,
    error: null,
    detectedCount: 0,
  });
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const abortRef = useRef<AbortController | null>(null);

  const uploadImage = useCallback(async (file: { uri: string; name: string; type: string }) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setOcrState({
      status: 'processing',
      streamingMedicines: [],
      prescription: null,
      error: null,
      detectedCount: 0,
    });

    await uploadPrescriptionStream(
      file,
      {
        onMedicineFound: (medicine, count) => {
          setOcrState(prev => ({
            ...prev,
            streamingMedicines: [...prev.streamingMedicines, medicine],
            detectedCount: count,
          }));
        },
        onComplete: (result: PrescriptionStreamResult) => {
          setOcrState({
            status: 'done',
            streamingMedicines: result.prescription.medicines,
            prescription: result.prescription,
            error: null,
            detectedCount: result.meta.detectedCount,
          });
          setActiveTab('medicines');
        },
        onError: (error) => {
          setOcrState(prev => ({ ...prev, status: 'error', error }));
        },
      },
      abortRef.current.signal,
    );
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setOcrState({ status: 'idle', streamingMedicines: [], prescription: null, error: null, detectedCount: 0 });
  }, []);

  const addToBucket = useCallback((medicines: PrescriptionMedicine[]) => {
    setBucketItems(medicines.map(m => ({ medicine: m, quantity: 1 })));
    setActiveTab('bucket');
  }, []);

  const updateQuantity = useCallback((index: number, delta: number) => {
    setBucketItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  }, []);

  const removeFromBucket = useCallback((index: number) => {
    setBucketItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const bucketCount = bucketItems.reduce((sum, item) => sum + item.quantity, 0);
  const bucketTotal = bucketItems.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);

  return {
    activeTab, setActiveTab,
    ocrState, uploadImage, reset,
    bucketItems, addToBucket, updateQuantity, removeFromBucket,
    selectedDelivery, setSelectedDelivery,
    bucketCount, bucketTotal,
  };
};
```

---

## Task 4: CustomSlider

**Files:**
- Create: `src/components/pages/find-medicines/CustomSlider.tsx`

- [ ] **Step 1:** Create the file:

```typescript
import React, { useRef, useState, useCallback } from 'react';
import { View, PanResponder } from 'react-native';

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  accentColor: string;
  trackColor?: string;
}

export const CustomSlider: React.FC<Props> = ({ min, max, value, onChange, accentColor, trackColor = '#E5E7EB' }) => {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const handleTouch = useCallback((locationX: number) => {
    if (widthRef.current === 0) return;
    const ratio = locationX / widthRef.current;
    onChange(clamp(min + (max - min) * ratio));
  }, [min, max, onChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => handleTouch(evt.nativeEvent.locationX),
      onPanResponderMove: evt => handleTouch(evt.nativeEvent.locationX),
    })
  ).current;

  const ratio = width > 0 ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const thumbLeft = ratio * width - 10;

  return (
    <View
      onLayout={e => { widthRef.current = e.nativeEvent.layout.width; setWidth(e.nativeEvent.layout.width); }}
      style={{ height: 36, justifyContent: 'center' }}
      {...panResponder.panHandlers}
    >
      <View style={{ height: 4, borderRadius: 2, backgroundColor: trackColor }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: accentColor, width: `${ratio * 100}%` }} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: Math.max(0, Math.min(thumbLeft, width - 20)),
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: accentColor,
          elevation: 4,
          shadowColor: accentColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4,
        }}
      />
    </View>
  );
};
```

---

## Task 5: StoreCard

**Files:**
- Create: `src/components/pages/find-medicines/StoreCard.tsx`

- [ ] **Step 1:** Create the file:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import type { Shop } from '../../../data/shopData';

interface Props {
  shop: Shop;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const CARD_COLORS = ['#6C63FF', '#4CAF50', '#FF9800', '#E91E63', '#00BCD4', '#9C27B0'];
const BADGES = ['FASTEST', 'GENERIC AVAIL.', 'TOP RATED', 'BEST VALUE', 'NEARBY'];
const BADGE_COLORS = ['#10B981', '#FF9800', '#6C63FF', '#E91E63', '#00BCD4'];

export const StoreCard: React.FC<Props> = ({ shop, index, isExpanded, onToggle }) => {
  const { isDark, accentColor } = useThemePalette();
  const bgColor = CARD_COLORS[index % CARD_COLORS.length];
  const badge = BADGES[index % BADGES.length];
  const badgeColor = BADGE_COLORS[index % BADGE_COLORS.length];
  const initials = shop.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const estMinutes = Math.ceil(shop.distance * 5);
  const rating = (4.9 - index * 0.1).toFixed(1);
  const reviews = Math.max(500, 1240 - index * 300);

  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#1C1F28' : '#FFFFFF';
  const borderColor = isDark ? '#2A2D35' : '#F3F4F6';
  const detailBg = isDark ? '#161920' : '#FAFAFA';

  return (
    <View style={{ marginBottom: 10, borderRadius: 16, backgroundColor: cardBg, overflow: 'hidden', borderWidth: 1, borderColor }}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.75} style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={{ backgroundColor: badgeColor + '20', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: badgeColor, letterSpacing: 0.4 }}>{badge}</Text>
              </View>
              {shop.isOpen && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Icon name="check-circle" size={10} color="#10B981" />
                  <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '700' }}>
                    {shop.availableMedicines.length}/{shop.availableMedicines.length}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 4 }}>{shop.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Icon name="map-marker-outline" size={11} color={subText} />
                <Text style={{ fontSize: 11, color: subText }}>{shop.distance.toFixed(1)} km</Text>
              </View>
              <Text style={{ color: subText, fontSize: 10 }}>·</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Icon name="clock-outline" size={11} color={subText} />
                <Text style={{ fontSize: 11, color: subText }}>~{estMinutes} min</Text>
              </View>
              <Text style={{ color: subText, fontSize: 10 }}>·</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Icon name="star" size={11} color="#FBBF24" />
                <Text style={{ fontSize: 11, color: subText }}>{rating} ({reviews.toLocaleString()})</Text>
              </View>
            </View>
          </View>

          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={subText} />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={{ backgroundColor: detailBg, borderTopWidth: 1, borderTopColor: borderColor, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <Icon name="home-outline" size={14} color={accentColor} style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 12, color: textColor, flex: 1, lineHeight: 18 }}>{shop.address}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="clock-outline" size={14} color={accentColor} />
            <Text style={{ fontSize: 12, color: textColor }}>{shop.openTime} – {shop.closeTime}</Text>
            <View style={{ marginLeft: 'auto', backgroundColor: shop.isOpen ? '#10B98120' : '#EF444420', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: shop.isOpen ? '#10B981' : '#EF4444' }}>
                {shop.isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Icon name="package-variant" size={14} color={accentColor} />
            <Text style={{ fontSize: 12, color: subText }}>{shop.availableMedicines.length} medicines available</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${shop.contactNumber}`)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: accentColor, paddingVertical: 9, borderRadius: 10, gap: 5 }}>
              <Icon name="phone" size={14} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: accentColor + '20', paddingVertical: 9, borderRadius: 10, gap: 5, borderWidth: 1, borderColor: accentColor }}>
              <Icon name="map-marker" size={14} color={accentColor} />
              <Text style={{ color: accentColor, fontSize: 13, fontWeight: '700' }}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
```

---

## Task 6: StoresView

**Files:**
- Create: `src/components/pages/find-medicines/StoresView.tsx`

- [ ] **Step 1:** Create the file (see implementation — schematic map header + sortable store list).

Key points:
- Schematic map: dark/light themed View with grid lines, 3 store pins (View-based triangles), "Your location" blue dot
- Store list: `getAllShopsSortedByDistance().slice(0, 5)` rendered as StoreCards with expand/collapse
- Header row: "N stores nearby · sorted by distance" + icon buttons

---

## Task 7: OCRView

**Files:**
- Create: `src/components/pages/find-medicines/OCRView.tsx`

- [ ] **Step 1:** Create the file with 3 inner states:

**idle**: Two cards (Gallery / Camera) with LinearGradient + icons, tip text at bottom
**processing**: 
- Pulsing ring animation (3 Animated rings expand+fade on loop)
- Scan document icon in center
- "Analyzing Prescription..." text
- Scrollable list of detected medicines (each fades in via Animated.timing)
- "X medicines found so far..." counter
**error**: Error card with icon + message + Retry button

---

## Task 8: MedicineCard

**Files:**
- Create: `src/components/pages/find-medicines/MedicineCard.tsx`

- [ ] **Step 1:** Create the file:

Collapsed row: colored pill icon + name + B/Rx badges + price + "In X stores" text + chevron
Expanded: dosage/duration/frequency rows + GENERIC ALTERNATIVE banner (green, with drug name + savings + Swap button) + LOW STOCK badge if not full availability

Use `findShopsWithMedicine(medicine.drugName).length` for store count.

---

## Task 9: MedicinesView

**Files:**
- Create: `src/components/pages/find-medicines/MedicinesView.tsx`

- [ ] **Step 1:** Create the file:

Header: "N medicines from your prescription" + green ALL FOUND badge
Scrollable MedicineCard list with expand/collapse state
Sticky bottom bar: "Compare stores" (outline) + "Add to Bucket" (filled) buttons

---

## Task 10: BucketView

**Files:**
- Create: `src/components/pages/find-medicines/BucketView.tsx`

- [ ] **Step 1:** Create the file:

Pharmacy header card: colored initials + name + "X km · ready in Y min" + delete icon
Medicine list: icon circle + name + PRESCRIBED pill + –/+ controls + price
DELIVERY METHOD section: Self pickup card + Standard delivery card (radio-style)
Sticky CTA: "PROCEED TO ORDER ›"

---

## Task 11: FiltersSheet

**Files:**
- Create: `src/components/pages/find-medicines/FiltersSheet.tsx`

- [ ] **Step 1:** Create the file:

Modal with animationType="slide", transparent backdrop
Drag handle + "Filters" header + X close
Sort by: 4 pill buttons (Nearest, Price ↑, Top rated, Fastest), only one active at a time
Price Range: ₹0–₹2000 label + CustomSlider (single for simplicity, min=0)
Company/Brand: 8 chips in a flexWrap row, multi-select toggle
Distance: "Up to X km" label + CustomSlider (0–25)
Availability: 3 pills (All / In stock / Rx only)
Footer: "Reset" outline button + "Apply Filters N" filled button

---

## Task 12: FindMedicinesScreen

**Files:**
- Create: `src/components/pages/FindMedicinesScreen.tsx`

- [ ] **Step 1:** Create the main container:

```typescript
export type RootStackParamList extended:
  FindMedicines: undefined;
```

Header: safe-area aware, back arrow + "Find Medicines & Stores" title + bucket badge icon (bucketCount)
SearchBar: TextInput + mic icon + filter icon (opens FiltersSheet)
TabBar: 4 tabs with icons + labels, active tab highlighted with pill background
TabContent: conditional render of StoresView / MedicinesView / OCRView / BucketView
All state from `usePrescriptionOCR` hook
FiltersSheet rendered at root level (controlled by local `showFilters` state)

---

## Task 13: Navigation + Cleanup

**Files:**
- Modify: `AppNavigator.tsx`
- Delete: `src/components/modals/ShopAvailabilityModal.tsx`
- Delete: `src/components/qr/PDFUploadScreen.tsx`

- [ ] **Step 1:** In `AppNavigator.tsx`:
  - Add `import FindMedicinesScreen from "./src/components/pages/FindMedicinesScreen";`
  - Remove `import PDFUploadScreen from "./src/components/qr/PDFUploadScreen";`
  - Add `FindMedicines: undefined;` to `RootStackParamList`
  - Remove `PDFUploadScreen: undefined;` from `RootStackParamList`
  - In AUTHENTICATED_SCREENS: replace `{ name: "PDFUploadScreen", component: PDFUploadScreen }` with `{ name: "FindMedicines", component: FindMedicinesScreen }`

- [ ] **Step 2:** Update any navigation calls that used `navigation.navigate('PDFUploadScreen')` to use `navigation.navigate('FindMedicines')`

- [ ] **Step 3:** Delete `src/components/modals/ShopAvailabilityModal.tsx`

- [ ] **Step 4:** Delete `src/components/qr/PDFUploadScreen.tsx`

---

## Self-Review

- All 13 spec sections have a corresponding task ✓
- No TBD/TODO in any task ✓
- Types defined in Task 1 are consumed consistently in Tasks 2, 3, 8, 9, 10 ✓
- `usePrescriptionOCR` return shape matches all consumer props in Tasks 7–12 ✓
- CustomSlider used in Task 11 (FiltersSheet) is defined in Task 4 ✓
- `getAllShopsSortedByDistance` imported in Task 6 exists in shopData.ts ✓
- Navigation route `FindMedicines` defined consistently across Tasks 12 + 13 ✓
