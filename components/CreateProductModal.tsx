// components/CreateProductModal.tsx

import React, { useState } from 'react'; import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, } from 'react-native'; import { Button } from 'react-native-paper'; import { MaterialCommunityIcons } from '@expo/vector-icons'; import colors from '../theme/colors';

export default function CreateProductModal({ visible, onClose, onSubmit, }: { visible: boolean; onClose: () => void; onSubmit: (product: { name: string; sku: string; price: number; quantity: number; }) => void; }) { const [name, setName] = useState(''); const [sku, setSku] = useState(''); const [price, setPrice] = useState(''); const [quantity, setQuantity] = useState('');

const handleCreate = () => { if (!name || !sku || !price || !quantity) return; onSubmit({ name, sku, price: parseFloat(price), quantity: parseInt(quantity), }); setName(''); setSku(''); setPrice(''); setQuantity(''); onClose(); };

return ( <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}> <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay} > <View style={styles.sheet}> <TouchableOpacity onPress={onClose} style={styles.dragHandleContainer}> <MaterialCommunityIcons name="chevron-down" size={30} color="#bbb" /> </TouchableOpacity>

<Text style={styles.title}>Create New Product</Text>

      <TextInput
        placeholder="Product Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="SKU"
        value={sku}
        onChangeText={setSku}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Price"
        value={price}
        keyboardType="numeric"
        onChangeText={setPrice}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Initial Quantity"
        value={quantity}
        keyboardType="numeric"
        onChangeText={setQuantity}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <Button mode="contained" onPress={handleCreate} style={styles.button}>
        Create
      </Button>
    </View>
  </KeyboardAvoidingView>
</Modal>

); }

const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)', }, sheet: { backgroundColor: colors.background, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', }, dragHandleContainer: { alignItems: 'center', marginBottom: 8, }, title: { fontSize: 20, fontWeight: 'bold', color: '#f8f8f2', marginBottom: 10, textAlign: 'center', }, input: { backgroundColor: '#2a2a3d', color: '#fff', padding: 10, borderRadius: 6, marginBottom: 12, borderWidth: 1, borderColor: '#444', }, button: { backgroundColor: colors.primary, }, });

