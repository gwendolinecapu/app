
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, StyleSheet, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { functions, storage } from '../../src/lib/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface ModelResult {
    name: string;
    url?: string;
    error?: string;
    duration: number;
    status: 'success' | 'failed';
}

export default function ModelComparisonScreen() {
    const [prompt, setPrompt] = useState('A futuristic alter ego in a neon city, 8k realism');
    const [refImages, setRefImages] = useState<string[]>([]);
    const [manualUrl, setManualUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ModelResult[]>([]);

    const addManualUrl = () => {
        if (manualUrl && manualUrl.startsWith('http')) {
            setRefImages(prev => [...prev, manualUrl]);
            setManualUrl('');
        }
    };

    const pickAndUploadImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setUploading(true);
            try {
                const newUrls: string[] = [];
                for (const asset of result.assets) {
                    const response = await fetch(asset.uri);
                    const blob = await response.blob();
                    const filename = asset.fileName || `upload_${Date.now()}.jpg`;
                    const storageRef = ref(storage, `temp/lab/${Date.now()}_${filename}`);
                    await uploadBytes(storageRef, blob);
                    const url = await getDownloadURL(storageRef);
                    newUrls.push(url);
                }
                setRefImages(prev => [...prev, ...newUrls]);
            } catch (e: any) {
                Alert.alert("Upload Failed", e.message);
            } finally {
                setUploading(false);
            }
        }
    };

    const removeImage = (url: string) => {
        setRefImages(prev => prev.filter(u => u !== url));
    };

    const runComparison = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setResults([]);

        try {
            const fn = httpsCallable(functions, 'compareAIModels');
            const payload: any = { prompt, isDev: true };
            if (refImages.length > 0) {
                payload.referenceImageUrls = refImages;
            }
            const resp = await fn(payload);
            const data = resp.data as { results: ModelResult[] };
            setResults(data.results);
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Model Lab', headerTransparent: true, headerBlurEffect: 'dark' }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <Text style={styles.title}>AI Model Comparison</Text>
                    <Text style={styles.subtitle}>Benchmarking Realism & Consistency</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Prompt</Text>
                    <TextInput
                        style={styles.input}
                        multiline
                        value={prompt}
                        onChangeText={setPrompt}
                        placeholderTextColor="#666"
                        placeholder="Describe the image..."
                    />

                    <Text style={[styles.label, { marginTop: 16 }]}>Reference Images (Optional)</Text>

                    {/* Manual Input Fallback */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        <TextInput
                            style={[styles.input, { flex: 1, minHeight: 40, marginBottom: 0 }]}
                            value={manualUrl}
                            onChangeText={setManualUrl}
                            placeholder="Paste URL here..."
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        <TouchableOpacity
                            style={[styles.miniBtn, !manualUrl && styles.buttonDisabled]}
                            onPress={addManualUrl}
                            disabled={!manualUrl}
                        >
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal style={styles.refList} contentContainerStyle={{ gap: 8 }}>
                        {refImages.map((url, idx) => (
                            <View key={idx} style={styles.refImageContainer}>
                                <Image source={{ uri: url }} style={styles.refImageThumbnail} />
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(url)}>
                                    <Ionicons name="close-circle" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addBtn} onPress={pickAndUploadImages} disabled={uploading}>
                            {uploading ? <ActivityIndicator color="#aaa" /> : (
                                <>
                                    <Ionicons name="image" size={24} color="#aaa" />
                                    <Text style={{ color: '#aaa', fontSize: 10, marginTop: 4 }}>Upload</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.button, (loading || uploading) && styles.buttonDisabled]}
                        onPress={runComparison}
                        disabled={loading || uploading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Run Benchmark</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.resultsGrid}>
                    {results.map((res, idx) => (
                        <View key={idx} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.modelName}>{res.name}</Text>
                                <Text style={styles.meta}>{(res.duration / 1000).toFixed(1)}s</Text>
                            </View>

                            {res.status === 'success' && res.url ? (
                                <Image source={{ uri: res.url }} style={styles.image} resizeMode="cover" />
                            ) : (
                                <View style={[styles.image, styles.errorBox]}>
                                    <Text style={styles.errorText}>Failed: {res.error}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingTop: 100,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
    },
    inputContainer: {
        marginBottom: 32,
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    label: {
        color: '#888',
        marginBottom: 8,
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    input: {
        color: '#fff',
        minHeight: 80,
        fontSize: 16,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        marginTop: 24,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resultsGrid: {
        gap: 24,
    },
    card: {
        backgroundColor: '#111',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#222',
    },
    modelName: {
        color: '#fff',
        fontWeight: '600',
    },
    meta: {
        color: '#4CD964',
        fontWeight: 'bold',
    },
    image: {
        width: '100%',
        aspectRatio: 1,
    },
    errorBox: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#300',
    },
    errorText: {
        color: '#ff6b6b',
        padding: 20,
        textAlign: 'center',
    },
    refList: {
        flexDirection: 'row',
        height: 80,
    },
    refImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#333',
        marginRight: 8,
        position: 'relative',
    },
    refImageThumbnail: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
    },
    addBtn: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: '#444',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniBtn: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
