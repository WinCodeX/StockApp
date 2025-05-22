import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar, Button, Dialog, Portal } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { getUser } from '../lib/helpers/getUser';
import { uploadAvatar } from '../lib/helpers/uploadAvatar';

export default function AccountScreen() {
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string>();
  const [loading, setLoading] = useState<boolean>(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
    };
  }, [navigation]);

  const loadProfile = useCallback(() => {
    (async () => {
      try {
        const user = await getUser();
        setUserName(user.username || '');
        setAvatarUri(user.avatar_url || null);
        console.log('User profile data:', user);
      } catch (error) {
        Alert.alert('Error', 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const pickAndUploadAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return Alert.alert('Permission required', 'Please allow photo access.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.length) return;

    try {
      await uploadAvatar(result.assets[0].uri);
      Toast.show({ type: 'successToast', text1: 'Avatar updated!' });
      loadProfile();
    } catch {
      Toast.show({ type: 'errorToast', text1: 'Upload failed.' });
    }
  };

  const confirmLogout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setShowLogoutConfirm(false);
    Toast.show({ type: 'warningToast', text1: 'Logged out successfully' });
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#bd93f9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.identityCard}>
        <View style={styles.identityLeft}>
          <Text style={styles.userName}>{userName || 'No name'}</Text>
          <Text style={styles.accountType}>StockApp Account</Text>
        </View>
        <TouchableOpacity onPress={pickAndUploadAvatar}>
          <Avatar.Image
            size={60}
            source={
              avatarUri
                ? { uri: avatarUri }
                : require('../assets/images/avatar-placeholder.png')
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.logoutCard}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutConfirm(true)}
        >
          <MaterialCommunityIcons
            name="logout"
            size={22}
            color="#ff6b6b"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <Portal>
        <Dialog
          visible={showLogoutConfirm}
          onDismiss={() => setShowLogoutConfirm(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Confirm Logout</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Are you sure you want to log out?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              onPress={() => setShowLogoutConfirm(false)}
              style={styles.dialogCancel}
              labelStyle={styles.cancelLabel}
            >
              No
            </Button>
            <Button
              mode="outlined"
              onPress={confirmLogout}
              style={styles.dialogConfirm}
              labelStyle={styles.confirmLabel}
            >
              Yes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#1e1e2e',
  },
  identityCard: {
    backgroundColor: '#282a36',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identityLeft: {
    flexDirection: 'column',
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountType: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  logoutCard: {
    backgroundColor: '#282a36',
    margin: 16,
    borderRadius: 12,
    padding: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
  dialog: {
    backgroundColor: '#282a36',
    borderRadius: 12,
  },
  dialogTitle: {
    color: '#f8f8f2',
    fontWeight: 'bold',
  },
  dialogText: {
    color: '#ccc',
    fontSize: 15,
  },
  dialogActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  dialogCancel: {
    backgroundColor: '#bd93f9',
    borderRadius: 6,
    marginRight: 8,
  },
  cancelLabel: {
    color: '#fff',
  },
  dialogConfirm: {
    borderColor: '#ff5555',
    borderWidth: 1,
    borderRadius: 6,
  },
  confirmLabel: {
    color: '#ff5555',
    fontWeight: 'bold',
  },
});