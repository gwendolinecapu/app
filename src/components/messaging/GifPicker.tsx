import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface GifPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

const GIF_CATEGORIES = [
    { id: 'trending', label: 'Tendances' },
    { id: 'happy', label: 'Heureux' },
    { id: 'sad', label: 'Triste' },
    { id: 'angry', label: 'En colère' },
    { id: 'love', label: 'Amour' },
    { id: 'confused', label: 'Confus' },
];

const MOCK_GIFS: Record<string, string[]> = {
    trending: [
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzM0YjM0MzM0MzM0MzM0MzM0MzM0MzM0MzM0MzM0MzM0MzM0MyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/3o7TKSjRrfIPjeiVyM/giphy.gif',
        'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
        'https://media.giphy.com/media/l0HlHJGHe3yAMjfFK/giphy.gif',
        'https://media.giphy.com/media/3o6ZxpC3J9K4Q/giphy.gif',
        'https://media.giphy.com/media/xT5LMB2WiOdjpB7K4o/giphy.gif',
        'https://media.giphy.com/media/d2Z4rTi11c9LRita/giphy.gif',
    ],
    happy: [
        'https://media.giphy.com/media/chzz1FQgqhytWRWbp3/giphy.gif',
        'https://media.giphy.com/media/l41VYh7tUe8452n16/giphy.gif',
        'https://media.giphy.com/media/10UeedrT5MIfPG/giphy.gif',
        'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif',
        'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif',
    ],
    sad: [
        'https://media.giphy.com/media/OPU6wzx8JJiyk/giphy.gif',
        'https://media.giphy.com/media/7SF5scGB2AFrgsXP63/giphy.gif',
        'https://media.giphy.com/media/d2lcHJTG5TSCcDkI/giphy.gif',
        'https://media.giphy.com/media/pM4wEZkik8KrS/giphy.gif',
    ],
    angry: [
        'https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif',
        'https://media.giphy.com/media/l1J9u3TZfpmeDLkD6/giphy.gif',
        'https://media.giphy.com/media/3o9bJX4O9ShW1LnxCg/giphy.gif',
        'https://media.giphy.com/media/yr7n0u3qzO9nG/giphy.gif',
    ],
    love: [
        'https://media.giphy.com/media/c76IJLufpNwSULPk77/giphy.gif',
        'https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif',
        'https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif',
        'https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif',
    ],
    confused: [
        'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
        'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
        'https://media.giphy.com/media/xT0xeuOy2Fcl9vDGiA/giphy.gif',
        'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif',
    ],
};

export const GifPicker: React.FC<GifPickerProps> = ({ visible, onClose, onSelect }) => {
    const [activeCategory, setActiveCategory] = useState('trending');

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>GIFs</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Categories */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContainer}
                    >
                        {GIF_CATEGORIES.map(category => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryChip,
                                    activeCategory === category.id && styles.activeCategoryChip
                                ]}
                                onPress={() => setActiveCategory(category.id)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    activeCategory === category.id && styles.activeCategoryText
                                ]}>
                                    {category.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* GIFs Grid */}
                    <ScrollView contentContainerStyle={styles.gridContainer}>
                        <View style={styles.grid}>
                            {MOCK_GIFS[activeCategory]?.map((url, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.gifContainer}
                                    onPress={() => onSelect(url)}
                                >
                                    <Image
                                        source={{ uri: url }}
                                        style={styles.gifImage}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        height: '70%',
        paddingTop: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h3,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeButton: {
        padding: spacing.xs,
    },
    categoriesContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        height: 40,
    },
    categoryChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        marginRight: spacing.sm,
        height: 32,
        justifyContent: 'center',
    },
    activeCategoryChip: {
        backgroundColor: colors.primary,
    },
    categoryText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    activeCategoryText: {
        color: 'white',
    },
    gridContainer: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gifContainer: {
        width: '48%',
        aspectRatio: 1.3, // or 1 depending on preference
        marginBottom: spacing.md,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        backgroundColor: colors.surface,
    },
    gifImage: {
        width: '100%',
        height: '100%',
    },
});
