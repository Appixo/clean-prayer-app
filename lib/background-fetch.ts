import { Platform } from 'react-native';
import { logger } from './logger';
import { updateWidgetData } from './widget-bridge';
import { updatePrayerTimesCache } from './cache';

const BACKGROUND_FETCH_TASK = 'prayer-times-midnight-update';

// Lazy load native modules to prevent crashes when they're not available
// This prevents immediate native module access at module load time
let TaskManager: typeof import('expo-task-manager') | null = null;
let BackgroundFetch: typeof import('expo-background-fetch') | null = null;
let modulesLoaded = false;

async function loadNativeModules() {
  if (modulesLoaded) {
    return;
  }

  if (Platform.OS !== 'android') {
    modulesLoaded = true;
    return;
  }

  try {
    TaskManager = await import('expo-task-manager');
  } catch (error) {
    if (__DEV__) {
      console.warn('expo-task-manager not available, background fetch disabled');
    }
  }

  try {
    BackgroundFetch = await import('expo-background-fetch');
  } catch (error) {
    if (__DEV__) {
      console.warn('expo-background-fetch not available, background fetch disabled');
    }
  }

  modulesLoaded = true;

  // Register the background task after modules are loaded
  if (TaskManager && BackgroundFetch) {
    try {
      TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
        try {
          logger.info('Background fetch task started - Midnight update');

          // Update prayer times cache for new day
          updatePrayerTimesCache();

          // Update widget with new day's data
          await updateWidgetData();

          logger.info('Background fetch task completed successfully');
          return BackgroundFetch!.BackgroundFetchResult.NewData;
        } catch (error: any) {
          logger.error('Background fetch task failed', {
            error: error?.message || String(error),
            stack: error?.stack,
          });
          return BackgroundFetch!.BackgroundFetchResult.Failed;
        }
      });
    } catch (error: any) {
      // Task might already be defined - this is okay
      if (__DEV__ && error?.message && !error.message.includes('already')) {
        logger.warn('Failed to define background fetch task', error.message);
      }
    }
  }
}

// Load modules asynchronously (non-blocking)
if (Platform.OS === 'android') {
  loadNativeModules().catch((error) => {
    if (__DEV__) {
      console.warn('Failed to load background fetch modules', error);
    }
  });
}

/**
 * Registers the background fetch task for midnight updates
 */
export async function registerBackgroundFetch() {
  if (Platform.OS !== 'android') {
    return;
  }

  // Ensure modules are loaded and task is defined before trying to register
  await loadNativeModules();

  if (!TaskManager || !BackgroundFetch) {
    if (__DEV__) {
      logger.warn('expo-task-manager or expo-background-fetch not available, skipping background fetch registration');
    }
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (isRegistered) {
      logger.info('Background fetch task already registered');
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 60, // 1 hour minimum (Android limitation)
      stopOnTerminate: false,
      startOnBoot: true,
    });

    logger.info('Background fetch task registered successfully');
  } catch (error: any) {
    logger.error('Failed to register background fetch task', {
      error: error?.message || String(error),
    });
  }
}

/**
 * Unregisters the background fetch task
 */
export async function unregisterBackgroundFetch() {
  if (Platform.OS !== 'android') {
    return;
  }

  // Try to load modules if not already loaded
  if (!TaskManager || !BackgroundFetch) {
    await loadNativeModules();
  }

  if (!TaskManager || !BackgroundFetch) {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      logger.info('Background fetch task unregistered');
    }
  } catch (error: any) {
    logger.error('Failed to unregister background fetch task', {
      error: error?.message || String(error),
    });
  }
}
