import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '../theme/colors';
import { useUser } from '../context/UserContext';

export default function HeaderBar() {
  const router = useRouter();
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StockX</Text>
      <TouchableOpacity onPress={() => router.push('/account')}>
        <Image
          source={
            user?.avatar_url
              ? { uri: user.avatar_url }
              : require('../assets/images/avatar_placeholder.png')
          }
          style={styles.avatar}
          resizeMode="cover"
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