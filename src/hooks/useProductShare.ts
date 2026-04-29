import { useState } from 'react';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { Medicine } from '../api/types';

interface ShareOptions {
    onShareStart?: () => void;
    onShareComplete?: () => void;
    onShareError?: (error: any) => void;
}

export const useProductShare = () => {
    const [isSharing, setIsSharing] = useState(false);

    const shareProduct = async (product: Medicine, platform?: string, options?: ShareOptions) => {
        if (!product) return;

        setIsSharing(true);
        options?.onShareStart?.();

        const productUrl = `https://epharmacy.app/product/${product._id}`;
        // Handle both object images and string images
        let imageUrl = '';
        if (Array.isArray(product.itemImages) && product.itemImages.length > 0) {
            imageUrl = product.itemImages[0];
        } else if (typeof product.image === 'string') {
            imageUrl = product.image;
        }

        try {
            if (!imageUrl) {
                // If no image, just share text
                const fallbackMessage = createShareMessage(product, productUrl);
                await Share.open({ message: fallbackMessage });
                setIsSharing(false);
                options?.onShareComplete?.();
                return;
            }

            // Download image
            const imageName = `${(product.itemName || 'product').replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.jpg`;
            const imagePath = `${RNFS.CachesDirectoryPath}/${imageName}`;

            await RNFS.downloadFile({
                fromUrl: imageUrl,
                toFile: imagePath,
            }).promise;

            const message = createShareMessage(product, productUrl);
            const shareOptions = {
                title: product.itemName || '',
                message: message,
                url: `file://${imagePath}`,
                type: 'image/jpeg',
            };

            if (platform === 'whatsapp') {
                await Share.shareSingle({
                    ...shareOptions,
                    social: Share.Social.WHATSAPP as any,
                });
            } else if (platform === 'instagram') {
                await Share.shareSingle({
                    ...shareOptions,
                    social: Share.Social.INSTAGRAM as any,
                });
            } else if (platform === 'facebook') {
                await Share.shareSingle({
                    ...shareOptions,
                    social: Share.Social.FACEBOOK as any,
                });
            } else if (platform === 'telegram') {
                await Share.shareSingle({
                    ...shareOptions,
                    social: Share.Social.TELEGRAM as any,
                });
            } else if (platform === 'x') {
                // twitter/x usually requires just message + url, image handling varies
                await Share.shareSingle({
                    ...shareOptions,
                    social: Share.Social.TWITTER as any,
                });
            } else {
                await Share.open(shareOptions);
            }

            // Cleanup
            setTimeout(() => {
                RNFS.unlink(imagePath).catch(() => { });
            }, 5000);

            options?.onShareComplete?.();

        } catch (error: any) {
            console.log('Share error:', error);
            // Fallback to text only if image fails or user cancels
            const fallbackMessage = createShareMessage(product, productUrl);
            try {
                if (error?.message !== 'User did not share') {
                    await Share.open({ message: fallbackMessage });
                }
            } catch (e) { }

            options?.onShareError?.(error);
        } finally {
            setIsSharing(false);
        }
    };

    const createShareMessage = (product: Medicine, url: string) => {
        const finalPrice = product.itemInitialPrice
            ? (product.itemInitialPrice - (product.itemInitialPrice * (product.discount || 0) / 100))
            : 0;

        return `🏥 *Medicare - Your Health Partner*\n\n` +
            `🛒 *${product.itemName}*\n\n` +
            `⭐ Rating: ${product.itemRatings || 0}/5\n` +
            `💰 Price: ₹${Math.round(finalPrice)} (${product.discount || 0}% OFF)\n\n` +
            `🔥 Tap to open in app:\n${url}`;
    };

    return {
        shareProduct,
        isSharing
    };
};
