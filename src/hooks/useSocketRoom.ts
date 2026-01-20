/**
 * useSocketRoom Hook
 * Manages joining/leaving socket rooms
 */

import { useEffect } from 'react';
import socketService from '../services/socketService';

type RoomType = 'user' | 'category';


export function useSocketRoom(type: RoomType, id?: string | null): void {
    useEffect(() => {
        if (!id) return;

        // Join room
        if (type === 'user') {
            socketService.joinUserRoom(id);
        } else {
            socketService.joinCategoryRoom(id);
        }

        // Leave room on cleanup
        return () => {
            if (type === 'user') {
                socketService.leaveUserRoom(id);
            } else {
                socketService.leaveCategoryRoom(id);
            }
        };
    }, [type, id]);
}

export default useSocketRoom;
