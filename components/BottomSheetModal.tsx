import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function BottomSheetModal({
  visible,
  onClose,
  product,
  type,
  quantity,
  setQuantity,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  product: any;
  type: 'add' | 'view';
  quantity: string;
  setQuantity: (value: string) => void;
  onSubmit: () => void;
}) {
  const mockStockHistory = [
    { id: 1, quantity: 30, date: '2025-05-25' },
    { id: 2, quantity: 20, date: '2025-05-23' },
    { id: 3, quantity: 50, date: '2025-05-20' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <TouchableOpacity onPress={onClose} style={styles.dragHandleContainer}>
            <MaterialCommunityIcons name="chevron-down" size={30} color="#bbb" />
          </TouchableOpacity>

          <Text style={styles.title}>
            {type === 'add' ? 'Add Stock' : 'Stock History'}
          </Text>

          <Text style={styles.label}>
            Product: {product?.attributes?.name || 'Unknown'}
          </Text>

          {type === 'add' ? (
            <>
              <TextInput
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                style={styles.input}
                placeholderTextColor="#888"
              />
              <Button mode="contained" onPress={onSubmit} style={styles.button}>
                Submit
              </Button>
            </>
          ) : (
            <FlatList
              data={mockStockHistory}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View style={styles.historyRow}>
                  <Text style={styles.historyText}>
                    Qty: {item.quantity} | Date: {item.date}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: colors.background,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8f8f2',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    color: '#ddd',
    marginBottom: 10,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#2a2a3d',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: colors.primary,
  },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historyText: {
    color: '#ccc',
  },
});