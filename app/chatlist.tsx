import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getConversations } from '../lib/helpers/getConversations'; // Assume this function handles fetching the conversations from the backend
import Colors from '../theme/colors';

const ChatListScreen = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch conversations on initial load
    fetchConversations();
  }, []);
  
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await getConversations();
      setConversations(data); // Set the conversations list in state
    } catch (err) {
      setError('Failed to load conversations');
      Toast.show({
        type: 'errorToast',
        text1: 'Error loading conversations',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConversationPress = (conversationId) => {
    router.push(`/conversations/${conversationId}`);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item.id)}
    >
      <View style={styles.conversationDetails}>
        <Text style={styles.conversationName}>{item.recipient.name}</Text>
        <Text style={styles.lastMessage}>
          {item.lastMessage?.content || 'No messages yet'}
        </Text>
      </View>
      <Text style={styles.timestamp}>{item.lastMessage?.createdAt}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Conversations</Text>
      {loading ? (
        <Text>Loading conversations...</Text>
      ) : error ? (
        <Text>{error}</Text>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
      <TouchableOpacity
        style={styles.newConversationButton}
        onPress={() => router.push('/new-conversation')}
      >
        <MaterialCommunityIcons name="message-plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.primary,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  conversationDetails: {
    flex: 1,
  },
  conversationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  lastMessage: {
    color: '#888',
    fontSize: 14,
  },
  timestamp: {
    color: '#bbb',
    fontSize: 12,
    alignSelf: 'center',
  },
  newConversationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});

export default ChatListScreen;