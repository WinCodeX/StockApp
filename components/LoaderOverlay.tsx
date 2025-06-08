// components/LoaderOverlay.tsx

import React from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function LoaderOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 46, 0.6)', // translucent backdrop
    justifyContent: 'center',
    alignItems: 'center',
  },
});