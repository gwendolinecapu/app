import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    FlatList,
    RefreshControl,
    Image,
    useWindowDimensions,
 Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VideoThumbnail } from '../../src/components/ui/VideoThumbnail';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Post } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { FollowService } from '../../src/services/follows';
import { PostService } from '../../src/services/posts';
import { PostCard } from '../../src/components/PostCard';
import { CommentsModal } from '../../src/components/CommentsModal';
import { triggerHaptic } from '../../src/lib/haptics';
import { SkeletonProfile } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';
import { getThemeColors } from '../../src/lib/cosmetics';
import { useNotificationContext } from '../../src/contexts/NotificationContext';

const ROLE_DEFINITIONS: Record<string, string> = {
    // Protection
    'Protecteur': 'Rôle de défense du système. Intervient pour protéger le corps ou les autres alters contre des situations perçues comme dangereuses ou menaçantes.',
    'Protecteur émotionnel': 'Spécialisé dans la gestion des émotions intenses. Peut "absorber" ou bloquer les émotions trop fortes pour protéger le système du surmenage émotionnel.',
    'Protecteur physique': 'Prend le contrôle lors de situations de danger physique. Souvent plus résistant à la douleur et capable de réagir rapidement en cas d\'urgence.',
    'Gatekeeper': 'Le "gardien des portes" du système. Contrôle qui peut fronter, quand, et gère l\'accès aux souvenirs (parfois traumatiques) pour protéger le système.',
    'Guardian': 'Veille sur l\'ensemble du système de manière générale. Moins spécialisé que le protecteur, il surveille le bien-être global.',
    // Persécuteurs & Antagonistes
    'Persecutor': 'Alter qui semble nuisible mais dont les actions viennent souvent d\'une volonté de protéger à sa manière (contrôle par la peur). Peut reproduire des comportements d\'agresseurs passés.',
    'Persécuteur': 'Alter qui semble nuisible mais dont les actions viennent souvent d\'une volonté de protéger à sa manière (contrôle par la peur). Peut reproduire des comportements d\'agresseurs passés.',
    'Avenger': 'Le "vengeur" du système. Réagit avec colère face aux injustices ou abus. Peut vouloir se venger des responsables extérieurs.',
    'Protecteur-Persécuteur': 'Alter hybride qui cherche à protéger le système mais utilise pour cela des méthodes agressives, punitives ou nuisibles car il pense que c\'est la seule façon efficace.',
    'Introject Persécuteur': 'Basé sur une figure abusive passée (réelle ou perçue). Il peut reproduire les comportements, paroles ou menaces de l\'abuseur, souvent par mimétisme traumatique.',
    'Destructeur': 'Adopte des comportements autodestructeurs ou dangereux pour le corps/système. Souvent lié à une souffrance intense, un programme ou des croyances négatives profondes.',
    'Saboteur': 'Entrave les efforts du système (thérapie, relations, travail, bonheur). Agit souvent par peur du changement, de l\'échec ou pour maintenir le statu quo connu.',
    'Punisseur': 'Inflige des punitions internes (douleur, insultes) ou externes aux autres alters lorsqu\'ils enfreignent des règles. Cherche souvent à "discipliner" pour éviter une punition extérieure pire.',
    // Gestion
    'Hôte': 'L\'alter principal qui gère la vie quotidienne la majorité du temps. C\'est souvent celui qui interagit le plus avec le monde extérieur.',
    'Host': 'L\'alter principal qui gère la vie quotidienne la majorité du temps. C\'est souvent celui qui interagit le plus avec le monde extérieur.',
    'Co-hôte': 'Partage les responsabilités de l\'hôte. Peut alterner avec l\'hôte principal ou fronter régulièrement pour partager la charge du quotidien.',
    'Co-host': 'Partage les responsabilités de l\'hôte. Peut alterner avec l\'hôte principal ou fronter régulièrement pour partager la charge du quotidien.',
    'Manager': 'Responsable de la planification et de l\'organisation. Prend des décisions importantes et structure la vie du système.',
    'Caretaker': 'Le "soignant" du système. Prend soin des autres alters, notamment des plus vulnérables (littles). S\'assure que tout le monde va bien.',
    'Soigneur': 'Le "soignant" du système. Prend soin des autres alters, notamment des plus vulnérables (littles). S\'assure que tout le monde va bien.',
    'ISH': 'Internal Self Helper - Un alter très conscient du fonctionnement du système. Sert de guide interne et peut aider à la communication entre alters.',
    'Mediator': 'Gère les conflits internes entre alters. Aide à trouver des compromis et maintient l\'harmonie dans le système.',
    'Archiviste': 'Garde et organise les souvenirs du système. Peut avoir accès à plus de mémoires que les autres alters.',
    'Organisateur': 'Se concentre sur l\'organisation pratique : emploi du temps, tâches à faire, gestion des responsabilités quotidiennes.',
    'Core': 'Le "noyau" ou alter original du système. Pas toujours présent ou identifiable dans tous les systèmes. Représente parfois l\'identité d\'origine.',
    // Enfance
    'Little': 'Alter enfant, généralement perçu comme ayant moins de 12 ans. Peut garder l\'innocence, la curiosité, ou les traumatismes de l\'enfance.',
    'Middle': 'Alter préadolescent (environ 9-12 ans). Entre l\'enfance et l\'adolescence, avec des caractéristiques des deux périodes.',
    'Teen': 'Alter adolescent (13-17 ans). Peut gérer des situations que les littles ne peuvent pas, tout en ayant des besoins différents des adultes.',
    'Age slider': 'Alter dont l\'âge perçu varie selon les situations ou le temps. Peut être enfant un jour et adulte un autre.',
    'Regressor': 'Alter qui peut "régresser" vers un état plus jeune, souvent en réponse au stress ou au besoin de réconfort.',
    // Traumatismes
    'Trauma holder': 'Porte les souvenirs traumatiques pour protéger les autres alters. Peut avoir des flashbacks ou des réactions liées aux traumas.',
    'Porteur de trauma': 'Porte les souvenirs traumatiques pour protéger les autres alters. Peut avoir des flashbacks ou des réactions liées aux traumas.',
    'Emotional holder': 'Porte des émotions spécifiques (tristesse, colère, honte...) pour que les autres alters puissent fonctionner sans être submergés.',
    'Pain holder': 'Porte la douleur physique ou émotionnelle. Peut ressentir plus de douleur que les autres mais les protège ainsi.',
    'Fear holder': 'Spécialisé dans le port de la peur et de l\'anxiété. Permet aux autres alters de fonctionner sans être paralysés par la peur.',
    'Memory holder': 'Garde des souvenirs spécifiques, pas forcément traumatiques. Peut être le seul à se souvenir de certains événements.',
    'Fragment': 'Un alter très limité, souvent créé pour une fonction ou un souvenir très spécifique. Peut n\'avoir qu\'une personnalité partielle.',
    // Sociaux & Créatifs
    'Social alter': 'Spécialisé dans les interactions sociales. Gère les conversations, les relations, et peut être très à l\'aise en société.',
    'Mask': 'Alter créé pour "faire semblant que tout va bien". Permet au système de fonctionner socialement même quand ça ne va pas.',
    'Entertainer': 'Apporte humour, joie et divertissement. Peut alléger l\'atmosphère et aider le système à se détendre.',
    'Animateur/trice': 'Anime les situations, apporte de l\'énergie positive. Aime divertir et faire rire les autres.',
    'Artist': 'Alter créatif, s\'exprime à travers l\'art (dessin, peinture, écriture, musique...). La création peut être un exutoire important.',
    'Artiste': 'Alter créatif, s\'exprime à travers l\'art (dessin, peinture, écriture, musique...). La création peut être un exutoire important.',
    'Communicator': 'Gère la communication interne et externe. Peut exprimer ce que les autres alters n\'arrivent pas à dire.',
    'Communicateur/trice': 'Gère la communication interne et externe. Peut exprimer ce que les autres alters n\'arrivent pas à dire.',
    'Performer': 'S\'exprime à travers la performance : danse, musique, théâtre, sport. Aime être sur scène ou montrer ses talents.',
    // Spécialisés
    'Worker': 'Spécialisé dans le travail et la vie professionnelle. Compétent et concentré sur les tâches à accomplir.',
    'Travailleur/se': 'Spécialisé dans le travail et la vie professionnelle. Compétent et concentré sur les tâches à accomplir.',
    'Student': 'Se concentre sur les études et l\'apprentissage. Aime apprendre de nouvelles choses.',
    'Étudiant(e)': 'Se concentre sur les études et l\'apprentissage. Aime apprendre de nouvelles choses.',
    'Sexual alter': 'Gère la sexualité et l\'intimité du système. Peut aussi être un mécanisme de protection suite à des traumas sexuels.',
    'Romantic': 'Gère les relations affectives et romantiques. Ressent et exprime l\'amour et l\'attachement.',
    'Romantique': 'Gère les relations affectives et romantiques. Ressent et exprime l\'amour et l\'attachement.',
    'Spiritual': 'Connecté à la spiritualité, la religion ou les croyances du système. Peut apporter sens et guidance.',
    'Spirituel/le': 'Connecté à la spiritualité, la religion ou les croyances du système. Peut apporter sens et guidance.',
    'Somatic': 'Particulièrement connecté au corps et aux sensations physiques. Peut être le seul à ressentir certaines sensations.',
    // Types particuliers
    'Fictive': 'Alter basé sur un personnage fictif (de film, livre, jeu vidéo, série...). A l\'apparence et parfois la personnalité du personnage.',
    'Factive': 'Alter basé sur une personne réelle célèbre ou publique. N\'est pas cette personne mais en a des caractéristiques.',
    'Introject': 'Alter basé sur une personne réelle connue personnellement (famille, ami, agresseur...). Créé pour diverses raisons.',
    'Non-human': 'Alter qui ne s\'identifie pas comme humain : animal, créature mythique, robot, entité abstraite...',
    'Therian': 'S\'identifie spécifiquement comme un animal ou une créature. Peut avoir des instincts ou comportements liés à cet animal.',
    'Object': 'Alter qui s\'identifie comme un objet (peluche, outil, etc.). Plus rare mais valide.',
    'Objet': 'Alter qui s\'identifie comme un objet (peluche, outil, etc.). Plus rare mais valide.',
    'Subsystem': 'Un système dans le système. Le subsystem contient lui-même plusieurs alters interconnectés.',
    'Shell': 'Alter avec une présence minimale, parfois "vide". Peut être utilisé pour masquer que quelqu\'un est front.',
    // États du front
    'Fronting': 'L\'alter qui contrôle actuellement le corps. Peut changer fréquemment ou rester stable longtemps.',
    'Co-front': 'Situation où plusieurs alters sont présents au front simultanément, partageant le contrôle à des degrés divers.',
    'Observer': 'Alter qui observe ce qui se passe sans prendre le contrôle. Peut être conscient de l\'extérieur sans pouvoir agir.',
    'Dormant': 'Alter actuellement inactif, parfois depuis longtemps. Peut se "réveiller" plus tard.',
    'Unknown': 'Pour les alters dont le rôle n\'est pas encore connu ou défini. Parfaitement valide !'
};

