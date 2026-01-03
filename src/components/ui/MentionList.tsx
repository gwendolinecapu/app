import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { Alter, System } from '../../types';

export interface MentionSuggestion {
    id: string;
    name: string; // Display name
    username?: string; // Handle
    avatar?: string;
    type: 'alter' | 'system';
}

interface MentionListProps {
    data: MentionSuggestion[];
    onSelect: (item: MentionSuggestion) => void;
}

export const MentionList: React.FC<MentionListProps> = ({ data, onSelect }) => {
    if (data.length === 0) return null;

    return (
        <View style={styles.container}>
            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
                        {item.avatar ? (
                            <Image source={{ uri: item.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
                            </View>
                        )}
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.type}>
                                {item.type === 'alter' ? 'Alter' : 'Système'}
                                {item.username ? ` • @${item.username}` : ''}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: 200,
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        width: '100%',
        position: 'absolute',
        bottom: 0, // Position depends on parenting, typically above keyboard
        left: 0,
        right: 0,
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    avatarInitial: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    info: {
        justifyContent: 'center',
    },
    name: {
        ...typography.body,
        fontWeight: '600',
    },
    type: {
        ...typography.caption,
        color: colors.textSecondary,
    },
});
