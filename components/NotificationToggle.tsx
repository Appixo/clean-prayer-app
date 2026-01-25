import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import * as Notifications from 'expo-notifications';
import { logger } from '../lib/logger';
import { refreshAllNotifications } from '../lib/notifications';

interface NotificationToggleProps {
    prayerName: string;
}

export function NotificationToggle({ prayerName }: NotificationToggleProps) {
    const { notifications, toggleNotification } = useStore();
    const isEnabled = notifications[prayerName];
    const [loading, setLoading] = React.useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            const newState = !isEnabled;

            // 1. Request permissions if enabling
            if (newState) {
                const { status } = await Notifications.getPermissionsAsync();
                if (status !== 'granted') {
                    const { status: newStatus } = await Notifications.requestPermissionsAsync();
                    if (newStatus !== 'granted') {
                        alert('Bildirim izni verilmedi.');
                        return;
                    }
                }
            }

            // 2. Update Store
            toggleNotification(prayerName, newState);

            // 3. Refresh Notifications Logic
            await refreshAllNotifications();

        } catch (error) {
            logger.error('Error toggling notification', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity
            onPress={handleToggle}
            disabled={loading}
            className={`p-2 rounded-full ${isEnabled ? 'bg-blue-100' : 'bg-slate-100'}`}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
            ) : isEnabled ? (
                <Bell size={20} color="#2563EB" fill="#2563EB" />
            ) : (
                <BellOff size={20} color="#94a3b8" />
            )}
        </TouchableOpacity>
    );
}
