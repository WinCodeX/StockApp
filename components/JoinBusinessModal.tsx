import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import colors from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
};

export default function JoinBusinessModal({ visible, onClose, onJoin }: Props) {
  const [code, setCode] = useState('');

  const handleJoin = () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length === 6) {
      onJoin(trimmedCode);
      setCode('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centeredOverlay}
      >
        <View style={styles.modalBox}>
          <Text style={styles.title}>Join Business</Text>

          <TextInput
            placeholder="Enter 6-digit code"
            placeholderTextColor="#888"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />

          <Button mode="contained" onPress={handleJoin} style={styles.button}>
            Join
          </Button>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalBox: {
    width: '85%',
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8f8f2',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2a2a3d',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  closeText: {
    color: '#888',
  },
});