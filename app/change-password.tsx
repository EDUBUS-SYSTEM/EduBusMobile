import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authApi } from '@/lib/auth/auth.api';

export default function ChangePasswordScreen() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        // Validate
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.changePassword(currentPassword, newPassword, confirmPassword);

            if (response.success) {
                Alert.alert('Success', 'Password changed successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
                // Clear form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Error', response.error?.message || 'Failed to change password');
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error?.message || 'An error occurred while changing password';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change password</Text>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Current Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Current password</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                placeholderTextColor="#999"
                                secureTextEntry={!showCurrentPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                <Ionicons
                                    name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* New Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>New password</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                placeholderTextColor="#999"
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                                <Ionicons
                                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Confirm password</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor="#999"
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Change Password Button */}
                    <TouchableOpacity
                        style={[styles.changeButton, loading && styles.changeButtonDisabled]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#333" />
                        ) : (
                            <Text style={styles.changeButtonText}>Change Password</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'RobotoSlab-Bold',
        color: '#333',
    },
    notificationButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: 'RobotoSlab-Regular',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5D6',
        borderRadius: 25,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E8DDB5',
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 14,
        color: '#333',
        letterSpacing: 0,
    },
    eyeButton: {
        padding: 8,
    },
    changeButton: {
        backgroundColor: '#01CBCA',
        borderRadius: 25,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#01CBCA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    changeButtonDisabled: {
        opacity: 0.7,
    },
    changeButtonText: {
        fontSize: 16,
        fontFamily: 'RobotoSlab-Bold',
        color: '#FFFFFF',
    },
});
