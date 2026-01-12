import React from 'react';
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';

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
    const scaleAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 6,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible, scaleAnim]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => onDismiss?.()}
        >
            <View className="flex-1 bg-black/50 items-center justify-center p-6">
                <Animated.View
                    style={{ transform: [{ scale: scaleAnim }] }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                >
                    <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {title}
                    </Text>

                    {message && (
                        <Text className="text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            {message}
                        </Text>
                    )}

                    <View className="gap-3">
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    button.onPress?.();
                                    onDismiss?.();
                                }}
                                className={`py-4 rounded-2xl ${button.style === 'destructive'
                                    ? 'bg-red-500'
                                    : button.style === 'cancel'
                                        ? 'bg-gray-100 dark:bg-gray-700'
                                        : 'bg-emerald-500'
                                    }`}
                            >
                                <Text className={`text-center font-semibold text-base ${button.style === 'cancel'
                                    ? 'text-gray-700 dark:text-gray-300'
                                    : 'text-white'
                                    }`}>
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
