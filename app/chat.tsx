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
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Custom Back Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#bd93f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        inverted
        contentContainerStyle={styles.messagesContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#444"
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <MaterialCommunityIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1A1A1D',
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#bd93f9',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#50fa7b',
    padding: 10,
    marginBottom: 10,
    borderRadius: 20,
    maxWidth: '70%',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#44475a',
    padding: 10,
    marginBottom: 10,
    borderRadius: 20,
    maxWidth: '70%',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  timestamp: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#282a36',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    padding: 10,
    marginRight: 10,
    backgroundColor: '#f8f8f2',
    borderColor: '#ccc',
    color: '#000',
  },
  sendButton: {
    padding: 10,
    backgroundColor: '#50fa7b',
    borderRadius: 25,
  },
});

export default ConversationScreen;