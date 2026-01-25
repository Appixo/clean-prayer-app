import React from 'react';
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message?: string;
    buttons: AlertButton[];
    onDismiss: () => void;
}

export function CustomAlert({ visible, title, message, buttons, onDismiss }: CustomAlertProps) {
    const insets = useSafeAreaInsets();
    const systemColorScheme = useColorScheme();
    const isDark = systemColorScheme === 'dark';
    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const opacityAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 6,
                    tension: 50,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
        }
    }, [visible, scaleAnim, opacityAnim]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={() => onDismiss?.()}
            statusBarTranslucent={true}
        >
            <Animated.View 
                className="flex-1 bg-black/50 items-center justify-center p-6"
                style={{ opacity: opacityAnim }}
            >
                <Animated.View
                    style={{ 
                        transform: [{ scale: scaleAnim }],
                        paddingBottom: Math.max(insets.bottom, 20),
                    }}
                    className="bg-white dark:bg-slate-800 rounded-[32px] p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700"
                >
                    <Text className="text-2xl font-black text-blue-900 dark:text-blue-300 mb-3">
                        {title}
                    </Text>

                    {message && (
                        <Text className="text-base text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            {message}
                        </Text>
                    )}

                    <View className="flex-row gap-3 justify-end">
                        {buttons.map((button, index) => {
                            const isCancel = button.style === 'cancel';
                            const isDestructive = button.style === 'destructive';
                            const isDefault = !isCancel && !isDestructive;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        button.onPress?.();
                                        onDismiss?.();
                                    }}
                                    className={`px-6 py-3 rounded-2xl ${
                                        isDestructive
                                            ? 'bg-red-600 dark:bg-red-500'
                                            : isCancel
                                                ? 'bg-slate-100 dark:bg-slate-700'
                                                : 'bg-blue-600 dark:bg-blue-500'
                                    }`}
                                    activeOpacity={0.7}
                                >
                                    <Text 
                                        className={`text-center font-bold text-base ${
                                            isCancel
                                                ? 'text-slate-700 dark:text-slate-300'
                                                : 'text-white'
                                        }`}
                                    >
                                        {button.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
