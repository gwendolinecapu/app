import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ... (imports remain the same)

export default function TeamChatScreen() {
    const insets = useSafeAreaInsets();
    const { user, alters, activeFront } = useAuth();
// ... (rest of component)
// ...
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
                    <TouchableOpacity
                        style={styles.senderPill}
                        onPress={() => {
                            triggerHaptic.selection();
                            setShowSenderPicker(true);
                        }}
                    >
                        {currentSender?.avatar_url ? (
                            <Image source={{ uri: currentSender.avatar_url }} style={styles.senderPillAvatar} />
                        ) : (
                            <View style={[styles.senderPillAvatarPlaceholder, { backgroundColor: currentSender?.color || colors.primary }]}>
                                <Text style={styles.senderPillInitial}>{currentSender?.name?.charAt(0) || '?'}</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Message..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            maxLength={1000}
                        />
                        {inputText.trim().length > 0 && (
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSendMessage}
                            >
                                <Ionicons name="arrow-up" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Modal
                visible={showSenderPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSenderPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSenderPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Qui parle ?</Text>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher un alter..."
                                placeholderTextColor={colors.textMuted}
                                value={senderSearch}
                                onChangeText={setSenderSearch}
                                autoCapitalize="none"
                            />
                            {senderSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setSenderSearch('')}>
                                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <FlatList
                            data={alters.filter(a => a.name.toLowerCase().includes(senderSearch.toLowerCase()))}
                            keyExtractor={item => item.id}
                            numColumns={4}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.pickerItem,
                                        selectedSenderId === item.id && styles.pickerItemSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedSenderId(item.id);
                                        setShowSenderPicker(false);
                                        setSenderSearch('');
                                        triggerHaptic.selection();
                                    }}
                                >
                                    <View style={[
                                        styles.pickerAvatarContainer,
                                        selectedSenderId === item.id && { borderColor: item.color || colors.primary, borderWidth: 2 }
                                    ]}>
                                        {item.avatar_url ? (
                                            <Image source={{ uri: item.avatar_url }} style={styles.pickerAvatar} />
                                        ) : (
                                            <View style={[styles.pickerPlaceholder, { backgroundColor: item.color || colors.primary }]}>
                                                <Text style={styles.pickerInitial}>{item.name.charAt(0)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.pickerName,
                                        selectedSenderId === item.id && { color: colors.primary, fontWeight: 'bold' }
                                    ]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

    {/* Invite External Alter Modal */ }
    <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
    >
        <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowInviteModal(false)}
        >
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Ajouter des participants</Text>

                {/* Category Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, inviteCategory === 'internal' && styles.tabButtonActive]}
                        onPress={() => { setInviteCategory('internal'); setInviteSearch(''); setSelectedSystemIds(null); }}
                    >
                        <Text style={[styles.tabButtonText, inviteCategory === 'internal' && styles.tabButtonTextActive]}>Mon Système</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, inviteCategory === 'friends' && styles.tabButtonActive]}
                        onPress={() => { setInviteCategory('friends'); setInviteSearch(''); setSelectedSystemIds(null); }}
                    >
                        <Text style={[styles.tabButtonText, inviteCategory === 'friends' && styles.tabButtonTextActive]}>Amis</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, inviteCategory === 'external' && styles.tabButtonActive]}
                        onPress={() => { setInviteCategory('external'); setInviteSearch(''); setSearchResults([]); setSelectedSystemIds(null); }}
                    >
                        <Text style={[styles.tabButtonText, inviteCategory === 'external' && styles.tabButtonTextActive]}>Autre Système</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={inviteCategory === 'external' ? "Rechercher un système..." : "Rechercher un alter..."}
                        placeholderTextColor={colors.textMuted}
                        value={inviteSearch}
                        onChangeText={(text) => {
                            setInviteSearch(text);
                            if (inviteCategory === 'external' && !selectedSystemIds) {
                                searchSystems(text);
                            }
                        }}
                    />
                    {inviteSearch.length > 0 && (
                        <TouchableOpacity onPress={() => { setInviteSearch(''); }}>
                            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {searchLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                ) : (
                    <View style={{ flex: 1, minHeight: 200 }}>
                        {/* INTERNAL & FRIENDS LIST */}
                        {inviteCategory !== 'external' && (
                            <FlatList
                                data={
                                    inviteCategory === 'internal'
                                        ? alters.filter(a => a.id !== currentSender?.id && a.name.toLowerCase().includes(inviteSearch.toLowerCase()))
                                        : friends.filter(a => a.name.toLowerCase().includes(inviteSearch.toLowerCase()))
                                }
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.inviteItem}
                                        onPress={() => inviteAlter(item)}
                                    >
                                        {item.avatar_url ? (
                                            <Image source={{ uri: item.avatar_url }} style={styles.inviteAvatar} />
                                        ) : (
                                            <View style={[styles.invitePlaceholder, { backgroundColor: item.color || colors.primary }]}>
                                                <Text style={styles.inviteInitial}>{item.name.charAt(0)}</Text>
                                            </View>
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inviteName}>{item.name}</Text>
                                            {item.pronouns && <Text style={styles.invitePronouns}>{item.pronouns}</Text>}
                                        </View>
                                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.noResults}>Aucun alter trouvé</Text>
                                }
                            />
                        )}

                        {/* EXTERNAL SYSTEM SEARCH */}
                        {inviteCategory === 'external' && (
                            <>
                                {/* STEP 1: SELECT SYSTEM */}
                                {!selectedSystemIds ? (
                                    <FlatList
                                        data={systemSearchResults}
                                        keyExtractor={item => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.inviteItem}
                                                onPress={() => {
                                                    setSelectedSystemIds(item.id);
                                                    loadSystemAlters(item.id);
                                                }}
                                            >
                                                <View style={[styles.invitePlaceholder, { backgroundColor: colors.secondary }]}>
                                                    <Ionicons name="planet" size={20} color="white" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.inviteName}>{item.username}</Text>
                                                    <Text style={styles.invitePronouns}>Système</Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={
                                            inviteSearch.length > 0 ? (
                                                <Text style={styles.noResults}>Aucun système trouvé</Text>
                                            ) : (
                                                <Text style={styles.noResults}>Cherchez un nom de système pour voir ses alters</Text>
                                            )
                                        }
                                    />
                                ) : (
                                    // STEP 2: SELECT ALTER IN SYSTEM
                                    <View style={{ flex: 1 }}>
                                        <TouchableOpacity
                                            onPress={() => setSelectedSystemIds(null)}
                                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 4 }}
                                        >
                                            <Ionicons name="arrow-back" size={16} color={colors.primary} />
                                            <Text style={{ color: colors.primary, marginLeft: 4 }}>Retour aux systèmes</Text>
                                        </TouchableOpacity>

                                        <FlatList
                                            data={searchResults}
                                            keyExtractor={item => item.id}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.inviteItem}
                                                    onPress={() => inviteAlter(item)}
                                                >
                                                    {item.avatar_url ? (
                                                        <Image source={{ uri: item.avatar_url }} style={styles.inviteAvatar} />
                                                    ) : (
                                                        <View style={[styles.invitePlaceholder, { backgroundColor: item.color || colors.primary }]}>
                                                            <Text style={styles.inviteInitial}>{item.name.charAt(0)}</Text>
                                                        </View>
                                                    )}
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.inviteName}>{item.name}</Text>
                                                    </View>
                                                    <Ionicons name="paper-plane-outline" size={24} color={colors.primary} />
                                                </TouchableOpacity>
                                            )}
                                            ListEmptyComponent={
                                                <Text style={styles.noResults}>Ce système n'a pas d'alters publics</Text>
                                            }
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={{ alignSelf: 'center', marginTop: 16 }}
                    onPress={() => setShowInviteModal(false)}
                >
                    <Text style={{ color: colors.textSecondary }}>Fermer</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.backgroundCard,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text,
    },
    headerSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    headerAction: {
        padding: spacing.sm,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        alignItems: 'flex-end',
    },
    messageRowLeft: {
        justifyContent: 'flex-start',
    },
    messageRowRight: {
        justifyContent: 'flex-end',
    },
    msgAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
        backgroundColor: colors.backgroundLight,
    },
    msgAvatarRight: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginLeft: spacing.sm,
        backgroundColor: colors.backgroundLight,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    messageBubbleLeft: {
        backgroundColor: colors.backgroundCard,
        borderBottomLeftRadius: 2,
    },
    messageBubbleRight: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 2,
    },
    senderName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    messageText: {
        ...typography.body,
        color: 'white',
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        backgroundColor: colors.background, // Clean background
        borderTopWidth: 0,
    },
    senderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.sm,
        marginBottom: 8, // Align with input
        padding: 4,
        borderRadius: 20,
        backgroundColor: colors.backgroundCard,
    },
    senderPillAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    senderPillAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    senderPillInitial: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: 24,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4, // Slimmer look
        minHeight: 44,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        maxHeight: 120,
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '60%',
    },
    modalTitle: {
        ...typography.h3,
        textAlign: 'center',
        marginBottom: spacing.md,
        color: colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        marginBottom: spacing.lg,
        gap: spacing.xs,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        paddingVertical: spacing.xs,
    },
    pickerItem: {
        flex: 1,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    pickerItemSelected: {
        opacity: 1,
    },
    pickerAvatarContainer: {
        marginBottom: spacing.xs,
        borderRadius: 24,
        padding: 2,
    },
    pickerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    pickerPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    pickerName: {
        ...typography.caption,
        textAlign: 'center',
        maxWidth: 60,
    },
    // Invite modal styles
    inviteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.sm,
    },
    inviteAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    invitePlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    inviteName: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    invitePronouns: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    noResults: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    tabButtonActive: {
        backgroundColor: colors.backgroundCard,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    tabButtonText: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    tabButtonTextActive: {
        color: colors.text,
    },
});
