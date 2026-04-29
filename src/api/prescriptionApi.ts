import { Platform } from 'react-native';
import { API_BASE_URL, API_ROUTES, API_TIMEOUT } from './config';
import { secureStorage } from '../utils/storage';
import { mapApiError } from '../utils/errorHandler';
import type { PrescriptionMedicine, PrescriptionStreamResult } from './types';

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

export interface PrescriptionStreamCallbacks {
  onMedicineFound: (medicine: PrescriptionMedicine, count: number) => void;
  onComplete: (result: PrescriptionStreamResult) => void;
  onError: (error: string) => void;
}

const getAuthToken = (): string | null => {
  try {
    const token = secureStorage.getString(TOKEN_KEY);
    const expiryStr = secureStorage.getString(TOKEN_EXPIRY_KEY);
    if (!token) return null;
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Number.isFinite(expiry) && Date.now() >= expiry) return null;
    }
    return token;
  } catch {
    return null;
  }
};

const buildFormData = (file: { uri: string; name: string; type: string }): FormData => {
  const formData = new FormData();
  formData.append('prescription', {
    uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
    name: file.name || 'prescription.jpg',
    type: file.type || 'image/jpeg',
  } as any);
  return formData;
};

export const uploadPrescriptionStream = async (
  file: { uri: string; name: string; type: string },
  callbacks: PrescriptionStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> => {
  if (__DEV__) {
    console.log(`[HTTP]  Request: POST ${API_ROUTES.prescriptions.uploadStream}`);
  }

  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/x-ndjson, text/plain, */*' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), API_TIMEOUT);

  const compositeSignal: AbortSignal = signal
    ? mergeAbortSignals(signal, timeoutController.signal)
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_ROUTES.prescriptions.uploadStream}`, {
      method: 'POST',
      body: buildFormData(file),
      signal: compositeSignal,
      headers,
    });
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e?.name === 'AbortError') {
      if (signal?.aborted) return;
      callbacks.onError('Request timed out. Please try again.');
      return;
    }
    callbacks.onError(mapApiError(e).message);
    return;
  }

  if (!response.ok) {
    clearTimeout(timeoutId);
    const message = await safeReadErrorMessage(response);
    callbacks.onError(message);
    return;
  }

  const counter = { value: 0 };

  const processLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('✅') || trimmed.startsWith('[')) return false;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.event === 'medicines_found') {
        callbacks.onComplete(parsed as PrescriptionStreamResult);
        return true;
      }
      if (parsed?.drugName) {
        counter.value++;
        callbacks.onMedicineFound(parsed as PrescriptionMedicine, counter.value);
      }
    } catch {
      // partial chunk — buffered upstream
    }
    return false;
  };

  const body = (response as any).body;
  const TextDecoderCtor: any = (globalThis as any).TextDecoder;
  try {
    if (body && typeof body.getReader === 'function' && TextDecoderCtor) {
      const reader: any = body.getReader();
      const decoder: any = new TextDecoderCtor();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (processLine(line)) return;
          }
        }
        if (buffer.trim()) processLine(buffer);
      } finally {
        reader.cancel?.();
      }
    } else {
      const text = await response.text();
      for (const line of text.split('\n')) {
        if (processLine(line)) return;
      }
    }
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      callbacks.onError(mapApiError(e).message);
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

const safeReadErrorMessage = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        if (json?.message) return String(json.message);
        if (json?.error) return String(json.error);
      } catch {
        if (text.length < 200) return text;
      }
    }
  } catch {
    // ignore
  }
  if (response.status === 401) return 'Session expired. Please log in again.';
  if (response.status === 413) return 'File too large. Please choose a smaller image.';
  if (response.status >= 500) return 'Our servers are busy right now. Please try again.';
  return `Upload failed (${response.status}). Please try again.`;
};

const mergeAbortSignals = (a: AbortSignal, b: AbortSignal): AbortSignal => {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (a.aborted || b.aborted) controller.abort();
  else {
    a.addEventListener('abort', onAbort, { once: true });
    b.addEventListener('abort', onAbort, { once: true });
  }
  return controller.signal;
};
