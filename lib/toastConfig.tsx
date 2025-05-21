import { View, Text, StyleSheet } from 'react-native';

export const toastConfig = {

// ← new “default” style
  defaultToast: ({ text1 }: any) => (
    <View style={[styles.toast, { backgroundColor: '#6272a4' }]}>
      <Text style={styles.toastText}>{text1}</Text>
    </View>
  ),

  successToast: ({ text1 }: any) => (
    <View style={[styles.toast, { backgroundColor: '#50fa7b' }]}>
      <Text style={styles.toastText}>{text1}</Text>
    </View>
  ),

  warningToast: ({ text1 }: any) => (
    <View style={[styles.toast, { backgroundColor: '#f1fa8c' }]}>
      <Text style={styles.toastText}>{text1}</Text>
    </View>
  ),

  errorToast: ({ text1 }: any) => (
    <View style={[styles.toast, { backgroundColor: '#ff5555' }]}>
      <Text style={styles.toastText}>{text1}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: 'center',
    minWidth: '80%',
  },
  toastText: {
    color: '#1e1e2e',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});