import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { searchUsers } from '../lib/helpers/searchUsers';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

const UserSearchModal: React.FC<Props> = ({ visible, onClose, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (q: string) => {
    if (!q.trim()) return setUsers([]);
    setLoading(true);
    try {
      const results = await searchUsers(q);
      setUsers(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchUsers(query);
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Search Users</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search by username or email..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
          />

          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userRow}
                  onPress={() => {
                    onSelectUser(item);
                    setQuery('');
                    setUsers([]);
                    onClose();
                  }}
                >
                  <Image
                    source={
                      item.avatar_url
                        ? { uri: item.avatar_url }
                        : require('../assets/images/avatar_placeholder.png')
                    }
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.username}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                query.length > 0 && (
                  <Text style={styles.emptyText}>No users found for “{query}”.</Text>
                )
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#2a2a3d',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#444',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#555',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#fff',
  },
  userEmail: {
    fontSize: 13,
    color: '#aaa',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default UserSearchModal;