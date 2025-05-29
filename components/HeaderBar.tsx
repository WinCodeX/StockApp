import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '../theme/colors';
import { getUser } from '../lib/helpers/getUser';
import { BASE_URL } from '../lib/api'; // ✅ Import centralized base URL

export default function HeaderBar() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const user = await getUser();
        const avatarPath = user.avatar_url;

        // ✅ Normalize URL: avoid double BASE_URL if already absolute
        const normalized = avatarPath?.startsWith('http')
          ? avatarPath
          : `${BASE_URL}${avatarPath}`;

        if (avatarPath) {
          setAvatar(normalized);
        }
      } catch (error) {
        console.error('Avatar fetch failed', error);
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
            avatar
              ? { uri: avatar }
              : require('../assets/images/avatar_placeholder.png')
          }
          style={styles.avatar}
          resizeMode="cover"
          onError={() => setAvatar(null)}
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#444',
  },
});