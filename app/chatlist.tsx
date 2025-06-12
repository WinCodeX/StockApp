import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import { getConversations } from '../lib/helpers/getConversations';
import colors from '../theme/colors';
import UserSearchModal from '../components/UserSearchModal';
import api from '../lib/api';

const ChatListScreen = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

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

  const handleConversationPress = async (conversationId, username, avatarUrl, otherUserId) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('Authentication token missing');

      const response = await api.post(
        '/api/v1/conversations',
        { receiver_id: otherUserId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const convo = response.data?.data || response.data;

      router.push({
        pathname: '/chat',
        params: {
          conversationId: convo.id.toString(),
          username,
          avatarUrl: avatarUrl || '',
        },
      });
    } catch (error) {
      console.error('Failed to open conversation:', error);
      Toast.show({
        type: 'errorToast',
        text1: 'Failed to open chat',
      });
    }
  };

  const renderItem = ({ item }) => {
    const currentUserId = item.current_user_id;
    const isSender = item.sender?.id === currentUserId;
    const otherUser = isSender ? item.receiver : item.sender;

    const displayName = otherUser?.username || 'Unknown User';
    const avatarUrl = otherUser?.avatar_url || '';
    const otherUserId = otherUser?.id;
    const lastMessage = item.messages?.[0];

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          handleConversationPress(item.id, displayName, avatarUrl, otherUserId)
        }
      >
        <Image
          source={
            avatarUrl
              ? { uri: avatarUrl }
              : require('../assets/images/avatar_placeholder.png')
          }
          style={styles.avatar}
        />

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.nameText}>{displayName}</Text>
            <Text style={styles.timestamp}>
              {lastMessage?.created_at
                ? new Date(lastMessage.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.lastMessage}>
            {lastMessage?.body || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.primary || '#bd93f9'}
          />
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

      <TouchableOpacity
        style={styles.newConversationButton}
        onPress={() => setShowSearchModal(true)}
      >
        <MaterialCommunityIcons name="message-plus" size={24} color="white" />
      </TouchableOpacity>

      <UserSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onUserSelect={(user) => {
          setShowSearchModal(false);
          router.push(`/chat?chatId=${user.id}`);
        }}
      />
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
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: colors.cardBackground || '#1a1a1a',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text || '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted || '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary || '#bbb',
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