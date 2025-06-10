import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getConversations } from '../lib/helpers/getConversations';
import colors from '../theme/colors';

const ChatListScreen = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await getConversations();
      setConversations(data);
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

  const handleConversationPress = (conversationId: number) => {
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
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary || '#bd93f9'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversations</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#bd93f9'} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* 🟣 FAB to start new chat */}
      <TouchableOpacity
        style={styles.newConversationButton}
        onPress={() => router.push('/chat')}
      >
        <MaterialCommunityIcons name="message-plus" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#1a1a1a',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: colors.background || '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#333',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary || '#bd93f9',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: colors.text || '#fff',
  },
  errorText: {
    color: '#ff6b6b',
    padding: 16,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: colors.cardBackground || '#2a2a3d',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  conversationDetails: {
    flex: 1,
    marginRight: 12,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text || '#fff',
    marginBottom: 4,
  },
  lastMessage: {
    color: colors.textSecondary || '#bbb',
    fontSize: 14,
  },
  timestamp: {
    color: colors.textMuted || '#999',
    fontSize: 12,
    alignSelf: 'center',
  },
  newConversationButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: colors.primary || '#bd93f9',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default ChatListScreen;