const getRoleDefinition = (role: string) => {
    const key = role.toLowerCase().trim();
    // Try exact match (case insensitive)
    const exactMatch = Object.keys(ROLE_DEFINITIONS).find(k => k.toLowerCase() === key);
    if (exactMatch) return ROLE_DEFINITIONS[exactMatch];

    // Try partial match
    const partialMatch = Object.keys(ROLE_DEFINITIONS).find(k => key.includes(k.toLowerCase()) || k.toLowerCase().includes(key));
    if (partialMatch) return ROLE_DEFINITIONS[partialMatch];

    return "Définition non disponible pour ce rôle spécifique.";
};

const getGridSize = (width: number) => (width - 4) / 3;

export default function ProfileScreen() {
    const { currentAlter, system, user } = useAuth();
    const { unreadCount } = useNotificationContext();
    const { width } = useWindowDimensions();
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
    const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Feed View State
    const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const flatListRef = React.useRef<FlatList>(null);

    const themeColors = currentAlter?.equipped_items?.theme ? getThemeColors(currentAlter.equipped_items.theme) : null;

    useEffect(() => {
        if (currentAlter && user) {
            loadProfileData();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAlter?.id, user?.uid]);

    const loadProfileData = async () => {
        setLoading(true);
        await Promise.all([fetchPosts(), fetchFollowStats()]);
        setLoading(false);
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchPosts(), fetchFollowStats()]);
        setRefreshing(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAlter?.id, user?.uid]);

    const fetchPosts = async () => {
        if (!currentAlter || !user) return;

        try {
            const q = query(
                collection(db, 'posts'),
                where('system_id', '==', user.uid),
                where('alter_id', '==', currentAlter.id),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const data: Post[] = [];

            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Post);
            });

            setPosts(data);
            setStats(prev => ({ ...prev, posts: data.length }));
        } catch (error) {
            console.error('Error fetching profile posts:', error);
        }
    };

    // Charger les compteurs followers/following depuis le profil public
    // Note: Si le profil n'existe pas encore, on le crée d'abord
    const fetchFollowStats = async () => {
        if (!user) return;

        try {
            // D'abord essayer de récupérer le profil
            let profile = await FollowService.getPublicProfile(user.uid);

            // Si pas de profil, créer un profil par défaut
            if (!profile) {
                await FollowService.createOrUpdatePublicProfile(user.uid, {
                    display_name: system?.username || 'Système',
                    is_public: false, // Privé par défaut
                });
                // Récupérer le profil nouvellement créé
                profile = await FollowService.getPublicProfile(user.uid);
            }

            if (profile) {
                setStats(prev => ({
                    ...prev,
                    followers: profile!.follower_count || 0,
                    following: profile!.following_count || 0,
                }));
            }
        } catch (error: any) {
            // Gérer silencieusement les erreurs de permission en mode développement
            // Ces erreurs peuvent survenir si le profil n'existe pas encore
            if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {

                try {
                    await FollowService.createOrUpdatePublicProfile(user.uid, {
                        display_name: system?.username || 'Système',
                        is_public: false,
                    });
                    // Réessayer
                    const newProfile = await FollowService.getPublicProfile(user.uid);
                    if (newProfile) {
                        setStats(prev => ({
                            ...prev,
                            followers: newProfile.follower_count || 0,
                            following: newProfile.following_count || 0,
                        }));
                    }
                } catch (createError) {

                }
            } else {
                console.error('Error fetching follow stats:', error);
            }
        }
    };

    const handleLike = async (postId: string) => {
        if (!user) return;
        try {
            // Optimistic update
            setPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    const likes = post.likes || [];
                    const isLiked = likes.includes(user.uid);
                    return {
                        ...post,
                        likes: isLiked ? likes.filter(id => id !== user.uid) : [...likes, user.uid]
                    };
                }
                return post;
            }));
            triggerHaptic.selection();
            await PostService.toggleLike(postId, user.uid);
        } catch (error) {
            console.error('Like failed', error);
            // Revert optimistic update
            setPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    const likes = post.likes || [];
                    const isLiked = likes.includes(user.uid);
                    // Reversing the logic: if we "liked" it and it failed, we remove our ID. If we unliked, we add it back.
                    // Wait, the prev state above WAS the optimistic update.
                    // But here we are in catch block, so 'prev' inside setPosts might be the optimistic state or newer.
                    // To revert, we toggle again.
                    return {
                        ...post,
                        likes: isLiked ? likes.filter(id => id !== user.uid) : [...likes, user.uid]
                    };
                }
                return post;
            }));
            triggerHaptic.error();
        }
    };

    const handleComment = (postId: string) => {
        setSelectedPostId(postId);
        setCommentsModalVisible(true);
    };

    const handleCloseModal = () => {
        setSelectedPostIndex(null);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <SkeletonProfile />
            </SafeAreaView>
        );
    }

    if (!currentAlter) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <EmptyState
                    icon="person-outline"
                    title="Aucun alter sélectionné"
                    message="Sélectionnez un alter depuis le tableau de bord pour voir son profil."
                    actionLabel="Voir les alters"
                    onAction={() => router.push('/(tabs)/dashboard')}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Header - Instagram Style */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.username}>@{currentAlter.name.toLowerCase().replace(/\s/g, '_')}</Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                            <Ionicons name="search-outline" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')}>
                            <View>
                                <Ionicons name="notifications-outline" size={24} color={colors.text} />
                                {unreadCount > 0 && (
                                    <View style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        backgroundColor: 'red',
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        borderWidth: 1,
                                        borderColor: colors.background,
                                    }} />
                                )}
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/settings/index' as any)}>
                            <Ionicons name="settings-outline" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push(`/alter/${currentAlter.id}`)}>
                            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Section - Design Canva #4 */}
                <View style={styles.profileSection}>
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: currentAlter.color }]}>
                        {currentAlter.avatar_url ? (
                            <Image
                                source={{ uri: currentAlter.avatar_url }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarText}>
                                {currentAlter.name.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>

                    {/* Stats Row - Instagram style: Posts, Followers, Following */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.posts}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.followers}</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.following}</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>
                </View>

                {/* Bio Section */}
                <View style={styles.bioSection}>
                    <Text style={styles.name}>{currentAlter.name}</Text>
                    {currentAlter.pronouns && (
                        <Text style={styles.pronouns}>{currentAlter.pronouns}</Text>
                    )}

                    { /* Role Display avec définitions individuelles */}
                    {(() => {
                        const roleField = currentAlter.custom_fields?.find(f => f.label.toLowerCase() === 'role');
                        if (!roleField) return null;

                        const individualRoles = roleField.value.split(',').map(r => r.trim()).filter(r => r.length > 0);
                        if (individualRoles.length === 0) return null;

                        return (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
                                <Text style={[styles.bio, { marginTop: 0, fontSize: 14, color: colors.textSecondary }]}>+</Text>
                                {individualRoles.map((role, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        }}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            Alert.alert(role, getRoleDefinition(role));
                                        }}
                                    >
                                        <Ionicons name="information-circle" size={18} color={themeColors?.primary || colors.primary} />
                                        <Text style={[styles.bio, { marginTop: 0, color: colors.text, fontSize: 14 }]}>
                                            {role}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        );
                    })()}

                    {/* Bio */}
                    {currentAlter.bio && (
                        <Text style={styles.bio}>{currentAlter.bio}</Text>
                    )}

                    {/* Dates Display */}
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                        {currentAlter.birthDate && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                <Text style={[styles.bio, { marginTop: 0, fontSize: 12, color: colors.textSecondary }]}>
                                    Né(e) le {new Date(currentAlter.birthDate).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                        {currentAlter.arrivalDate && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="airplane-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                <Text style={[styles.bio, { marginTop: 0, fontSize: 12, color: colors.textSecondary }]}>
                                    Arrivé(e) le {new Date(currentAlter.arrivalDate).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <AnimatedPressable
                        style={styles.editButton}
                        onPress={() => router.push(`/alter/${currentAlter.id}`)}
                    >
                        <Ionicons name="pencil" size={16} color={colors.text} style={{ marginRight: 6 }} />
                        <Text style={styles.editButtonText}>Modifier le profil</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                        style={styles.statsButton}
                        onPress={() => router.push('/history')}
                    >
                        <Ionicons name="bar-chart-outline" size={20} color={colors.text} />
                    </AnimatedPressable>
                </View>

                {/* Tabs: Grid / List */}
                <View style={[
                    styles.tabsRow,
                    {
                        marginTop: 40, // Increased spacing as requested
                        borderTopColor: themeColors?.primary || colors.border,
                        borderTopWidth: 2
                    }
                ]}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'grid' && { borderBottomColor: themeColors?.primary || colors.text }
                        ]}
                        onPress={() => setActiveTab('grid')}
                    >
                        <Ionicons
                            name="grid-outline"
                            size={22}
                            color={activeTab === 'grid' ? (themeColors?.primary || colors.text) : (themeColors?.textSecondary || colors.textMuted)}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'list' && { borderBottomColor: themeColors?.primary || colors.text }
                        ]}
                        onPress={() => setActiveTab('list')}
                    >
                        <Ionicons
                            name="list-outline"
                            size={22}
                            color={activeTab === 'list' ? (themeColors?.primary || colors.text) : (themeColors?.textSecondary || colors.textMuted)}
                        />
                    </TouchableOpacity>
                </View>

                {/* Posts Grid - Instagram Style */}
                <View style={styles.postsGrid}>
                    {posts.length === 0 ? (
                        <EmptyState
                            icon="camera-outline"
                            title="Aucune publication"
                            message="Partagez votre première photo ou pensée !"
                            actionLabel="Créer une publication"
                            onAction={() => router.push('/post/create')}
                            style={{ padding: spacing.xxl, width: '100%' }}
                        />
                    ) : (
                        posts.map((post, index) => {
                            // Video detection logic: Assume video if it's NOT a standard image extension
                            // This catch-all logic helps if the URL doesn't look like a standard video file
                            const mediaUrlLower = post.media_url?.toLowerCase() || '';
                            const isImage = mediaUrlLower.includes('.jpg') ||
                                mediaUrlLower.includes('.jpeg') ||
                                mediaUrlLower.includes('.png') ||
                                mediaUrlLower.includes('.webp') ||
                                mediaUrlLower.includes('.heic') ||
                                mediaUrlLower.includes('.gif');

                            // If it has a URL but it's not a known image type, treat as video
                            const isVideo = !isImage;

                            return (
                                <AnimatedPressable
                                    key={post.id}
                                    style={styles.gridItem}
                                    scaleMin={0.98}
                                    onPress={() => {
                                        triggerHaptic.selection();
                                        setSelectedPostIndex(index);
                                    }}
                                >
                                    {post.media_url ? (
                                        isVideo ? (
                                            <VideoThumbnail
                                                mediaUrl={post.media_url}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        ) : (
                                            <Image
                                                source={{ uri: post.media_url }}
                                                style={styles.gridImage}
                                                resizeMode="cover"
                                            />
                                        )
                                    ) : (
                                        <View style={styles.gridItemContent}>
                                            <Text style={styles.gridItemText} numberOfLines={3}>
                                                {post.content}
                                            </Text>
                                        </View>
                                    )}
                                </AnimatedPressable>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Post Detail Modal */}
            <Modal
                visible={selectedPostIndex !== null}
                animationType="slide"
                onRequestClose={handleCloseModal}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleCloseModal}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Publications</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {selectedPostIndex !== null && (
                        <FlatList
                            ref={flatListRef}
                            data={posts}
                            renderItem={({ item }) => (
                                <PostCard
                                    post={item}
                                    onLike={handleLike}
                                    onComment={handleComment}
                                    onAuthorPress={() => { }} // Already on profile
                                    currentUserId={user?.uid}
                                />
                            )}
                            keyExtractor={item => item.id}
                            initialScrollIndex={selectedPostIndex}
                            onScrollToIndexFailed={info => {
                                const wait = new Promise(resolve => setTimeout(resolve, 500));
                                wait.then(() => {
                                    flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                                });
                            }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </SafeAreaView>
            </Modal>

            {/* Comments Modal */}
            <CommentsModal
                visible={commentsModalVisible}
                postId={selectedPostId}
                onClose={() => {
                    setCommentsModalVisible(false);
                    setSelectedPostId(null);
                }}
                themeColors={themeColors}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    username: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.lg,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    statsRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        ...typography.h3,
        color: colors.text,
        fontWeight: 'bold',
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    bioSection: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    name: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    pronouns: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: 2,
    },
    bio: {
        ...typography.body,
        color: colors.text,
        marginTop: spacing.xs,
        lineHeight: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.backgroundCard,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButtonText: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.text,
    },
    statsButton: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    tabButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: colors.text,
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '33.33%',
        aspectRatio: 1,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridItemContent: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.sm,
    },
    gridItemText: {
        ...typography.caption,
        color: colors.text,
        textAlign: 'center',
    },
    noPostsContainer: {
        width: '100%',
        padding: spacing.xxl,
        alignItems: 'center',
    },
    noPosts: {
        ...typography.bodySmall,
        color: colors.textMuted,
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    createPostButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    createPostText: {
        color: 'white',
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        ...typography.h3,
        color: colors.text,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    roleText: {
        ...typography.caption,
        color: colors.primaryLight,
        fontWeight: '600',
    },
});
