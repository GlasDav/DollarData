import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';


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
                        style={{ width: 300, height: 80 }}
                        resizeMode="contain"
                    />
                </View>

                <View className="bg-card p-8 rounded-2xl border border-border items-center">
                    <View className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-6">
                        <Mail size={32} color="#5D5DFF" />
                    </View>

                    <Text className="text-2xl font-bold text-text-primary mb-3 text-center">Check your inbox</Text>

                    <Text className="text-text-secondary text-center mb-8 leading-relaxed">
                        We've sent a verification link to <Text className="font-semibold text-text-primary">{email}</Text>.
                        {'\n\n'}Please click the link in that email to activate your account.
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.replace('/(auth)/login')}
                        className="w-full bg-primary p-4 rounded-xl items-center"
                    >
                        <Text className="text-white font-bold text-lg">Back to Log in</Text>
                    </TouchableOpacity>
                </View>
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
                    <View className="items-center mb-10">
                        <View className="mb-4">
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={{ width: 300, height: 80 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-text-muted text-base">Create your account</Text>
                    </View>

                    <View className="space-y-4">
                        {error ? (
                            <View className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                                <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
                            </View>
                        ) : null}

                        <View>
                            <Text className="text-text-primary mb-2 font-medium">Full Name</Text>
                            <TextInput
                                className="bg-card text-text-primary p-4 rounded-xl border border-border"
                                placeholder="John Doe"
                                placeholderTextColor="#9CA3AF"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View>
                            <Text className="text-text-primary mb-2 font-medium">Email</Text>
                            <TextInput
                                className="bg-card text-text-primary p-4 rounded-xl border border-border"
                                placeholder="name@example.com"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View>
                            <Text className="text-text-primary mb-2 font-medium">Password</Text>
                            <TextInput
                                className="bg-card text-text-primary p-4 rounded-xl border border-border"
                                placeholder="Min 8 chars"
                                placeholderTextColor="#9CA3AF"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={loading}
                            className={`bg-primary p-4 rounded-xl items-center mt-4 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Create Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="mt-8 flex-row justify-center">
                        <Text className="text-text-muted">Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text className="text-primary font-bold">Log In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
