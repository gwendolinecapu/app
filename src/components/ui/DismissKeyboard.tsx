import React from 'react';
import { Keyboard, TouchableWithoutFeedback, View, StyleSheet, Platform } from 'react-native';

interface DismissKeyboardProps {
    children: React.ReactNode;
}

export const DismissKeyboard = ({ children }: DismissKeyboardProps) => {
    if (Platform.OS === 'web') {
        return <View style={styles.container}>{children}</View>;
    }
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                {children}
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
