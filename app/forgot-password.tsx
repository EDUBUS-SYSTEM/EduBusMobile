import React, { useState, useRef, useEffect } from 'react';
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
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authApi } from '@/lib/auth/auth.api';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordScreen() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Animation values for form card and step numbers
    const formSlideY = useRef(new Animated.Value(0)).current;
    const formOpacity = useRef(new Animated.Value(1)).current;
    const stepScales = useRef([
        new Animated.Value(1.2), // Step 1 - start with first step active
        new Animated.Value(1), // Step 2
        new Animated.Value(1), // Step 3
        new Animated.Value(1), // Step 4
    ]).current;
    const progressHeight = useRef(new Animated.Value(25)).current; // Start at 25% (1/4)
    const previousStep = useRef<Step>('email');

    // Animate form and step numbers when step changes
    useEffect(() => {
        const stepOrder: Step[] = ['email', 'otp', 'password', 'success'];
        const currentIndex = stepOrder.indexOf(step);
        const previousIndex = stepOrder.indexOf(previousStep.current);
        const isMovingForward = currentIndex > previousIndex;

        // Animate progress bar height (0% to 100%)
        // Calculate based on step position: each step is ~25% of total height
        // Step 1 (email): 0%, Step 2 (otp): 33%, Step 3 (password): 66%, Step 4 (success): 100%
        const progressPercentage = (currentIndex / 3) * 100;
        Animated.spring(progressHeight, {
            toValue: progressPercentage,
            useNativeDriver: false,
            tension: 50,
            friction: 8,
        }).start();

        // Animate step numbers - current step gets bigger
        stepScales.forEach((scale, index) => {
            Animated.spring(scale, {
                toValue: index === currentIndex ? 1.2 : 1,
                useNativeDriver: true,
                tension: 200,
                friction: 5,
            }).start();
        });

        // Slide out current content
        Animated.parallel([
            Animated.timing(formSlideY, {
                toValue: isMovingForward ? -50 : 50,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(formOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Reset position for new content
            formSlideY.setValue(isMovingForward ? 50 : -50);
            
            // Slide in new content
            Animated.parallel([
                Animated.spring(formSlideY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 10,
                }),
                Animated.timing(formOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        });

        previousStep.current = step;
    }, [step]);

    // Step 1: Send OTP
    const handleSendOtp = async () => {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.sendOtp(email);
            if (response.success) {
                setStep('otp');
            } else {
                Alert.alert('Error', response.error?.message || 'Failed to send OTP');
            }
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = () => {
        if (!otpCode || otpCode.length < 4) {
            Alert.alert('Error', 'Please enter the OTP code');
            return;
        }
        setStep('password');
    };

    // Step 3: Reset Password
    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.verifyOtpReset(email, otpCode, newPassword, confirmPassword);
            if (response.success) {
                setStep('success');
            } else {
                Alert.alert('Error', response.error?.message || 'Failed to reset password');
            }
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const getStepNumber = () => {
        switch (step) {
            case 'email': return 1;
            case 'otp': return 2;
            case 'password': return 3;
            case 'success': return 4;
        }
    };

    return (
        <LinearGradient
            colors={['#E8F5E9', '#F1F8E9', '#FFFFFF']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#01CBCA" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Reset Password</Text>

                <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{getStepNumber()}/4</Text>
                </View>
            </View>

            {/* Main Content: Vertical Progress + Form Card */}
            <View style={styles.mainContent}>
                {/* Vertical Progress Bar */}
                <View style={styles.verticalProgressContainer}>
                    {/* Progress Line */}
                    <View style={styles.progressLineWrapper}>
                        <View style={styles.progressLineBackground} />
                        <Animated.View
                            style={[
                                styles.progressLineFill,
                                {
                                    height: progressHeight.interpolate({
                                        inputRange: [0, 33.33, 66.66, 100],
                                        outputRange: ['0%', '33.33%', '66.66%', '100%'],
                                    }),
                                }
                            ]}
                        />
                    </View>
                    
                    {/* Step Numbers */}
                    <View style={styles.stepNumbersContainer}>
                        {[1, 2, 3, 4].map((stepNum, index) => {
                            const stepOrder: Step[] = ['email', 'otp', 'password', 'success'];
                            const isActive = step === stepOrder[index];
                            const isCompleted = getStepNumber() > stepNum;
                            
                            return (
                                <Animated.View
                                    key={stepNum}
                                    style={[
                                        styles.stepNumberCircle,
                                        isActive && styles.stepNumberCircleActive,
                                        isCompleted && styles.stepNumberCircleCompleted,
                                        {
                                            transform: [{ scale: stepScales[index] }],
                                        }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.stepNumberText,
                                            isActive && styles.stepNumberTextActive,
                                            isCompleted && styles.stepNumberTextCompleted,
                                        ]}
                                    >
                                        {stepNum}
                                    </Text>
                                </Animated.View>
                            );
                        })}
                    </View>
                </View>

                {/* Form Card */}
                <KeyboardAvoidingView
                    style={styles.formContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            style={[
                                styles.formCard,
                                {
                                    transform: [{ translateY: formSlideY }],
                                    opacity: formOpacity,
                                }
                            ]}
                        >
                        {/* Step: Email */}
                        {step === 'email' && (
                            <>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="mail-outline" size={40} color="#01CBCA" />
                                </View>
                                <Text style={styles.title}>Forgot Password?</Text>
                                <Text style={styles.subtitle}>
                                    Enter your email address and we&apos;ll send you a verification code
                                </Text>

                                <View style={styles.inputContainer}>
                                    <Ionicons name="mail" size={18} color="#01CBCA" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#999"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleSendOtp}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Send OTP</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step: OTP */}
                        {step === 'otp' && (
                            <>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="keypad-outline" size={40} color="#01CBCA" />
                                </View>
                                <Text style={styles.title}>Verify OTP</Text>
                                <Text style={styles.subtitle}>
                                    Enter the 6-digit code sent to{'\n'}{email}
                                </Text>

                                <View style={styles.inputContainer}>
                                    <Ionicons name="keypad" size={18} color="#01CBCA" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, styles.otpInput]}
                                        placeholder="● ● ● ● ● ●"
                                        placeholderTextColor="#999"
                                        value={otpCode}
                                        onChangeText={(text) => setOtpCode(text.replace(/\D/g, ''))}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>

                                <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
                                    <Text style={styles.buttonText}>Verify Code</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.linkButton} onPress={() => setStep('email')}>
                                    <Text style={styles.linkText}>← Change email</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step: Password */}
                        {step === 'password' && (
                            <>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="lock-closed-outline" size={40} color="#01CBCA" />
                                </View>
                                <Text style={styles.title}>New Password</Text>
                                <Text style={styles.subtitle}>
                                    Create a strong password with at least 8 characters
                                </Text>

                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed" size={18} color="#01CBCA" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="New password"
                                        placeholderTextColor="#999"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#999" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed" size={18} color="#01CBCA" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm password"
                                        placeholderTextColor="#999"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#999" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Reset Password</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step: Success */}
                        {step === 'success' && (
                            <>
                                <View style={styles.successIconContainer}>
                                    <Ionicons name="checkmark-circle" size={70} color="#01CBCA" />
                                </View>
                                <Text style={styles.title}>Success! 🎉</Text>
                                <Text style={styles.subtitle}>
                                    Your password has been reset successfully.{'\n'}You can now login with your new password.
                                </Text>

                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => router.replace('/login')}
                                >
                                    <Text style={styles.buttonText}>Back to Login</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: 'transparent',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#01CBCA',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'RobotoSlab-Bold',
        color: '#1A1A1A',
        letterSpacing: 0.5,
    },
    stepBadge: {
        backgroundColor: '#01CBCA',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#01CBCA',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    stepBadgeText: {
        color: '#FFF',
        fontSize: 13,
        fontFamily: 'RobotoSlab-Bold',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
        paddingTop: 20,
    },
    verticalProgressContainer: {
        width: 60,
        alignItems: 'center',
        paddingVertical: 20,
        paddingLeft: 16,
        position: 'relative',
    },
    progressLineWrapper: {
        position: 'absolute',
        left: 20,
        top: 40,
        bottom: 50,
        width: 3,
    },
    progressLineBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
    },
    progressLineFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#01CBCA',
        borderRadius: 2,
        width: '100%',
    },
    stepNumbersContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingTop: 0,
        paddingRight: 20,
        width: '100%',
    },
    stepNumberCircle: {
        width: 30,
        height: 30,
        borderRadius: 20,
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    stepNumberCircleActive: {
        backgroundColor: '#01CBCA',
        borderColor: '#01CBCA',
        shadowColor: '#01CBCA',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    stepNumberCircleCompleted: {
        backgroundColor: '#01CBCA',
        borderColor: '#01CBCA',
    },
    stepNumberText: {
        fontSize: 15,
        fontFamily: 'RobotoSlab-Bold',
        color: '#999',
    },
    stepNumberTextActive: {
        color: '#FFFFFF',
        fontSize: 17,
    },
    stepNumberTextCompleted: {
        color: '#FFFFFF',
    },
    formContainer: {
        flex: 1,
        paddingRight: 30,
        paddingTop: 180,

    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'flex-start',
        paddingHorizontal: 4,
        paddingVertical: 20,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 16,
        shadowColor: '#01CBCA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(1, 203, 202, 0.1)',
        width: '100%',
        maxWidth: '100%',
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 2,
    },
    successIconContainer: {
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 2,
    },
    title: {
        fontSize: 20,
        fontFamily: 'RobotoSlab-Bold',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: 'RobotoSlab-Regular',
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
        paddingHorizontal: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
        paddingVertical: 10,
        letterSpacing: 0,
        fontFamily: 'RobotoSlab-Regular',
    },
    otpInput: {
        letterSpacing: 6,
        textAlign: 'center',
        fontSize: 16,
        fontFamily: 'RobotoSlab-Bold',
    },
    button: {
        backgroundColor: '#01CBCA',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#01CBCA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'RobotoSlab-Bold',
        letterSpacing: 0.3,
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 6,
    },
    linkText: {
        color: '#01CBCA',
        fontSize: 14,
        fontFamily: 'RobotoSlab-Regular',
    },
});
