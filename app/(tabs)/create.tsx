import { Redirect } from 'expo-router';

// Placeholder screen - the + button redirects to post/create
export default function CreateScreen() {
    return <Redirect href="/post/create" />;
}
