
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AIJob } from '../types';

export function useAIJob(jobId: string | null) {
    const [job, setJob] = useState<AIJob | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) {
            setJob(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsub = onSnapshot(doc(db, 'ai_jobs', jobId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as AIJob;
                setJob(data);

                if (data.status === 'succeeded' || data.status === 'failed') {
                    setLoading(false);
                }

                if (data.status === 'failed' && data.error) {
                    setError(data.error.message);
                }
            } else {
                setLoading(false);
                setError("Job not found");
            }
        }, (err) => {
            console.error("Job subscription error:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsub();
    }, [jobId]);

    return { job, loading, error };
}
