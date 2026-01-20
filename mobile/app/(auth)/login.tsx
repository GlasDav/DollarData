import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn } = useAuth();

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
            <View className="items-center mb-10">
                <View className="mb-4">
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={{ width: 300, height: 80 }}
                        resizeMode="contain"
                    />
                </View>
                <Text className="text-text-muted text-base">Your Money, Mastery.</Text>
            </View>

            <View className="space-y-4">
                {error ? (
                    <View className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                        <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
                    </View>
                ) : null}

                <View>
                    <Text className="text-text-primary mb-2 font-medium">Email</Text>
                    <TextInput
                        className="bg-card text-text-primary p-4 rounded-xl border border-border"
                        placeholder="john@example.com"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={(text) => { setEmail(text); setError(''); }}
                    />
                </View>

                <View>
                    <Text className="text-text-primary mb-2 font-medium">Password</Text>
                    <TextInput
                        className="bg-card text-text-primary p-4 rounded-xl border border-border"
                        placeholder="********"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={password}
                        onChangeText={(text) => { setPassword(text); setError(''); }}
                    />
                </View>

                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    className={`bg-primary p-4 rounded-xl items-center mt-4 ${loading ? 'opacity-70' : ''}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Sign In</Text>
                    )}
                </TouchableOpacity>

                <View className="mt-6 flex-row justify-center">
                    <Text className="text-text-muted">Don't have an account? </Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text className="text-primary font-bold">Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
