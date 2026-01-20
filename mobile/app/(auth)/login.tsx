import { useState } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn } = useAuth();

    // Explicitly using type 'any' for error handling is temporary
    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signIn(email, password);
        } catch (e: any) {
            setError(e.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-surface justify-center p-6">
            <View className="flex-1 justify-center max-w-md w-full mx-auto space-y-8">
                <View className="items-center">
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={{ width: 280, height: 70 }}
                        resizeMode="contain"
                    />
                    <Text className="text-muted-foreground mt-2">Your Money, Mastery.</Text>
                </View>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Welcome Back</CardTitle>
                        <CardDescription>Enter your credentials to access your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error ? (
                            <View className="bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                <Text className="text-destructive text-sm text-center font-medium">{error}</Text>
                            </View>
                        ) : null}

                        <View className="space-y-2">
                            <Text className="text-sm font-medium">Email</Text>
                            <Input
                                placeholder="john@example.com"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={(text) => { setEmail(text); setError(''); }}
                            />
                        </View>

                        <View className="space-y-2">
                            <Text className="text-sm font-medium">Password</Text>
                            <Input
                                placeholder="••••••••"
                                secureTextEntry
                                value={password}
                                onChangeText={(text) => { setPassword(text); setError(''); }}
                            />
                        </View>

                        <Button
                            className="mt-2 w-full"
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-primary-foreground font-bold">Sign In</Text>}
                        </Button>
                    </CardContent>
                </Card>

                <View className="flex-row justify-center space-x-1">
                    <Text className="text-muted-foreground">Don't have an account?</Text>
                    <Link href="/(auth)/register" asChild>
                        <Text className="text-primary font-bold">Sign Up</Text>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
