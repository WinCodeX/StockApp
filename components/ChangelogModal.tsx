// components/ChangelogModal.tsx

import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const autoDismissDelay = 7000;

const CHANGELOG_VERSION = '1.2.4';
const CHANGELOG_CONTENT = [
  'Improved offline profile',
  'Added business link generator', 
  'New UI polish',
  'Bug fixes',
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ChangelogModal({ visible, onClose }: Props) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{`What's New (v${CHANGELOG_VERSION})`}</Text>
          <Text style={styles.text}>
            {CHANGELOG_CONTENT.map((item, index) =>
              `• ${item}${index !== CHANGELOG_CONTENT.length - 1 ? '\n' : ''}`
            )}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}