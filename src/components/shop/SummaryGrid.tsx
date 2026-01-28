import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import LootBoxService, { PackResult, CardResult } from '../../services/LootBoxService';

const { width } = Dimensions.get('window');
const MINI_CARD_WIDTH = (width - 80) / 4; // 4 cartes par ligne avec marges
const MINI_CARD_HEIGHT = MINI_CARD_WIDTH * 1.4;

interface SummaryGridProps {
    allResults: PackResult[];
    onClose: () => void;
}

interface StatBadgeProps {
    icon: string;
    label: string;
    value: string | number;
    color: string;
    delay?: number;
}

// Badge de statistique animé
const StatBadge = ({ icon, label, value, color, delay = 0 }: StatBadgeProps) => (
    <Animated.View
        entering={FadeInUp.delay(delay).duration(350)}
        style={[styles.statBadge, { borderColor: color }]}
    >
        <Ionicons name={icon as any} size={18} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
);

// Mini carte pour la grille de récap
const MiniCard = React.memo(({
    card,
    index,
}: {
    card: CardResult;
    index: number;
}) => {
    const rarityColor = LootBoxService.getRarityColor(card.item.rarity || 'common');
    const isLegendaryOrMythic = ['legendary', 'mythic'].includes(card.item.rarity || 'common');

    return (
        <Animated.View
            entering={FadeIn.delay(80 + index * 40).duration(300)}
            style={[
                styles.miniCard,
                { borderColor: rarityColor },
                isLegendaryOrMythic && styles.miniCardLegendary,
            ]}
        >
            {/* Glow pour legendary/mythic */}
            {isLegendaryOrMythic && (
                <View style={[styles.miniCardGlow, { backgroundColor: rarityColor }]} />
            )}

            {/* Contenu de la carte */}
            <View style={styles.miniCardContent}>
                {/* Preview de l'item */}
                <View style={styles.miniPreviewContainer}>
                    {card.item.preview && card.item.preview.startsWith('#') ? (
                        <View style={[styles.miniColorPreview, { backgroundColor: card.item.preview }]} />
                    ) : (
                        <Ionicons
                            name={(card.item.icon as any) || 'cube'}
                            size={24}
                            color={rarityColor}
                        />
                    )}
                </View>

                {/* Badge rareté */}
                <View style={[styles.miniRarityBadge, { backgroundColor: rarityColor }]}>
                    <Text style={styles.miniRarityText}>
                        {(card.item.rarity || 'common').charAt(0).toUpperCase()}
                    </Text>
                </View>

                {/* Badge NEW */}
                {card.isNew && (
                    <View style={styles.newBadge}>
                        <Text style={styles.newText}>NEW</Text>
                    </View>
                )}

                {/* Badge SHINY */}
                {card.isShiny && (
                    <View style={styles.shinyBadge}>
                        <Ionicons name="sparkles" size={10} color="#FFF" />
                    </View>
                )}

                {/* Dust si doublon */}
                {card.dustValue && (
                    <View style={styles.dustBadge}>
                        <Ionicons name="flash" size={10} color="#FCD34D" />
                        <Text style={styles.dustText}>+{card.dustValue}</Text>
                    </View>
                )}
            </View>

            {/* Nom de l'item */}
            <Text style={styles.miniItemName} numberOfLines={1}>
                {card.item.name}
            </Text>
        </Animated.View>
    );
});

