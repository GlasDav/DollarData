import { useState } from 'react';
import { View, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';


export default function Register() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [error, setError] = useState('');

    const { signUp } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        setError('');
        if (!email || !password || !name) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password, name);
            setIsSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <SafeAreaView className="flex-1 bg-surface justify-center p-6">
                <View className="items-center mb-8">
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={{ width: 280, height: 70 }}
                        resizeMode="contain"
                    />
                </View>

                <Card className="w-full">
                    <CardContent className="pt-6 items-center">
                        <View className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-6">
                            <Mail size={32} color="#5D5DFF" />
                        </View>

                        <Text variant="h3" className="mb-2 text-center">Check your inbox</Text>

                        <Text className="text-center mb-6 leading-relaxed text-muted-foreground">
                            We've sent a verification link to <Text className="font-semibold text-foreground">{email}</Text>.
                            {'\n\n'}Please click the link in that email to activate your account.
                        </Text>

                        <Button
                            className="w-full"
                            onPress={() => router.replace('/(auth)/login')}
                            label="Back to Log in"
                        />
                    </CardContent>
                </Card>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                    <View className="items-center mb-8">
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={{ width: 280, height: 70 }}
                            resizeMode="contain"
                        />
                        <Text className="text-muted-foreground mt-2">Create your account</Text>
                    </View>

                    <Card className="w-full">
                        <CardContent className="space-y-4 pt-6">
                            {error ? (
                                <View className="bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                    <Text className="text-destructive text-sm text-center font-medium">{error}</Text>
                                </View>
                            ) : null}

                            <View className="space-y-2">
                                <Text className="text-sm font-medium">Full Name</Text>
                                <Input
                                    placeholder="John Doe"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View className="space-y-2">
                                <Text className="text-sm font-medium">Email</Text>
                                <Input
                                    placeholder="name@example.com"
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View className="space-y-2">
                                <Text className="text-sm font-medium">Password</Text>
                                <Input
                                    placeholder="Min 8 chars"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>

                            <Button
                                className="mt-4 w-full"
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="white" /> : <Text className="text-primary-foreground font-bold">Create Account</Text>}
                            </Button>
                        </CardContent>
                    </Card>

                    <View className="mt-8 flex-row justify-center space-x-1">
                        <Text className="text-muted-foreground">Already have an account?</Text>
                        <Link href="/(auth)/login" asChild>
                            <Text className="text-primary font-bold">Log In</Text>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
