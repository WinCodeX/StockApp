import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const abortControllerRef = useRef(null);

  // Refresh conversations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchConversations = async (isRefresh = false) => {
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const data = await getConversations();
      
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }
      
      setConversations(data);
    } catch (err) {
      // Don't show error if request was aborted
      if (err.name !== 'AbortError') {
        const errorMessage = err.message || 'Failed to load conversations';
        setError(errorMessage);
        Toast.show({
          type: 'errorToast',
          text1: 'Error loading conversations',
          text2: errorMessage,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      abortControllerRef.current = null;
    }
  };

  const handleRefresh = () => {
    fetchConversations(true);
  };

  const handleConversationPress = (conversationId, username, avatarUrl, otherUserId) => {
    // Navigate directly with existing conversation data
    router.push({
      pathname: '/chat',
      params: {
        conversationId: conversationId.toString(),
        username: username || 'Unknown User',
        avatarUrl: avatarUrl || '',
        userId: otherUserId?.toString() || '',
      },
    });
  };

  const handleNewConversation = async (user) => {
    try {
      setShowSearchModal(false);
      
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      // Show loading state
      Toast.show({
        type: 'info',
        text1: 'Starting conversation...',
      });

      const response = await api.post(
        '/api/v1/conversations',
        { receiver_id: user.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const conversation = response.data?.data || response.data;
      
      if (!conversation?.id) {
        throw new Error('Invalid conversation response');
      }

      // Navigate to the new conversation
      router.push({
        pathname: '/chat',
        params: {
          conversationId: conversation.id.toString(),
          username: user.username || 'Unknown User',
          avatarUrl: user.avatar_url || '',
          userId: user.id.toString(),
        },
      });

      // Refresh conversations list to include the new one
      fetchConversations();
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      Toast.show({
        type: 'errorToast',
        text1: 'Failed to start conversation',
        text2: error.message || 'Please try again',
      });
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Today - show time
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  const renderItem = ({ item }) => {
    try {
      const currentUserId = item.current_user_id;
      const isSender = item.sender?.id === currentUserId;
      const otherUser = isSender ? item.receiver : item.sender;

      // Validate required data
      if (!otherUser?.id) {
        console.warn('Invalid conversation item:', item);
        return null;
      }

      const displayName = otherUser.username || 'Unknown User';
      const avatarUrl = otherUser.avatar_url;
      const otherUserId = otherUser.id;
      const lastMessage = item.messages?.[0];

      const isCurrentUserSender = lastMessage?.user_id === currentUserId;
      const messagePreview = lastMessage?.body
        ? `${isCurrentUserSender ? 'You: ' : ''}${lastMessage.body}`
        : 'No messages yet';

      return (
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() =>
            handleConversationPress(item.id, displayName, avatarUrl, otherUserId)
          }
          activeOpacity={0.7}
        >
          <Image
            source={
              avatarUrl
                ? { uri: avatarUrl }
                : require('../assets/images/avatar_placeholder.png')
            }
            style={styles.avatar}
            defaultSource={require('../assets/images/avatar_placeholder.png')}
          />

          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <Text style={styles.nameText} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(lastMessage?.created_at)}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.lastMessage}>
              {messagePreview}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error('Error rendering conversation item:', error);
      return null;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name="message-outline" 
        size={64} 
        color={colors.textMuted || '#999'} 
      />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a new conversation by tapping the + button
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.primary || '#bd93f9'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversations</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#bd93f9'} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons 
            name="alert-circle-outline" 
            size={48} 
            color="#ff6b6b" 
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => fetchConversations()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={[
            { paddingBottom: 120 },
            conversations.length === 0 && { flex: 1 }
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary || '#bd93f9']}
              tintColor={colors.primary || '#bd93f9'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.newConversationButton}
        onPress={() => setShowSearchModal(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="message-plus" size={24} color="white" />
      </TouchableOpacity>

      <UserSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onUserSelect={handleNewConversation}
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
    padding: 4, // Increase touch target
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
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary || '#bd93f9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text || '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textMuted || '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#333',
    backgroundColor: colors.cardBackground || '#1a1a1a',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.border || '#333', // Fallback background
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text || '#fff',
    flex: 1,
    marginRight: 8,
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