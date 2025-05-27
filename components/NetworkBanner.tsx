import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { registerStatusUpdater } from '../lib/netStatus';

const NetworkBanner = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'server_error' | null>(null);
  const [slideAnim] = useState(new Animated.Value(-50));

  const showBanner = (newStatus: 'online' | 'offline' | 'server_error') => {
    setStatus(newStatus);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (newStatus === 'online') {
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setStatus(null));
      }, 2000);
    }
  };

  useEffect(() => {
    registerStatusUpdater(showBanner);

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        showBanner('online');
      } else {
        showBanner('offline');
      }
    });

    return () => unsubscribe();
  }, []);

  if (!status) return null;

  const backgroundColor =
    status === 'offline'
      ? '#6272a4'
      : status === 'server_error'
      ? '#ff5555'
      : '#bd93f9';

  const message =
    status === 'offline'
      ? 'You are offline'
      : status === 'server_error'
      ? 'Server is unreachable'
      : 'You are back online';

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default NetworkBanner;