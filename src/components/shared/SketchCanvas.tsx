import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, TouchableOpacity, Text, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ViewShot from "react-native-view-shot";
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing } from '../../lib/theme';

interface SketchCanvasProps {
    onSave: (uri: string) => void;
    onClose: () => void;
}

export const SketchCanvas: React.FC<SketchCanvasProps> = ({ onSave, onClose }) => {
    const insets = useSafeAreaInsets();
    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    const viewShotRef = useRef<ViewShot>(null);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath(`M${locationX.toFixed(0)},${locationY.toFixed(0)}`);
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath((prev) => `${prev} L${locationX.toFixed(0)},${locationY.toFixed(0)}`);
            },
            onPanResponderRelease: () => {
                if (currentPath) {
                    setPaths((prev) => [...prev, currentPath]);
                    setCurrentPath('');
                }
            },
        })
    ).current;

    const handleSave = async () => {
        if (viewShotRef.current && (paths.length > 0 || currentPath)) {
            try {
                // @ts-ignore
                const uri = await viewShotRef.current.capture();
                onSave(uri);
            } catch (error) {
                console.error("Capture failed", error);
            }
        } else {
            onClose();
        }
    };

    const handleClear = () => {
        setPaths([]);
        setCurrentPath('');
    };

    const handleUndo = () => {
        setPaths((prev) => prev.slice(0, -1));
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Croquis (Pose)</Text>
                <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
                    <Text style={[styles.headerBtnText, { color: colors.primary, fontWeight: 'bold' }]}>Valider</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.canvasContainer}>
                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9, result: "tmpfile" }} style={styles.viewShot}>
                    <View style={styles.canvas} {...panResponder.panHandlers}>
                        <Svg height="100%" width="100%" viewBox={`0 0 ${Dimensions.get('window').width} 400`}>
                            {/* White Background for Sketch */}
                            <Path
                                d={`M0,0 L${Dimensions.get('window').width},0 L${Dimensions.get('window').width},400 L0,400 Z`}
                                fill="white"
                            />
                            {/* Existing Paths */}
                            {paths.map((d, index) => (
                                <Path
                                    key={index}
                                    d={d}
                                    stroke="black"
                                    strokeWidth={4}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ))}
                            {/* Current Path */}
                            {currentPath ? (
                                <Path
                                    d={currentPath}
                                    stroke="black"
                                    strokeWidth={4}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ) : null}
                        </Svg>
                    </View>
                </ViewShot>
            </View>

            <View style={styles.toolbar}>
                <TouchableOpacity onPress={handleUndo} style={styles.toolBtn}>
                    <Ionicons name="arrow-undo" size={24} color="white" />
                    <Text style={styles.toolText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClear} style={[styles.toolBtn, { backgroundColor: '#FF4444' }]}>
                    <Ionicons name="trash" size={24} color="white" />
                    <Text style={styles.toolText}>Effacer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: '#1E1E1E',
        zIndex: 10,
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerBtn: {
        padding: spacing.sm,
    },
    headerBtnText: {
        color: 'white',
        fontSize: 16,
    },
    canvasContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333',
    },
    viewShot: {
        width: Dimensions.get('window').width,
        height: 400, // Fixed height specifically for control image ratio (approx square or landscape)
        backgroundColor: 'white',
    },
    canvas: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: spacing.lg,
        backgroundColor: '#1E1E1E',
        paddingBottom: 40,
    },
    toolBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#444',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: borderRadius.full,
        gap: 8,
    },
    toolText: {
        color: 'white',
        fontWeight: '600',
    },
});
