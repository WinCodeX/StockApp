import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getMessages } from '../lib/helpers/getMessages'; // Importing getMessages from your helpers
import { sendMessage } from '../lib/helpers/sendMessage'; // Importing sendMessage from your helpers

const ConversationScreen = ({ route }) => {
  const { chatId } = route.params; // Get the conversation ID from route params
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch messages when the screen is mounted
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(chatId); // Fetch messages for the current chat
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [chatId]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return; // Don't send empty messages

    try {
      await sendMessage(chatId, newMessage); // Send the new message
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: newMessage, sender: 'me', timestamp: new Date().toISOString() },
      ]);
      setNewMessage(''); // Clear the input field
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Render each message in the list
  const renderItem = ({ item }) => (
    <View style={item.sender === 'me' ? styles.myMessage : styles.otherMessage}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        inverted
        style={styles.messagesContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
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
    backgroundColor: '#1A1A1D', // Dracula theme background color
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#50fa7b', // Dracula theme green for sent messages
    padding: 10,
    marginBottom: 10,
    borderRadius: 20,
    maxWidth: '70%',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#44475a', // Dracula theme grey for received messages
    padding: 10,
    marginBottom: 10,
    borderRadius: 20,
    maxWidth: '70%',
  },
  messageText: {
    color: '#fff', // White text
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
    backgroundColor: '#282a36', // Dracula theme background for input area
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    padding: 10,
    marginRight: 10,
    backgroundColor: '#f8f8f2', // Dracula theme input background
    borderColor: '#ccc',
    color: '#000', // Text color inside input
  },
  sendButton: {
    padding: 10,
    backgroundColor: '#50fa7b', // Dracula theme green for send button
    borderRadius: 25,
  },
});

export default ConversationScreen;