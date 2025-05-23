import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '../theme/colors';
import { getUser, getCachedAvatar } from '../lib/helpers/getUser';

const BASE_URL = 'http://192.168.100.155:3000';

export default function HeaderBar() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadAvatar = async () => {
      const cached = await getCachedAvatar();
      if (cached) setAvatar(cached);

      try {
        const user = await getUser();
        if (user.avatar_url) setAvatar(`${BASE_URL}${user.avatar_url}`);
      } catch (error) {
        console.error('Failed to load user avatar', error);
      }
    };

    loadAvatar();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StockX</Text>
      <TouchableOpacity onPress={() => router.push('/account')}>
        <Image
          source={
            avatar && !error
              ? { uri: avatar }
              : require('../assets/images/avatar-placeholder.png')
          }
          onError={() => setError(true)}
          style={styles.avatar}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e2e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3c',
  },
  title: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});