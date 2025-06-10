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
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getMessages } from '../lib/helpers/getMessages';
import { sendMessage } from '../lib/helpers/sendMessage';

const ConversationScreen = () => {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(chatId);
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [chatId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    try {
      await sendMessage(chatId, newMessage);
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
      {/* Custom Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#bd93f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          data={[...messages].reverse()}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.messagesContainer}
        />

        {/* WhatsApp-style Input */}
        <View style={styles.inputContainer}>
          <View style={styles.textBox}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialCommunityIcons name="emoticon-outline" size={24} color="#bbb" />
            </TouchableOpacity>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Message"
              placeholderTextColor="#bbb"
              style={styles.textInput}
            />
            <TouchableOpacity style={styles.iconButton}>
              <MaterialCommunityIcons name="paperclip" size={22} color="#bbb" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialCommunityIcons name="camera-outline" size={22} color="#bbb" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSendMessage}
            style={styles.sendButton}
            disabled={newMessage.trim() === ''}
          >
            <MaterialCommunityIcons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#1A1A1D',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#bd93f9',
  },
  messagesContainer: {
    padding: 12,
    paddingBottom: 90,
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
    color: '#ccc',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#1A1A1D',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  textBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 6,
    marginHorizontal: 2,
  },
  sendButton: {
    backgroundColor: '#bd93f9',
    padding: 12,
    marginLeft: 6,
    borderRadius: 28,
  },
});

export default ConversationScreen;