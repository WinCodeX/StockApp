// components/ChangelogModal.tsx

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANGELOG_VERSION = '1.2.1';
const CHANGELOG_KEY = `changelog_seen_${CHANGELOG_VERSION}`;

export default function ChangelogModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem(CHANGELOG_KEY);
      if (!seen) {
        setVisible(true);
        setTimeout(() => dismiss(), 7000); // auto-dismiss after 7 sec
      }
    })();
  }, []);

  const dismiss = async () => {
    await AsyncStorage.setItem(CHANGELOG_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={dismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>What's New (v1.0.2)</Text>
          <Text style={styles.text}>• Improved offline profile{"\n"}• UI polish{"\n"}• Bug fixes</Text>
          <TouchableOpacity onPress={dismiss} style={styles.button}>
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#282a36',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#bd93f9',
    marginBottom: 10,
  },
  text: {
    color: '#f8f8f2',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    alignSelf: 'flex-end',
    backgroundColor: '#6272a4',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});