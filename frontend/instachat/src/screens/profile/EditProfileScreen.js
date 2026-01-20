// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system';
// import { useDispatch, useSelector } from 'react-redux';

// import { updateProfile } from '../../redux/slices/authSlice';
// import { getPresignedUploadUrl } from '../../api/Media.api';
// import colors from '../../theme/colors';

// const EditProfileScreen = ({ navigation }) => {
//   const dispatch = useDispatch();
//   const user = useSelector(state => state.auth.user);

//   const [username, setUsername] = useState('');
//   const [bio, setBio] = useState('');
//   const [imageUri, setImageUri] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   /* =========================
//      INIT
//   ========================= */
//   useEffect(() => {
//     if (user) {
//       setUsername(user.username || '');
//       setBio(user.bio || '');
//     }
//   }, [user]);

//   /* =========================
//      PICK IMAGE
//   ========================= */
//   const pickImage = async () => {
//     const { status } =
//       await ImagePicker.requestMediaLibraryPermissionsAsync();

//     if (status !== 'granted') {
//       Alert.alert('Permission required');
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.85,
//     });

//     if (!result.canceled) {
//       setImageUri(result.assets[0].uri);
//     }
//   };

//   /* =========================
//      UPLOAD AVATAR → AWS
//   ========================= */
//   const uploadAvatarToS3 = async (localUri) => {
//     const fileInfo = await FileSystem.getInfoAsync(localUri);
//     if (!fileInfo.exists) {
//       throw new Error('Image file not found');
//     }

//     const mimeType = 'image/jpeg';
//     const fileSizeMB = fileInfo.size / (1024 * 1024);

//     // 1️⃣ Request presigned URL
//     const presignRes = await getPresignedUploadUrl({
//       mediaType: 'image',
//       mimeType,
//       fileSizeMB,
//     });

//     const { uploadUrl, key } = presignRes.data;

//     // 2️⃣ Upload directly to S3
//     const uploadResponse = await fetch(uploadUrl, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': mimeType,
//       },
//       body: await FileSystem.readAsStringAsync(localUri, {
//         encoding: FileSystem.EncodingType.Base64,
//       }).then(b64 =>
//         Uint8Array.from(atob(b64), c => c.charCodeAt(0))
//       ),
//     });

//     if (!uploadResponse.ok) {
//       throw new Error('S3 upload failed');
//     }

//     return key; // ✅ confirmation key
//   };

//   /* =========================
//      SAVE PROFILE
//   ========================= */
//   const handleSave = async () => {
//     const cleanUsername = username.trim();
//     const cleanBio = bio.trim();

//     if (!cleanUsername) {
//       Alert.alert('Username is required');
//       return;
//     }

//     try {
//       setUploading(true);

//       let avatarKey = null;

//       // ✅ Upload avatar FIRST
//       if (imageUri) {
//         avatarKey = await uploadAvatarToS3(imageUri);
//       }

//       // ✅ Update backend with avatarKey
//       const payload = {
//         username: cleanUsername,
//         bio: cleanBio,
//       };

//       if (avatarKey) {
//         payload.avatarKey = avatarKey;
//       }

//       const result = await dispatch(updateProfile(payload));

//       if (updateProfile.fulfilled.match(result)) {
//         Alert.alert('Success', 'Profile updated');
//         navigation.goBack();
//       } else {
//         throw new Error(result.payload || 'Update failed');
//       }
//     } catch (err) {
//       console.error('Profile update error:', err);
//       Alert.alert(
//         'Update failed',
//         err.message || 'Something went wrong'
//       );
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Text style={styles.cancelText}>Cancel</Text>
//         </TouchableOpacity>

//         <Text style={styles.headerTitle}>Edit Profile</Text>

//         <TouchableOpacity onPress={handleSave} disabled={uploading}>
//           {uploading ? (
//             <ActivityIndicator color={colors.primary} />
//           ) : (
//             <Text style={styles.doneText}>Done</Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* AVATAR */}
//       <View style={styles.avatarContainer}>
//         <TouchableOpacity onPress={pickImage}>
//           <Image
//             source={{
//               uri:
//                 imageUri ||
//                 user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />
//           <Text style={styles.changePhotoText}>
//             Change Profile Photo
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* FORM */}
//       <View style={styles.form}>
//         <View style={styles.inputGroup}>
//           <Text style={styles.label}>Username</Text>
//           <TextInput
//             style={styles.input}
//             value={username}
//             onChangeText={setUsername}
//             autoCapitalize="none"
//           />
//         </View>

