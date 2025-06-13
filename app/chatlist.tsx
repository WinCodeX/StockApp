// unchanged imports
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadUserId = async () => {
      const id = await SecureStore.getItemAsync('user_id');
      if (id) setCurrentUserId(id);
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
      const fallbackTimestamp = new Date().toISOString();
      const fixedMsg = {
        ...msg,
        created_at: msg.created_at || fallbackTimestamp,
      };

      setMessages((prev) => [...prev, fixedMsg]);
      setNewMessage('');
      // Scroll to bottom after sending message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
    if (!item) return null;

    const isMe = String(item.user_id) === String(currentUserId);
    const timestamp = item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <View style={styles.messageContainer}>
        <View style={[
          styles.messageBubble, 
          isMe ? styles.myMessage : styles.otherMessage
        ]}>
          <Text style={styles.messageText}>{item.body || '...'}</Text>
          <Text style={[
            styles.timestamp, 
            isMe ? styles.myTimestamp : styles.otherTimestamp
          ]}>
            {timestamp}
          </Text>
        </View>
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

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={Array.isArray(messages) ? messages : []}
              renderItem={renderItem}
              keyExtractor={(item) => `${item.id}-${item.created_at}`}
              contentContainerStyle={styles.messagesContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                // Auto scroll to bottom when new messages arrive
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
            />

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
                  multiline
                  maxLength={1000}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
    minWidth: 60,
  },
  myMessage: {
    backgroundColor: '#25d366',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
    marginLeft: '20%',
  },
  otherMessage: {
    backgroundColor: '#2a2a3d',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
    marginRight: '20%',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  myTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#bbb',
    textAlign: 'left',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    backgroundColor: '#1A1A1D',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2a2a3d',
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 0,
    maxHeight: 100,
  },
  icon: {
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#bd93f9',
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
});

export default ConversationScreen;