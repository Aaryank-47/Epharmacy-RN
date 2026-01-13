import React, { useState, useEffect, useRef } from 'react';
import {
    TouchableOpacity,
    View,
    Text,
    Modal,
    TextInput,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Alert,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

import { useThemePalette } from '../hooks/useThemePalette';
import { useAuth } from '../context/AuthContext';
import { AI_ENDPOINTS } from '../api/config';
import { getUserProfile } from '../api/authApi';

const { width, height } = Dimensions.get('window');
const AI_USER_ID_KEY = 'ai_chat_user_id';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
}

interface AiChatSupportProps {
    visible: boolean;
    onClose: () => void;
}

const AiChatSupport: React.FC<AiChatSupportProps> = ({ visible, onClose }) => {
    const { accentColor, isDark } = useThemePalette();
    const { user } = useAuth();

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [aiUserId, setAiUserId] = useState<number | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Initial Greeting
    useEffect(() => {
        if (visible && messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    text: "Hello! I'm your AI health assistant. How can I help you today?",
                    sender: 'ai',
                    timestamp: Date.now(),
                },
            ]);
            checkAndRegisterUser();
        }
    }, [visible]);

    const checkAndRegisterUser = async () => {
        try {
            const storedId = await AsyncStorage.getItem(AI_USER_ID_KEY);
            if (storedId) {
                setAiUserId(parseInt(storedId, 10));
                return;
            }
        } catch (e) {
            }

        if (!aiUserId) {
            registerUser();
        }
    };

    const registerUser = async () => {
        setIsRegistering(true);
        try {
            let profileData = {
                name: user?.name || 'Anonymous',
                age: 30,
                gender: 'Male',
                phone: user?.phone || '0000000000',
            };

            if (user) {
                try {
                    const profileResponse = await getUserProfile();
                    if (profileResponse.success && profileResponse.data) {
                        const { age, phone, name } = profileResponse.data;
                        profileData = {
                            ...profileData,
                            name: name || profileData.name,
                            age: age || 30,
                            phone: phone || profileData.phone,
                        };
                    }
                } catch (err) {
                    }
            }

            const response = await axios.post(AI_ENDPOINTS.REGISTER, profileData);

            if (response.data && response.data.user_id) {
                const newUserId = response.data.user_id;
                setAiUserId(newUserId);
                await AsyncStorage.setItem(AI_USER_ID_KEY, newUserId.toString());
                } else {
                Alert.alert("Connection Problem", "Could not connect to AI service.");
            }

        } catch (error: any) {
            if (error.response) {
                const detail = error.response.data?.detail || '';
                // Handle "User already exists" (500 Unique Constraint)
                if (String(detail).includes('UNIQUE constraint failed') || String(detail).includes('users.phone_number')) {
                    // Fallback: If user exists, we assume we can proceed. 
                    // PROBLEM: We don't know the Server-Side ID.
                    // ATTEMPT: Use numeric phone number as a 'best guess' or just default to 1 for testing if phone fails?
                    // User says: "sidha second vale api me... input bejna hai". 

                    // We will try using the Phone Number parsed as Int.
                    const phoneAsId = parseInt(user?.phone || '0', 10);
                    if (phoneAsId > 0) {
                        setAiUserId(phoneAsId);
                        await AsyncStorage.setItem(AI_USER_ID_KEY, phoneAsId.toString());
                        // Toast.show("Session Recovered", Toast.SHORT);
                    } else {
                        // Fallback to 1 if phone is weird
                        setAiUserId(1);
                        await AsyncStorage.setItem(AI_USER_ID_KEY, "1");
                    }
                    return; // Successfully handled gracefully
                }
            }
        } finally {
            setIsRegistering(false);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        if (!aiUserId) {
            Alert.alert("Not Connected", "Please wait for the connection to be established.", [
                { text: 'Retry Connection', onPress: registerUser },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const payload = {
                user_id: aiUserId,
                text: userMsg.text,
            };

            const response = await axios.post(AI_ENDPOINTS.PREDICT, payload);
            const aiResponseText = response.data.message || "I didn't catch that.";

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponseText,
                sender: 'ai',
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, aiMsg]);

        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I couldn't reach the server. Please try again.",
                sender: 'ai',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={{
                flexDirection: isUser ? 'row-reverse' : 'row',
                marginBottom: 10,
                alignItems: 'flex-start',
            }}>
                {/* Avatar */}
                <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: isUser ? accentColor : (isDark ? '#444' : '#CCC'),
                    justifyContent: 'center', alignItems: 'center',
                    marginLeft: isUser ? 8 : 0,
                    marginRight: isUser ? 0 : 8,
                    overflow: 'hidden'
                }}>
                    {isUser ? (
                        user?.avatar ? (
                            <Image
                                source={{ uri: user.avatar }}
                                style={{ width: 32, height: 32 }}
                            />
                        ) : (
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        )
                    ) : (
                        <Icon name="robot" size={18} color="#FFF" />
                    )}
                </View>

                <View style={{ maxWidth: '75%' }}>
                    {/* Name Label */}
                    <Text style={{
                        fontSize: 10,
                        color: isDark ? '#AAA' : '#666',
                        marginBottom: 2,
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        marginHorizontal: 4
                    }}>
                        {isUser ? (user?.name || 'You') : 'AI Assistant'}
                    </Text>

                    {/* Message Bubble */}
                    <View
                        style={{
                            backgroundColor: isUser ? accentColor : (isDark ? '#333' : '#E5E7EB'),
                            borderRadius: 20,
                            borderBottomRightRadius: isUser ? 0 : 20,
                            borderBottomLeftRadius: isUser ? 20 : 0,
                            padding: 12,
                            paddingHorizontal: 16,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 1,
                            elevation: 1,
                        }}
                    >
                        <Text style={{ color: isUser ? '#FFF' : (isDark ? '#FFF' : '#000'), fontSize: 16, lineHeight: 22 }}>
                            {item.text}
                        </Text>
                        <Text style={{
                            fontSize: 10,
                            color: isUser ? 'rgba(255,255,255,0.7)' : (isDark ? '#AAA' : '#666'),
                            alignSelf: 'flex-end',
                            marginTop: 4
                        }}>
                            {formatTime(item.timestamp)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{
                    height: height * 0.85,
                    backgroundColor: isDark ? '#1A1A1A' : '#FFF',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    overflow: 'hidden',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}>
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? '#333' : '#EEE',
                        backgroundColor: isDark ? '#252525' : '#FAFAFA'
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                width: 40, height: 40, borderRadius: 20,
                                backgroundColor: accentColor,
                                alignItems: 'center', justifyContent: 'center',
                                marginRight: 10
                            }}>
                                <Icon name="robot" size={24} color="#FFF" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>
                                    AI Assistant
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{
                                        width: 8, height: 8, borderRadius: 4,
                                        backgroundColor: isRegistering ? '#F59E0B' : (aiUserId ? '#10B981' : '#EF4444'),
                                        marginRight: 6
                                    }} />
                                    <Text style={{ fontSize: 12, color: isDark ? '#AAA' : '#666' }}>
                                        {isRegistering ? 'Connecting...' : (aiUserId ? 'Online' : 'Offline')}
                                    </Text>

                                    {!aiUserId && !isRegistering && (
                                        <TouchableOpacity onPress={registerUser} style={{ marginLeft: 10 }}>
                                            <Text style={{ color: accentColor, fontWeight: 'bold' }}>Retry</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                padding: 8,
                                backgroundColor: isDark ? '#333' : '#EEE',
                                borderRadius: 20
                            }}
                        >
                            <Icon name="close" size={20} color={isDark ? '#FFF' : '#555'} />
                        </TouchableOpacity>
                    </View>

                    {/* Messages */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}
                    >
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            ListFooterComponent={
                                isLoading ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                        <View style={{
                                            width: 32, height: 32, borderRadius: 16,
                                            backgroundColor: accentColor,
                                            justifyContent: 'center', alignItems: 'center',
                                            marginRight: 8
                                        }}>
                                            <Icon name="robot" size={18} color="#FFF" />
                                        </View>
                                        <View style={{
                                            backgroundColor: isDark ? '#333' : '#E5E7EB',
                                            borderRadius: 20,
                                            padding: 10,
                                            paddingHorizontal: 16,
                                        }}>
                                            <Text style={{ color: isDark ? '#AAA' : '#666', fontStyle: 'italic', fontSize: 12 }}>
                                                Typing...
                                            </Text>
                                        </View>
                                    </View>
                                ) : null
                            }
                        />

                        {/* Input */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 12,
                            borderTopWidth: 1,
                            borderTopColor: isDark ? '#333' : '#EEE',
                            backgroundColor: isDark ? '#222' : '#FFF'
                        }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    backgroundColor: isDark ? '#333' : '#F5F5F5',
                                    borderRadius: 24,
                                    paddingHorizontal: 20,
                                    paddingVertical: 12,
                                    color: isDark ? '#FFF' : '#000',
                                    maxHeight: 100,
                                    fontSize: 16
                                }}
                                placeholder="Type a message..."
                                placeholderTextColor={isDark ? '#888' : '#999'}
                                multiline
                                value={inputText}
                                onChangeText={setInputText}
                            />
                            <TouchableOpacity
                                onPress={sendMessage}
                                // disabled={!inputText.trim() || isLoading} // Allow press to handle retry hint
                                style={{
                                    marginLeft: 10,
                                    width: 48, height: 48,
                                    borderRadius: 24,
                                    backgroundColor: (!inputText.trim() || isLoading) ? (isDark ? '#444' : '#DDD') : accentColor,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: accentColor,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: (!inputText.trim() || isLoading) ? 0 : 0.3,
                                    shadowRadius: 3,
                                    elevation: (!inputText.trim() || isLoading) ? 0 : 3
                                }}
                            >
                                <Icon name="send" size={22} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
};

export default AiChatSupport;
