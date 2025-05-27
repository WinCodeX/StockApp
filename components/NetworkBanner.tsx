// components/NetworkBanner.tsx

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const COLORS = {
  offline: '#ff5a5f',
  online: '#50fa7b',
  text: '#fff',
};

const NetworkBanner = ({ status }: { status: 'online' | 'offline' | 'server_error' }) => {
  if (!status || status === 'online') return null;

  const bgColor = status === 'offline' ? COLORS.offline : COLORS.offline;
  const message =
    status === 'offline'
      ? 'You are offline'
      : status === 'server_error'
      ? 'Server is unreachable'
      : '';

  return (
    <View style={[styles.banner, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
  },
  text: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default NetworkBanner;