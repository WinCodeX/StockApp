import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Avatar, Button, Dialog, Portal } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUser } from '../lib/helpers/getUser';
import { uploadAvatar } from '../lib/helpers/uploadAvatar';
import LoaderOverlay from '../components/LoaderOverlay';
import ChangelogModal, { CHANGELOG_KEY, CHANGELOG_VERSION } from '../components/ChangelogModal';
import BusinessModal from '../components/BusinessModal';

export default function AccountScreen() {
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [businessName, setBusinessName] = useState<string | null>(null);

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
        setUserName(user?.username || '');
        setAvatarUri(user?.avatar_url ? normalizeUrl(user.avatar_url) : null);
        setBusinessName(user?.business?.name || null);

        const seen = await AsyncStorage.getItem(CHANGELOG_KEY);
        if (!seen) setShowChangelog(true);
      } catch {
        Toast.show({ type: 'errorToast', text1: 'Failed to load profile.' });
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
    if (!perm.granted) {
      return Toast.show({ type: 'warningToast', text1: 'Photo access denied.' });
    }

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

  const dismissChangelog = async () => {
    await AsyncStorage.setItem(CHANGELOG_KEY, 'true');
    setShowChangelog(false);
  };

  const handleBusinessCreate = (name: string) => {
    setBusinessName(name);
    Toast.show({ type: 'successToast', text1: `Business '${name}' created.` });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LoaderOverlay visible={loading} />
      <ChangelogModal visible={showChangelog} onClose={dismissChangelog} />
      <BusinessModal
        visible={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        onCreate={handleBusinessCreate}
      />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#bd93f9" />
        </TouchableOpacity>
        <Text style={styles.header}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile Info */}
        <View style={styles.identityCard}>
          <View style={styles.identityLeft}>
            <Text style={styles.userName}>{userName || 'No name'}</Text>
            <Text style={styles.accountType}>StockApp Account</Text>
            <Text style={{ color: '#999', marginTop: 4 }}>v{CHANGELOG_VERSION}</Text>
          </View>
          <TouchableOpacity onPress={pickAndUploadAvatar}>
            <Avatar.Image
              size={60}
              source={
                avatarUri
                  ? { uri: avatarUri }
                  : require('../assets/images/avatar_placeholder.png')
              }
              onError={() => setAvatarUri(null)}
            />
          </TouchableOpacity>
        </View>

        {/* Business Section */}
        <View style={styles.identityCard}>
          <Text style={styles.userName}>Business</Text>
          {businessName ? (
            <View>
              <Text style={{ color: '#fff', marginTop: 6 }}>{businessName}</Text>
              <Text style={{ color: '#ccc', marginTop: 12 }}>Team Members:</Text>
              <Text style={{ color: '#aaa', marginTop: 4 }}>- You (Owner)</Text>

              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => Toast.show({ type: 'infoToast', text1: 'Invite link logic coming soon!' })}
              >
                <Text style={{ color: '#f8f8f2' }}>Generate Invite Link</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Button mode="outlined" onPress={() => setShowBusinessModal(true)}>
              Create Business
            </Button>
          )}
        </View>

        {/* Logout */}
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

        {/* Confirm Dialog */}
        <Portal>
          <Dialog
            visible={showLogoutConfirm}
            onDismiss={() => setShowLogoutConfirm(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>Confirm Logout</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogText}>Are you sure you want to log out?</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e2e',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#bd93f9',
  },
  identityCard: {
    backgroundColor: '#282a36',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'column',
    justifyContent: 'space-between',
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
  inviteButton: {
    marginTop: 12,
    backgroundColor: '#44475a',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
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