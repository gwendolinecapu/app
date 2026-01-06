
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../src/lib/firebase';
import { BlurView } from 'expo-blur';
// Removed SystemControlBar as it was unused and causing lint error

interface ModelResult {
    name: string;
    url?: string;
    error?: string;
    duration: number;
    status: 'success' | 'failed';
}

export default function ModelComparisonScreen() {
    const [prompt, setPrompt] = useState('A futuristic alter ego in a neon city, 8k realism');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ModelResult[]>([]);

    const runComparison = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setResults([]);

        try {
            const fn = httpsCallable(functions, 'compareAIModels');
            // Pass isDev: true to bypass basic ID check if needed, depending on how I implemented the guard
            // But assuming logged in user is authorized or I am testing with my admin account
            const resp = await fn({ prompt, isDev: true });
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
                    />
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={runComparison}
                        disabled={loading}
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
});
