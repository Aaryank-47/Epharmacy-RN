/**
 * Socket.IO Event Types
 * Type definitions for all WebSocket events
 */

// Base event wrapper
export interface SocketEvent<T = unknown> {
    type: string;
    data: T;
    timestamp: number;
}

// Product type
export interface Product {
    _id: string;
    itemName: string;
    itemFinalPrice: number;
    itemInitialPrice?: number;
    itemDiscount: number;
    itemCategory?: string;
    itemImages?: string[];
    image?: string | null;
    isPremium?: boolean;
    description?: string;
    stock?: number;
}

// Order type
export interface Order {
    orderId: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    items?: Product[];
    totalAmount?: number;
    updatedAt?: string;
}

// Notification type
export interface AppNotification {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

// Event payloads
export interface NewProductPayload extends SocketEvent<Product> {
    type: 'new_product';
}

export interface ProductUpdatedPayload extends SocketEvent<Product> {
    type: 'product_updated';
}

export interface ProductDeletedPayload extends SocketEvent<{ productId: string }> {
    type: 'product_deleted';
}

export interface RecentlyViewedPayload extends SocketEvent<Product> {
    type: 'recently_viewed';
}

export interface CategoryProductPayload extends SocketEvent<Product> {
    type: 'category_new_product';
}

export interface TrendingProductsPayload extends SocketEvent<Product[]> {
    type: 'trending_products';
}

export interface WishlistUpdatePayload extends SocketEvent<Product> {
    type: 'wishlist_update';
    action: 'added' | 'removed';
}

export interface CartUpdatePayload extends SocketEvent<Product> {
    type: 'cart_update';
    action: 'added' | 'removed' | 'updated';
}

export interface OrderStatusPayload extends SocketEvent<Order> {
    type: 'order_status_update';
}

export interface NotificationPayload extends SocketEvent<AppNotification> {
    type: 'notification';
}

// Socket event names
export const SOCKET_EVENTS = {
    // Connection
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',

    // Room management (emit)
    JOIN_USER: 'join:user',
    LEAVE_USER: 'leave:user',
    JOIN_CATEGORY: 'join:category',
    LEAVE_CATEGORY: 'leave:category',

    // Product events (listen)
    PRODUCT_NEW: 'product:new',
    PRODUCT_UPDATED: 'product:updated',
    PRODUCT_DELETED: 'product:deleted',

    // User-specific events (listen)
    RECENTLY_VIEWED_UPDATE: 'recentlyViewed:update',
    CATEGORY_VIEWED_UPDATE: 'categoryViewed:update',
    WISHLIST_UPDATE: 'wishlist:update',
    CART_UPDATE: 'cart:update',
    ORDER_STATUS: 'order:status',
    NOTIFICATION_NEW: 'notification:new',

    // Category events (listen)
    CATEGORY_PRODUCT_NEW: 'category:product:new',
    CATEGORY_PRODUCT_UPDATED: 'category:product:updated',
    CATEGORY_PRODUCT_DELETED: 'category:product:deleted',

    // Global events (listen)
    TRENDING_PRODUCTS_UPDATE: 'trendingProducts:update',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// Connection status
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
