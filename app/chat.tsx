import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { getMessages } from '../lib/helpers/getMessages';
import { sendMessage } from '../lib/helpers/sendMessage';
import { sendTypingStatus } from '../lib/helpers/sendTypingStatus';

const ConversationScreen = () => {
  const router = useRouter();
  const { conversationId, username, avatarUrl } = useLocalSearchParams() as {
    conversationId: string;
    username: string;
    avatarUrl: string;
  };

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadUserId = async () => {
      const id = await SecureStore.getItemAsync('user_id');
      if (id) setCurrentUserId(parseInt(id));
    };
    loadUserId();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(conversationId);
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    if (conversationId) fetchMessages();
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    try {
      const msg = await sendMessage(conversationId, newMessage);
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = async (text: string) => {
    setNewMessage(text);
    try {
      await sendTypingStatus(conversationId);
    } catch (error) {
      console.error('Failed to send typing status:', error);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = currentUserId && item.user_id === currentUserId;
    return (
      <View style={isMe ? styles.myMessage : styles.otherMessage}>
        <Text style={styles.messageText}>{item.body}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
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
              <Text style={styles.headerTitle}>{username || 'User'}</Text>
            </View>

            {/* Chat Messages */}
            <FlatList
              ref={flatListRef}
              data={Array.isArray(messages) ? [...messages].reverse() : []}
              renderItem={renderItem}
              keyExtractor={(item) => item.id?.toString() || `${item.user_id}-${item.created_at}`}
              contentContainerStyle={styles.messagesContainer}
              inverted
              keyboardShouldPersistTaps="handled"
            />

            {/* Input Field */}
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
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1D',
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1D',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#bd93f9',
  },
  messagesContainer: {
    padding: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#25d366',
    padding: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 10,
    maxWidth: '75%',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a3d',
    padding: 10,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 10,
    maxWidth: '75%',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  timestamp: {
    color: '#bbb',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 6,
    backgroundColor: '#1A1A1D',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3d',
    flex: 1,
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingHorizontal: 8,
  },
  icon: {
    marginLeft: 6,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#bd93f9',
    borderRadius: 28,
    padding: 12,
  },
});

export default ConversationScreen;