//         <View style={styles.inputGroup}>
//           <Text style={styles.label}>Bio</Text>
//           <TextInput
//             style={styles.input}
//             value={bio}
//             onChangeText={setBio}
//             placeholder="Write a bio..."
//             multiline
//           />
//         </View>
//       </View>
//     </View>
//   );
// };

// export default EditProfileScreen;

// /* =========================
//    STYLES
// ========================= */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingTop: 50,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   headerTitle: {
//     fontWeight: 'bold',
//     fontSize: 17,
//   },
//   cancelText: {
//     fontSize: 16,
//   },
//   doneText: {
//     color: colors.primary,
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   avatarContainer: {
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   avatar: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     marginBottom: 10,
//   },
//   changePhotoText: {
//     color: colors.primary,
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   form: {
//     paddingHorizontal: 20,
//   },
//   inputGroup: {
//     flexDirection: 'row',
//     marginBottom: 20,
//     alignItems: 'center',
//   },
//   label: {
//     width: 80,
//     fontSize: 16,
//     color: colors.textSecondary,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#efefef',
//     paddingBottom: 10,
//   },
// });



// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system/legacy'; // ✅ FIX
// import { useDispatch, useSelector } from 'react-redux';

// import { updateProfile } from '../../redux/slices/authSlice';
// import { getPresignedUploadUrl } from '../../api/Media.api';
// import colors from '../../theme/colors';

// const EditProfileScreen = ({ navigation }) => {
//   const dispatch = useDispatch();
//   const user = useSelector(state => state.auth.user);

//   const [username, setUsername] = useState('');
//   const [bio, setBio] = useState('');
//   const [imageUri, setImageUri] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   /* =========================
//      INIT
//   ========================= */
//   useEffect(() => {
//     if (user) {
//       setUsername(user.username || '');
//       setBio(user.bio || '');
//     }
//   }, [user]);

//   /* =========================
//      PICK IMAGE (FIXED ENUM)
//   ========================= */
//   const pickImage = async () => {
//     const { status } =
//       await ImagePicker.requestMediaLibraryPermissionsAsync();

//     if (status !== 'granted') {
//       Alert.alert('Permission required');
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaType.Images, // ✅ FIX
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.85,
//     });

//     if (!result.canceled) {
//       setImageUri(result.assets[0].uri);
//     }
//   };

//   /* =========================
//      UPLOAD AVATAR → AWS (FIXED)
//   ========================= */
//   const uploadAvatarToS3 = async (localUri) => {
//     const fileInfo = await FileSystem.getInfoAsync(localUri);

//     if (!fileInfo.exists) {
//       throw new Error('Image file not found');
//     }

//     const mimeType = 'image/jpeg';
//     const fileSizeMB = fileInfo.size / (1024 * 1024);

//     // 1️⃣ Presign
//     const presignRes = await getPresignedUploadUrl({
//       mediaType: 'image',
//       mimeType,
//       fileSizeMB,
//     });

//     const { uploadUrl, key } = presignRes.data;

//     // 2️⃣ Upload as BLOB (correct way)
//     const blob = await fetch(localUri).then(res => res.blob());

//     const uploadRes = await fetch(uploadUrl, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': mimeType,
//       },
//       body: blob,
//     });

//     if (!uploadRes.ok) {
//       throw new Error('S3 upload failed');
//     }

//     return key; // ✅ confirmation key
//   };

//   /* =========================
//      SAVE PROFILE
//   ========================= */
//   const handleSave = async () => {
//     const cleanUsername = username.trim();
//     const cleanBio = bio.trim();

//     if (!cleanUsername) {
//       Alert.alert('Username is required');
//       return;
//     }

//     try {
//       setUploading(true);

//       let avatarKey = null;

//       if (imageUri) {
//         avatarKey = await uploadAvatarToS3(imageUri);
//       }

//       const payload = {
//         username: cleanUsername,
//         bio: cleanBio,
//         ...(avatarKey && { avatarKey }),
//       };

//       const result = await dispatch(updateProfile(payload));

//       if (updateProfile.fulfilled.match(result)) {
//         Alert.alert('Success', 'Profile updated');
//         navigation.goBack();
//       } else {
//         throw new Error(result.payload || 'Update failed');
//       }
//     } catch (err) {
//       console.error('Profile update error:', err);
//       Alert.alert('Update failed', err.message);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Text style={styles.cancelText}>Cancel</Text>
//         </TouchableOpacity>

//         <Text style={styles.headerTitle}>Edit Profile</Text>

//         <TouchableOpacity onPress={handleSave} disabled={uploading}>
//           {uploading ? (
//             <ActivityIndicator color={colors.primary} />
//           ) : (
//             <Text style={styles.doneText}>Done</Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       <View style={styles.avatarContainer}>
//         <TouchableOpacity onPress={pickImage}>
//           <Image
//             source={{
//               uri:
//                 imageUri ||
//                 user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />
//           <Text style={styles.changePhotoText}>
//             Change Profile Photo
//           </Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.form}>
//         <View style={styles.inputGroup}>
//           <Text style={styles.label}>Username</Text>
//           <TextInput
//             style={styles.input}
//             value={username}
//             onChangeText={setUsername}
//             autoCapitalize="none"
//           />
//         </View>

//         <View style={styles.inputGroup}>
//           <Text style={styles.label}>Bio</Text>
//           <TextInput
//             style={styles.input}
//             value={bio}
//             onChangeText={setBio}
//             multiline
//           />
//         </View>
//       </View>
//     </View>
//   );
// };

// export default EditProfileScreen;

// /* =========================
//    STYLES
// ========================= */
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   headerTitle: { fontWeight: 'bold', fontSize: 17 },
//   cancelText: { fontSize: 16 },
//   doneText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
//   avatarContainer: { alignItems: 'center', marginBottom: 30 },
//   avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
//   changePhotoText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
//   form: { paddingHorizontal: 20 },
//   inputGroup: {
//     flexDirection: 'row',
//     marginBottom: 20,
//     alignItems: 'center',
//   },
//   label: { width: 80, fontSize: 16, color: colors.textSecondary },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#efefef',
//     paddingBottom: 10,
//   },
// });


import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useDispatch, useSelector } from 'react-redux';

import { updateProfile } from '../../redux/slices/authSlice';
import { getPresignedUploadUrl } from '../../api/Media.api';
import colors from '../../theme/colors';

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* =========================
     INIT
  ========================= */
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
    }
  }, [user]);

  /* =========================
     PICK IMAGE (WORKING)
  ========================= */
  const pickImage = async () => {
  try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ CORRECT
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
    }
  } catch (err) {
    console.error('Image picker error:', err);
    Alert.alert('Failed to pick image');
  }
};



  /* =========================
     UPLOAD AVATAR → AWS
  ========================= */
  const uploadAvatarToS3 = async (localUri) => {
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }

    const mimeType = 'image/jpeg';
    const fileSizeMB = fileInfo.size / (1024 * 1024);

    const presignRes = await getPresignedUploadUrl({
      mediaType: 'image',
      mimeType,
      fileSizeMB,
    });

    const { uploadUrl, key } = presignRes.data;

    const blob = await fetch(localUri).then(res => res.blob());

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: blob,
    });

    if (!uploadRes.ok) {
      throw new Error('S3 upload failed');
    }

    return key;
  };

  /* =========================
     SAVE PROFILE
  ========================= */
  const handleSave = async () => {
    const cleanUsername = username.trim();
    const cleanBio = bio.trim();

    if (!cleanUsername) {
      Alert.alert('Username is required');
      return;
    }

    try {
      setUploading(true);

      let avatarKey = null;

      if (imageUri) {
        avatarKey = await uploadAvatarToS3(imageUri);
      }

      const payload = {
        username: cleanUsername,
        bio: cleanBio,
        ...(avatarKey && { avatarKey }),
      };

      const result = await dispatch(updateProfile(payload));

      if (updateProfile.fulfilled.match(result)) {
        Alert.alert('Success', 'Profile updated');
        navigation.goBack();
      } else {
        throw new Error(result.payload || 'Update failed');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      Alert.alert('Update failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <TouchableOpacity onPress={handleSave} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.doneText}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* AVATAR */}
      <View style={styles.avatarContainer}>
        {/* IMAGE PRESS */}
        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={{
              uri:
                imageUri ||
                user?.profilePicture ||
                'https://via.placeholder.com/150',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>

        {/* TEXT PRESS */}
        <TouchableOpacity onPress={pickImage} activeOpacity={0.6}>
          <Text style={styles.changePhotoText}>
            Change Profile Photo
          </Text>
        </TouchableOpacity>
      </View>

      {/* FORM */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            multiline
          />
        </View>
      </View>
    </View>
  );
};

export default EditProfileScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: { fontWeight: 'bold', fontSize: 17 },
  cancelText: { fontSize: 16 },
  doneText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  changePhotoText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  form: { paddingHorizontal: 20 },
  inputGroup: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  label: { width: 80, fontSize: 16, color: colors.textSecondary },
  input: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
    paddingBottom: 10,
  },
});
