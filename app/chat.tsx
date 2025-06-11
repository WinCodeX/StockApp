import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getMessages } from '../lib/helpers/getMessages';
import { sendMessage } from '../lib/helpers/sendMessage';

const ConversationScreen = () => {
  const router = useRouter();
  const { userId, username, avatarUrl } = useLocalSearchParams<{
    userId: string;
    username: string;
    avatarUrl: string;
  }>();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const typingAnim = new Animated.Value(0);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(userId);
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    if (userId) fetchMessages();
  }, [userId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    setTyping(false);
    try {
      await sendMessage(userId, newMessage);
      setMessages((prev) => [
        ...prev,
        {
          text: newMessage,
          sender: 'me',
          timestamp: new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    setTyping(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(typingAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ).start();
  };

  const renderItem = ({ item }) => (
    <View style={item.sender === 'me' ? styles.myMessage : styles.otherMessage}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#bd93f9" />
        </TouchableOpacity>
        <Image
          source={
            avatarUrl
              ? { uri: avatarUrl.toString() }
              : require('../assets/images/avatar_placeholder.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.headerTitle}>{username}</Text>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={[...messages].reverse()}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.messagesContainer}
        />

        {typing && (
          <Animated.Text
            style={[styles.typingIndicator, { opacity: typingAnim }]}
          >
            Typing...
          </Animated.Text>
        )}

        {/* Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="emoticon-outline" size={24} color="#aaa" />
            <TextInput
              value={newMessage}
              onChangeText={handleTyping}
              placeholder="Message"
              placeholderTextColor="#999"
              style={styles.input}
            />
            <MaterialCommunityIcons name="paperclip" size={24} color="#aaa" style={styles.icon} />
            <MaterialCommunityIcons name="camera" size={24} color="#aaa" style={styles.icon} />
          </View>
          <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
            <MaterialCommunityIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ConversationScreen;