import httpClient from './httpClient';
import { API_ROUTES } from './config';
import type { UploadedFilePayload, OcrResponse } from './types';
import { Platform } from 'react-native';

// ============================================================================
// PRESCRIPTION API
// ============================================================================

/**
 * Upload a prescription image for OCR extraction
 * @param file The file object containing uri, name, and type
 * @returns OCR extraction response
 */
export const uploadPrescription = async (file: UploadedFilePayload): Promise<OcrResponse> => {
    const formData = new FormData();

    formData.append('prescription', {
        uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
        name: file.name || 'prescription.jpg',
        type: file.type || 'image/jpeg',
    } as any);

    const response = await httpClient.post(API_ROUTES.prescriptions.ocrExtract, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => {
            // Axios handles FormData transformation automatically, 
            // but we need to ensure it doesn't try to stringify it if we passed it as data
            return data;
        },
    });

    return response.data;
};

export default {
    uploadPrescription
};
