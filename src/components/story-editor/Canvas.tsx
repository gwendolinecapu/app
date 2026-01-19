import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, useWindowDimensions } from 'react-native';
import { DraggableItem } from './DraggableItem';
import { colors } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../../lib/haptics';

export interface EditorLayer {
    id: string;
    type: 'image' | 'text';
    content: string; // URI for image, text string for text
    color?: string; // For text
    backgroundColor?: string; // For text background
}

interface CanvasProps {
    layers: EditorLayer[];
    backgroundColor?: string;
    backgroundGradient?: [string, string, ...string[]];
    backgroundImage?: string;
    onDeleteLayer?: (id: string) => void;
}

export const Canvas = React.forwardRef<View, CanvasProps>(({ layers, backgroundColor, backgroundGradient, backgroundImage, onDeleteLayer }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const { width, height } = useWindowDimensions();

    return (
        <View ref={ref} style={[styles.canvas, { backgroundColor: backgroundColor || colors.background }]} collapsable={false}>
            {backgroundGradient && (
                <LinearGradient colors={backgroundGradient} style={StyleSheet.absoluteFill} />
            )}
            {backgroundImage && (
                <Image source={{ uri: backgroundImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}
            {layers.map(layer => (
                <DraggableItem
                    key={layer.id}
                    initialX={width / 2 - (layer.type === 'image' ? 150 : 100)}
                    initialY={height / 2 - (layer.type === 'image' ? 150 : 25)}
                    onDragStart={() => {
                        setIsDragging(true);
                        triggerHaptic.selection();
                    }}
                    onDragEnd={(x, y) => {
                        setIsDragging(false);
                        const itemHeight = layer.type === 'image' ? 300 : 50;
                        const centerY = y + itemHeight / 2;

                        // Check if center of item reached the bottom zone
                        if (centerY > height - 200) {
                            triggerHaptic.warning();
                            onDeleteLayer?.(layer.id);
                        }
                    }}
                >
                    {layer.type === 'image' ? (
                        <Image source={{ uri: layer.content }} style={styles.imageLayer} resizeMode="contain" />
                    ) : (
                        <Text style={[styles.textLayer, { color: layer.color || 'white', backgroundColor: layer.backgroundColor }]}>
                            {layer.content}
                        </Text>
                    )}
                </DraggableItem>
            ))}

            {isDragging && (
                <View style={styles.trashZone}>
                    <View style={styles.trashIconBg}>
                        <Ionicons name="trash-outline" size={28} color="white" />
                    </View>
                    <Text style={styles.trashText}>Glisser ici pour supprimer</Text>
                </View>
            )}
        </View>
    );
});

Canvas.displayName = 'Canvas';

const styles = StyleSheet.create({
    canvas: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    imageLayer: {
        width: 300,
        height: 300,
    },
    textLayer: {
        fontSize: 32,
        fontWeight: 'bold',
        padding: 8,
        borderRadius: 8,
    },
    trashZone: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
    },
    trashIconBg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 59, 48, 0.8)', // Red semi-transparent
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    trashText: {
        color: 'white',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    }
});
