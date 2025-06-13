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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

import { getMessages } from '../lib/helpers/getMessages';
import { sendMessage } from '../lib/helpers/sendMessage';
import { sendTypingStatus } from '../lib/helpers/sendTypingStatus';

interface Message {
  id: number;
  body: string;
  user_id: number;
  sender_id?: number;
  created_at: string;
  conversation_id: number;
}

const ConversationScreen = () => {
  const router = useRouter();
  const { conversationId, username, avatarUrl } = useLocalSearchParams() as {
    conversationId: string;
    username: string;
    avatarUrl: string;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await SecureStore.getItemAsync('user_id');
        if (id) {
          setCurrentUserId(parseInt(id, 10));
        }
      } catch (error) {
        console.error('Error loading user ID:', error);
      }
    };
    loadUserId();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;

      try {
        setLoading(true);
        const data = await getMessages(conversationId);
        const validMessages = Array.isArray(data) ? data.filter(msg => msg && msg.id) : [];
        const sortedMessages = validMessages.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        Toast.show({
          type: 'errorToast',
          text1: 'Failed to load messages',
          text2: 'Please try again',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, currentUserId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || sending) return;
    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const msg = await sendMessage(conversationId, messageText);
      const fallbackTimestamp = new Date().toISOString();
      const fixedMsg: Message = {
        id: msg.id || Date.now(),
        body: messageText,
        user_id: currentUserId || msg.user_id,
        created_at: msg.created_at || fallbackTimestamp,
        conversation_id: parseInt(conversationId),
        ...msg,
      };
      setMessages((prev) => [...prev, fixedMsg]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
      Toast.show({
        type: 'errorToast',
        text1: 'Failed to send message',
        text2: 'Please try again',
      });
    } finally {
      setSending(false);
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

  const renderItem = ({ item }: { item: Message }) => {
    if (!item || !item.id) return null;
    const messageUserId = item.user_id || item.sender_id;
    const isMe = String(messageUserId) === String(currentUserId);
    const timestamp = item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.otherMessageContainer]}>
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
            {item.body || '...'}
          </Text>
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.otherTimestamp]}>
            {timestamp}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="message-outline" size={64} color="#666" />
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>Start a new chat by pressing the + Button</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#bd93f9" />
              </TouchableOpacity>
              <Image
                source={avatarUrl ? { uri: avatarUrl.toString() } : require('../assets/images/avatar_placeholder.png')}
                style={styles.avatar}
              />
              <Text style={styles.headerTitle} numberOfLines={1}>{username || 'User'}</Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Debug Info', `Current User ID: ${currentUserId}\nMessages Count: ${messages.length}\nConversation ID: ${conversationId}`);
                }}
                style={styles.debugButton}>
                <MaterialCommunityIcons name="information" size={20} color="#bd93f9" />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => `${item.id}-${item.created_at}`}
              contentContainerStyle={[styles.messagesContainer, messages.length === 0 && styles.emptyMessagesContainer]}
              ListEmptyComponent={!loading ? renderEmpty : null}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              onLayout={() => {
                if (messages.length > 0) {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }, 100);
                }
              }}
            />

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TouchableOpacity activeOpacity={0.7}>
                  <MaterialCommunityIcons name="emoticon-outline" size={24} color="#aaa" />
                </TouchableOpacity>
                <TextInput
                  value={newMessage}
                  onChangeText={handleTyping}
                  placeholder="Message"
                  placeholderTextColor="#999"
                  style={styles.input}
                  multiline
                  maxLength={1000}
                  editable={!sending}
                />
                <TouchableOpacity activeOpacity={0.7}>
                  <MaterialCommunityIcons name="paperclip" size={24} color="#aaa" style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7}>
                  <MaterialCommunityIcons name="camera" size={24} color="#aaa" style={styles.icon} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleSendMessage}
                style={[styles.sendButton, (sending || newMessage.trim() === '') && styles.sendButtonDisabled]}
                disabled={sending || newMessage.trim() === ''}
                activeOpacity={0.8}>
                <MaterialCommunityIcons name={sending ? 'loading' : 'send'} size={24} color="#fff" />
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
    padding: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#bd93f9',
    flex: 1,
  },
  debugButton: {
    padding: 4,
    marginLeft: 8,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyMessagesContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
    minWidth: 60,
  },
  myMessage: {
    backgroundColor: '#25d366',
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#2a2a3d',
    borderTopLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#fff',
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
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
});

export default ConversationScreen;