export default function SummaryGrid({ allResults, onClose }: SummaryGridProps) {
    // Flatten toutes les cartes
    const allCards = allResults.flatMap(r => r.cards);
    const totalDust = allResults.reduce((sum, r) => sum + r.totalDust, 0);
    const newItems = allCards.filter(c => c.isNew).length;
    const duplicates = allCards.filter(c => c.dustValue).length;
    const shinyItems = allCards.filter(c => c.isShiny).length;

    // Compter par rareté
    const legendaries = allCards.filter(
        c => c.item.rarity === 'legendary' || c.item.rarity === 'mythic'
    );
    const epics = allCards.filter(c => c.item.rarity === 'epic');

    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                <Text style={styles.title}>
                    {allResults.length} PACK{allResults.length > 1 ? 'S' : ''} OUVERT{allResults.length > 1 ? 'S' : ''} !
                </Text>
                <Text style={styles.subtitle}>
                    {allCards.length} objet{allCards.length > 1 ? 's' : ''} obtenu{allCards.length > 1 ? 's' : ''}
                </Text>
            </Animated.View>

            {/* Statistiques */}
            <View style={styles.statsContainer}>
                <StatBadge
                    icon="sparkles"
                    label="Nouveaux"
                    value={newItems}
                    color="#10B981"
                    delay={100}
                />
                <StatBadge
                    icon="repeat"
                    label="Doublons"
                    value={duplicates}
                    color="#6B7280"
                    delay={150}
                />
                <StatBadge
                    icon="flash"
                    label="Poussière"
                    value={totalDust > 0 ? `+${totalDust}` : '0'}
                    color="#FCD34D"
                    delay={200}
                />
            </View>

            {/* Highlight des raretés spéciales */}
            {(legendaries.length > 0 || epics.length > 0 || shinyItems > 0) && (
                <Animated.View
                    entering={FadeIn.delay(300).duration(350)}
                    style={styles.highlightContainer}
                >
                    {legendaries.length > 0 && (
                        <LinearGradient
                            colors={['rgba(234, 179, 8, 0.2)', 'rgba(234, 179, 8, 0.05)']}
                            style={styles.highlightBadge}
                        >
                            <Ionicons name="star" size={16} color="#EAB308" />
                            <Text style={styles.highlightText}>
                                {legendaries.length} LÉGENDAIRE{legendaries.length > 1 ? 'S' : ''} !
                            </Text>
                        </LinearGradient>
                    )}
                    {epics.length > 0 && (
                        <LinearGradient
                            colors={['rgba(168, 85, 247, 0.2)', 'rgba(168, 85, 247, 0.05)']}
                            style={styles.highlightBadge}
                        >
                            <Ionicons name="diamond" size={16} color="#A855F7" />
                            <Text style={[styles.highlightText, { color: '#A855F7' }]}>
                                {epics.length} ÉPIQUE{epics.length > 1 ? 'S' : ''}
                            </Text>
                        </LinearGradient>
                    )}
                    {shinyItems > 0 && (
                        <LinearGradient
                            colors={['rgba(236, 72, 153, 0.2)', 'rgba(236, 72, 153, 0.05)']}
                            style={styles.highlightBadge}
                        >
                            <Ionicons name="sparkles" size={16} color="#EC4899" />
                            <Text style={[styles.highlightText, { color: '#EC4899' }]}>
                                {shinyItems} SHINY !
                            </Text>
                        </LinearGradient>
                    )}
                </Animated.View>
            )}

            {/* Grille de cartes */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.cardGrid}
                showsVerticalScrollIndicator={false}
            >
                {allCards.map((card, index) => (
                    <MiniCard key={`${card.item.id}-${index}`} card={card} index={index} />
                ))}
            </ScrollView>

            {/* Bouton de fermeture */}
            <Animated.View entering={FadeInUp.delay(400).duration(350)} style={styles.footer}>
                <TouchableOpacity style={styles.collectButton} onPress={onClose}>
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.collectButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                        <Text style={styles.collectButtonText}>TOUT RÉCUPÉRER</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    statBadge: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        minWidth: 80,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    highlightContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 15,
    },
    highlightBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    highlightText: {
        color: '#EAB308',
        fontWeight: 'bold',
        fontSize: 12,
    },
    scrollView: {
        flex: 1,
        marginBottom: 10,
    },
    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 10,
    },
    miniCard: {
        width: MINI_CARD_WIDTH,
        height: MINI_CARD_HEIGHT,
        backgroundColor: '#1F2937',
        borderRadius: 8,
        borderWidth: 2,
        overflow: 'hidden',
        position: 'relative',
    },
    miniCardLegendary: {
        shadowColor: '#EAB308',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    miniCardGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        opacity: 0.2,
        borderRadius: 12,
    },
    miniCardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    miniPreviewContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniColorPreview: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    miniRarityBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniRarityText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    newBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#EF4444',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newText: {
        color: '#FFF',
        fontSize: 7,
        fontWeight: 'bold',
    },
    shinyBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#EC4899',
        padding: 3,
        borderRadius: 4,
    },
    dustBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.3)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    dustText: {
        color: '#FCD34D',
        fontSize: 8,
        fontWeight: 'bold',
    },
    miniItemName: {
        fontSize: 9,
        color: '#FFF',
        textAlign: 'center',
        paddingHorizontal: 4,
        paddingBottom: 4,
        fontWeight: '500',
    },
    footer: {
        paddingVertical: 15,
    },
    collectButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    collectButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 30,
        gap: 10,
    },
    collectButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
