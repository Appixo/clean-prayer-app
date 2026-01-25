/**
 * Widget Task Handler Registration
 * 
 * This file registers widget-related tasks and handlers.
 * Import this at the top of app/_layout.tsx to ensure it runs before the app loads.
 * 
 * CRITICAL: Widget code must be isolated from NativeWind/css-interop.
 * All widget components use pure React Native StyleSheet only.
 * 
 * NOTE: updateWidgetData is only imported here for background task registration.
 * The actual widget handler (widgets/widget-task-handler.tsx) does NOT import it
 * and reads directly from AsyncStorage to avoid dependency cycles.
 */

import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgets/widget-task-handler';

// Lazy import updateWidgetData to avoid pulling in store dependencies
// during widget registration - this is only for background task updates
let updateWidgetData: (() => Promise<void>) | null = null;
if (Platform.OS === 'android') {
    // Dynamically import to avoid circular dependency at module load time
    import('./lib/widget-bridge')
        .then((module) => {
            updateWidgetData = module.updateWidgetData;
        })
        .catch((error) => {
            console.warn('Failed to load widget-bridge for background task', error);
        });
}

// Register widget background task for periodic updates
// Use dynamic import to handle cases where native module isn't available
if (Platform.OS === 'android') {
    // Dynamically import TaskManager to handle cases where native module isn't linked
    import('expo-task-manager')
        .then((TaskManager) => {
            try {
                // Check if task is already defined to avoid re-registration errors
                const isTaskDefined = TaskManager.isTaskDefined('RNWidgetBackgroundTask');
                if (!isTaskDefined) {
                    TaskManager.defineTask('RNWidgetBackgroundTask', async () => {
                        try {
                            // Update widget data when background task runs
                            if (updateWidgetData) {
                                await updateWidgetData();
                            } else {
                                // If lazy load failed, try direct import
                                const { updateWidgetData: updateData } = await import('./lib/widget-bridge');
                                await updateData();
                            }
                        } catch (error) {
                            // Silently fail in background - don't spam logs
                            if (__DEV__) {
                                console.error('Widget background task failed', error);
                            }
                        }
                    });
                }
            } catch (error) {
                // Task might already be defined or registration failed - this is okay
                // Suppress error to avoid noise in logs
                if (__DEV__ && error?.message && !error.message.includes('already')) {
                    console.warn('RNWidgetBackgroundTask registration:', error.message);
                }
            }
        })
        .catch((error) => {
            // Native module not available - this is okay in development
            // The app will still work, just without background widget updates
            if (__DEV__) {
                console.warn('expo-task-manager native module not available. Widget background tasks disabled.', error.message);
            }
        });
}

// Register widget task handler
// This handler reads directly from AsyncStorage and does NOT import store/widget-bridge
try {
    registerWidgetTaskHandler(widgetTaskHandler);
} catch (error) {
    if (__DEV__) {
        console.warn('Widget task handler registration error:', error);
    }
}
