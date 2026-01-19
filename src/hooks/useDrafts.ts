import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useToast } from '../components/ui/Toast'; // Not strictly needed inside hook

export function useDrafts(key: string, initialValue: string = '') {
    const [draft, setDraft] = useState(initialValue);
    const [isLoaded, setIsLoaded] = useState(false);
    // const { showToast } = useToast();

    // Load draft on mount
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const savedDraft = await AsyncStorage.getItem(`draft_${key}`);
                if (savedDraft) {
                    setDraft(savedDraft);
                    // Optional: Notify user a draft was restored
                    // showToast('Brouillon restauré', 'info'); 
                }
            } catch (error) {
                console.error('Failed to load draft:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadDraft();
    }, [key]);

    // Save draft on change (debounced could be better but this is simple for now)
    const saveDraft = useCallback(async (text: string) => {
        setDraft(text);
        try {
            await AsyncStorage.setItem(`draft_${key}`, text);
        } catch (error) {
            console.error('Failed to save draft:', error);
        }
    }, [key]);

    // Clear draft
    const clearDraft = useCallback(async () => {
        setDraft('');
        try {
            await AsyncStorage.removeItem(`draft_${key}`);
        } catch (error) {
            console.error('Failed to clear draft:', error);
        }
    }, [key]);

    return {
        draft,
        setDraft: saveDraft,
        clearDraft,
        isLoaded
    };
}
