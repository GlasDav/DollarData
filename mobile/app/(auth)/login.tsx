import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const handleLogin = async () => {
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (e: any) {
            Alert.alert('Login Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-surface justify-center p-6">
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-primary mb-2">DollarData</Text>
                <Text className="text-text-muted text-base">Your Money, Mastery.</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-text-primary mb-2 font-medium">Email</Text>
                    <TextInput
                        className="bg-card text-text-primary p-4 rounded-xl border border-border"
                        placeholder="john@example.com"
                        placeholderTextColor="#6B7280"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View>
                    <Text className="text-text-primary mb-2 font-medium">Password</Text>
                    <TextInput
                        className="bg-card text-text-primary p-4 rounded-xl border border-border"
                        placeholder="********"
                        placeholderTextColor="#6B7280"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
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
            </View>
        </SafeAreaView>
    );
}
