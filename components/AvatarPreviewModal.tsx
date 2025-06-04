import React from 'react'; import { Modal, View, StyleSheet, Text, TouchableOpacity, Image, Dimensions, } from 'react-native'; import { Button } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function AvatarPreviewModal({ visible, imageUri, onCancel, onConfirm, }: { visible: boolean; imageUri: string; onCancel: () => void; onConfirm: () => void; }) { return ( <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}> <View style={styles.overlay}> <View style={styles.modalBox}> <Text style={styles.title}>Preview Avatar</Text>

<Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

      <View style={styles.actions}>
        <Button mode="outlined" onPress={onCancel} style={styles.cancelButton}>
          Cancel
        </Button>
        <Button mode="contained" onPress={onConfirm} style={styles.confirmButton}>
          Upload
        </Button>
      </View>
    </View>
  </View>
</Modal>

); }

const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)', }, modalBox: { backgroundColor: '#1e1e2e', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, alignItems: 'center', }, title: { color: '#f8f8f2', fontSize: 18, fontWeight: 'bold', marginBottom: 12, }, preview: { width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35, borderWidth: 2, borderColor: '#bd93f9', marginBottom: 16, }, actions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', }, cancelButton: { flex: 1, marginRight: 10, }, confirmButton: { flex: 1, backgroundColor: '#bd93f9', }, });

