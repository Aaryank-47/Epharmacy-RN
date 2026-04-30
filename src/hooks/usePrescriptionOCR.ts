import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadPrescriptionStream } from '../api/prescriptionApi';
import type { PrescriptionMedicine, PrescriptionStreamResult } from '../api/types';

export type OCRStatus = 'idle' | 'processing' | 'done' | 'error';
export type FindTab = 'stores' | 'medicines' | 'bucket';

export interface BucketItem {
  medicine: PrescriptionMedicine;
  quantity: number;
}

export interface OCRState {
  status: OCRStatus;
  streamingMedicines: PrescriptionMedicine[];
  error: string | null;
  detectedCount: number;
}

const INITIAL_STATE: OCRState = {
  status: 'idle',
  streamingMedicines: [],
  error: null,
  detectedCount: 0,
};

export const usePrescriptionOCR = (initialMedicines?: PrescriptionMedicine[], initialCount?: number) => {
  const [activeTab, setActiveTab] = useState<FindTab>('stores');
  const [ocrState, setOcrState] = useState<OCRState>(
    initialMedicines
      ? { status: 'done', streamingMedicines: initialMedicines, error: null, detectedCount: initialCount || 0 }
      : INITIAL_STATE
  );
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const uploadImage = useCallback(async (file: { uri: string; name: string; type: string }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setOcrState({
      status: 'processing',
      streamingMedicines: [],
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
            error: null,
            detectedCount: result.meta.detectedCount,
          });
          setActiveTab('medicines');
        },
        onError: (error) => {
          setOcrState(prev => ({ ...prev, status: 'error', error }));
        },
      },
      controller.signal,
    );
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setOcrState(INITIAL_STATE);
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
    activeTab,
    setActiveTab,
    ocrState,
    uploadImage,
    reset,
    bucketItems,
    addToBucket,
    updateQuantity,
    removeFromBucket,
    selectedDelivery,
    setSelectedDelivery,
    bucketCount,
    bucketTotal,
  };
};
