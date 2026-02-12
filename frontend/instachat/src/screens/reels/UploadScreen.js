// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { Video, ResizeMode } from 'expo-av';
// import { Ionicons } from '@expo/vector-icons';
// import colors from '../../theme/colors';
// import { uploadReel } from '../../api/Posts.api';
// import { ROUTES } from '../../navigation/routes.constants';

// const UploadScreen = ({ navigation }) => {
//   const [videoUri, setVideoUri] = useState(null);
//   const [caption, setCaption] = useState('');
//   const [loading, setLoading] = useState(false);

//   /* ============================
//      Pick Video
//   ============================ */
//   const pickVideo = async () => {
//     const { status } =
//       await ImagePicker.requestMediaLibraryPermissionsAsync();

//     if (status !== 'granted') {
//       Alert.alert(
//         'Permission Denied',
//         'We need access to your gallery to upload videos.'
//       );
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaType.Videos,
//       allowsEditing: true,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       const asset = result.assets[0];

//       // ✅ Safety: ensure video
//       if (!asset.type || asset.type !== 'video') {
//         Alert.alert('Invalid file', 'Please select a video file.');
//         return;
//       }

//       setVideoUri(asset.uri);
//     }
//   };

//   /* ============================
//      Upload Reel
//   ============================ */
//   const handleUpload = async () => {
//     if (!videoUri) {
//       Alert.alert('Error', 'Please select a video first');
//       return;
//     }

//     setLoading(true);

//     try {
//       await uploadReel(videoUri, caption);
//       Alert.alert('Success', 'Reel uploaded successfully');

//       setVideoUri(null);
//       setCaption('');

//       // ✅ Correct navigation back to Reels tab
//       navigation.navigate(ROUTES.MAIN_TAB, {
//         screen: ROUTES.REELS,
//       });
//     } catch (error) {
//       console.error(error);
//       Alert.alert(
//         'Upload Failed',
//         error.response?.data?.message ||
//           'Could not upload video'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>New Reel</Text>

//       {/* Video Preview */}
//       {videoUri ? (
//         <View style={styles.previewContainer}>
//           <Video
//             source={{ uri: videoUri }}
//             style={styles.video}
//             useNativeControls
//             resizeMode={ResizeMode.CONTAIN}
//             isLooping
//           />
//           <TouchableOpacity
//             style={styles.removeBtn}
//             onPress={() => setVideoUri(null)}
//           >
//             <Ionicons
//               name="close-circle"
//               size={30}
//               color="white"
//             />
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <TouchableOpacity
//           style={styles.uploadBox}
//           onPress={pickVideo}
//         >
//           <Ionicons
//             name="cloud-upload-outline"
//             size={50}
//             color={colors.textSecondary}
//           />
//           <Text style={styles.uploadText}>
//             Tap to select video
//           </Text>
//         </TouchableOpacity>
//       )}

//       {/* Caption */}
//       <TextInput
//         style={styles.input}
//         placeholder="Write a caption..."
//         value={caption}
//         onChangeText={setCaption}
//         multiline
//       />

//       {/* Upload Button */}
//       <TouchableOpacity
//         style={[
//           styles.btn,
//           (!videoUri || loading) && styles.disabledBtn,
//         ]}
//         onPress={handleUpload}
//         disabled={!videoUri || loading}
//       >
//         {loading ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.btnText}>Share Reel</Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#fff',
//     paddingTop: 50,
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     color: colors.textPrimary,
//   },
//   uploadBox: {
//     height: 200,
//     borderWidth: 2,
//     borderColor: '#eee',
//     borderStyle: 'dashed',
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     backgroundColor: '#FAFAFA',
//   },
//   uploadText: {
//     marginTop: 10,
//     color: colors.textSecondary,
//   },
//   previewContainer: {
//     height: 300,
//     marginBottom: 20,
//     borderRadius: 10,
//     overflow: 'hidden',
//     backgroundColor: '#000',
//   },
//   video: { width: '100%', height: '100%' },
//   removeBtn: { position: 'absolute', top: 10, right: 10 },
//   input: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#dbdbdb',
//     padding: 10,
//     fontSize: 16,
//     marginBottom: 30,
//     minHeight: 50,
//   },
//   btn: {
//     backgroundColor: colors.primary,
//     padding: 15,
//     borderRadius: 5,
//     alignItems: 'center',
//   },
//   disabledBtn: { backgroundColor: '#A0CFFF' },
//   btnText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
// });

// export default UploadScreen;





// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { Video, ResizeMode } from 'expo-av';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useNavigation } from '@react-navigation/native';

// import colors from '../../theme/colors';
// import { uploadReelWithPresign } from '../../api/reels.api';
// import { ROUTES } from '../../navigation/routes.constants';

// const UploadScreen = () => {
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();

//   const [videoUri, setVideoUri] = useState(null);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const [caption, setCaption] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);

//   /* ============================
//      PICK VIDEO FROM GALLERY
//   ============================ */
//   const pickVideo = async () => {
//     try {
//       const { status } =
//         await ImagePicker.requestMediaLibraryPermissionsAsync();

//       if (status !== 'granted') {
//         Alert.alert(
//           'Permission Denied',
//           'We need access to your gallery to upload videos.'
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ['videos'], // ✅ New expo-image-picker API
//         allowsEditing: true,
//         quality: 1,
//         videoMaxDuration: 60, // Max 60 seconds for reels
//       });

//       console.log('📹 ImagePicker result:', result);

//       if (!result.canceled && result.assets?.length > 0) {
//         const asset = result.assets[0];

//         // Validate video (check type or mimeType)
//         const isVideo =
//           asset.type === 'video' ||
//           asset.mimeType?.startsWith('video') ||
//           asset.uri?.match(/\.(mp4|mov|mkv|avi)$/i);

//         if (!isVideo) {
//           Alert.alert('Invalid file', 'Please select a video file.');
//           return;
//         }

//         // Check duration (max 60 seconds) - duration is in milliseconds
//         if (asset.duration && asset.duration > 60000) {
//           Alert.alert(
//             'Video too long',
//             'Reels can be up to 60 seconds. Please select a shorter video.'
//           );
//           return;
//         }

//         setVideoUri(asset.uri);
//         setVideoDuration(asset.duration ? asset.duration / 1000 : 0);
//         console.log('✅ Video selected:', asset.uri);
//       }
//     } catch (error) {
//       console.error('❌ pickVideo error:', error);
//       Alert.alert('Error', 'Failed to open gallery. Please try again.');
//     }
//   };

//   /* ============================
//      RECORD VIDEO
//   ============================ */
//   const recordVideo = async () => {
//     try {
//       const { status } =
//         await ImagePicker.requestCameraPermissionsAsync();

//       if (status !== 'granted') {
//         Alert.alert(
//           'Permission Denied',
//           'We need camera access to record videos.'
//         );
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         mediaTypes: ['videos'], // ✅ New expo-image-picker API
//         allowsEditing: true,
//         quality: 1,
//         videoMaxDuration: 60,
//       });

//       console.log('📹 Camera result:', result);

//       if (!result.canceled && result.assets?.length > 0) {
//         const asset = result.assets[0];
//         setVideoUri(asset.uri);
//         setVideoDuration(asset.duration ? asset.duration / 1000 : 0);
//         console.log('✅ Video recorded:', asset.uri);
//       }
//     } catch (error) {
//       console.error('❌ recordVideo error:', error);
//       Alert.alert('Error', 'Failed to open camera. Please try again.');
//     }
//   };

//   /* ============================
//      UPLOAD REEL
//   ============================ */
//   const handleUpload = async () => {
//     if (!videoUri) {
//       Alert.alert('Error', 'Please select a video first');
//       return;
//     }

//     setLoading(true);
//     setUploadProgress(0);

//     try {
//       // Simulate progress (actual progress would need XHR)
//       const progressInterval = setInterval(() => {
//         setUploadProgress((prev) => {
//           if (prev >= 90) {
//             clearInterval(progressInterval);
//             return 90;
//           }
//           return prev + 10;
//         });
//       }, 500);

//       await uploadReelWithPresign(videoUri, caption, videoDuration);

//       clearInterval(progressInterval);
//       setUploadProgress(100);

//       Alert.alert('Success', 'Reel uploaded successfully!', [
//         {
//           text: 'OK',
//           onPress: () => {
//             setVideoUri(null);
//             setCaption('');
//             setVideoDuration(0);

//             // Navigate back to Reels tab
//             navigation.navigate(ROUTES.MAIN_TAB, {
//               screen: ROUTES.REELS,
//             });
//           },
//         },
//       ]);
//     } catch (error) {
//       console.error('Upload error:', error);
//       Alert.alert(
//         'Upload Failed',
//         error?.response?.data?.message ||
//           error.message ||
//           'Could not upload video. Please try again.'
//       );
//     } finally {
//       setLoading(false);
//       setUploadProgress(0);
//     }
//   };

//   /* ============================
//      CLEAR VIDEO
//   ============================ */
//   const clearVideo = () => {
//     setVideoUri(null);
//     setVideoDuration(0);
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <ScrollView
//         contentContainerStyle={[
//           styles.scrollContent,
//           { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
//         ]}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             style={styles.backButton}
//           >
//             <Ionicons name="close" size={28} color={colors.textPrimary} />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>New Reel</Text>
//           <View style={{ width: 28 }} />
//         </View>

//         {/* Video Preview / Select */}
//         {videoUri ? (
//           <View style={styles.previewContainer}>
//             <Video
//               source={{ uri: videoUri }}
//               style={styles.video}
//               useNativeControls
//               resizeMode={ResizeMode.CONTAIN}
//               isLooping
//             />
//             <TouchableOpacity style={styles.removeBtn} onPress={clearVideo}>
//               <Ionicons name="close-circle" size={32} color="#fff" />
//             </TouchableOpacity>
//             {videoDuration > 0 && (
//               <View style={styles.durationBadge}>
//                 <Text style={styles.durationText}>
//                   {Math.round(videoDuration)}s
//                 </Text>
//               </View>
//             )}
//           </View>
//         ) : (
//           <View style={styles.selectContainer}>
//             <TouchableOpacity style={styles.selectOption} onPress={pickVideo}>
//               <View style={styles.selectIconContainer}>
//                 <Ionicons
//                   name="images-outline"
//                   size={40}
//                   color={colors.primary}
//                 />
//               </View>
//               <Text style={styles.selectText}>Choose from Gallery</Text>
//             </TouchableOpacity>

//             <View style={styles.divider}>
//               <View style={styles.dividerLine} />
//               <Text style={styles.dividerText}>OR</Text>
//               <View style={styles.dividerLine} />
//             </View>

//             <TouchableOpacity style={styles.selectOption} onPress={recordVideo}>
//               <View style={styles.selectIconContainer}>
//                 <Ionicons
//                   name="videocam-outline"
//                   size={40}
//                   color={colors.primary}
//                 />
//               </View>
//               <Text style={styles.selectText}>Record Video</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Caption Input */}
//         <View style={styles.captionContainer}>
//           <Text style={styles.captionLabel}>Caption</Text>
//           <TextInput
//             style={styles.captionInput}
//             placeholder="Write a caption..."
//             placeholderTextColor={colors.textSecondary}
//             value={caption}
//             onChangeText={setCaption}
//             multiline
//             maxLength={2200}
//           />
//           <Text style={styles.charCount}>{caption.length}/2200</Text>
//         </View>

//         {/* Upload Progress */}
//         {loading && (
//           <View style={styles.progressContainer}>
//             <View style={styles.progressBar}>
//               <View
//                 style={[styles.progressFill, { width: `${uploadProgress}%` }]}
//               />
//             </View>
//             <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
//           </View>
//         )}

//         {/* Upload Button */}
//         <TouchableOpacity
//           style={[
//             styles.uploadButton,
//             (!videoUri || loading) && styles.uploadButtonDisabled,
//           ]}
//           onPress={handleUpload}
//           disabled={!videoUri || loading}
//           activeOpacity={0.8}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <>
//               <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
//               <Text style={styles.uploadButtonText}>Share Reel</Text>
//             </>
//           )}
//         </TouchableOpacity>

//         {/* Tips */}
//         <View style={styles.tipsContainer}>
//           <Text style={styles.tipsTitle}>Tips for great Reels:</Text>
//           <Text style={styles.tipItem}>• Keep it under 60 seconds</Text>
//           <Text style={styles.tipItem}>• Use good lighting</Text>
//           <Text style={styles.tipItem}>• Film vertically (9:16)</Text>
//           <Text style={styles.tipItem}>• Add an engaging caption</Text>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//   },

//   /* Header */
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 20,
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//   },

//   /* Video Preview */
//   previewContainer: {
//     height: 400,
//     borderRadius: 16,
//     overflow: 'hidden',
//     backgroundColor: '#000',
//     marginBottom: 20,
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//   },
//   removeBtn: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: 16,
//   },
//   durationBadge: {
//     position: 'absolute',
//     bottom: 12,
//     right: 12,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   durationText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '600',
//   },

//   /* Select Video */
//   selectContainer: {
//     backgroundColor: colors.inputBackground,
//     borderRadius: 16,
//     padding: 24,
//     marginBottom: 20,
//     borderWidth: 2,
//     borderColor: colors.border,
//     borderStyle: 'dashed',
//   },
//   selectOption: {
//     alignItems: 'center',
//     paddingVertical: 16,
//   },
//   selectIconContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: `${colors.primary}15`,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   selectText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textPrimary,
//   },
//   divider: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 12,
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: colors.border,
//   },
//   dividerText: {
//     marginHorizontal: 16,
//     color: colors.textSecondary,
//     fontSize: 14,
//   },

//   /* Caption */
//   captionContainer: {
//     marginBottom: 20,
//   },
//   captionLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginBottom: 8,
//   },
//   captionInput: {
//     backgroundColor: colors.inputBackground,
//     borderRadius: 12,
//     padding: 14,
//     fontSize: 16,
//     color: colors.textPrimary,
//     minHeight: 100,
//     textAlignVertical: 'top',
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   charCount: {
//     textAlign: 'right',
//     color: colors.textSecondary,
//     fontSize: 12,
//     marginTop: 6,
//   },

//   /* Progress */
//   progressContainer: {
//     marginBottom: 20,
//   },
//   progressBar: {
//     height: 6,
//     backgroundColor: colors.border,
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: colors.primary,
//     borderRadius: 3,
//   },
//   progressText: {
//     textAlign: 'center',
//     color: colors.textSecondary,
//     fontSize: 13,
//     marginTop: 8,
//   },

//   /* Upload Button */
//   uploadButton: {
//     backgroundColor: colors.primary,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     marginBottom: 24,
//   },
//   uploadButtonDisabled: {
//     backgroundColor: '#A0CFFF',
//   },
//   uploadButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//     marginLeft: 8,
//   },

//   /* Tips */
//   tipsContainer: {
//     backgroundColor: colors.inputBackground,
//     borderRadius: 12,
//     padding: 16,
//   },
//   tipsTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: colors.textPrimary,
//     marginBottom: 10,
//   },
//   tipItem: {
//     fontSize: 13,
//     color: colors.textSecondary,
//     marginBottom: 6,
//     lineHeight: 20,
//   },
// });

// export default UploadScreen;








import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import colors from '../../theme/colors';
import { uploadReelWithPresign } from '../../api/reels.api';
import { ROUTES } from '../../navigation/routes.constants';
import { fetchReels } from '../../redux/slices/reelSlice';

const UploadScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [videoUri, setVideoUri] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ============================
     PICK VIDEO FROM GALLERY
  ============================ */
  const pickVideo = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need access to your gallery to upload videos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'], // ✅ New expo-image-picker API
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60, // Max 60 seconds for reels
      });

      console.log('📹 ImagePicker result:', result);

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];

        // Validate video (check type or mimeType)
        const isVideo =
          asset.type === 'video' ||
          asset.mimeType?.startsWith('video') ||
          asset.uri?.match(/\.(mp4|mov|mkv|avi)$/i);

        if (!isVideo) {
          Alert.alert('Invalid file', 'Please select a video file.');
          return;
        }

        // Check duration (max 60 seconds) - duration is in milliseconds
        if (asset.duration && asset.duration > 60000) {
          Alert.alert(
            'Video too long',
            'Reels can be up to 60 seconds. Please select a shorter video.'
          );
          return;
        }

        setVideoUri(asset.uri);
        setVideoDuration(asset.duration ? asset.duration / 1000 : 0);
        console.log('✅ Video selected:', asset.uri);
      }
    } catch (error) {
      console.error('❌ pickVideo error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  /* ============================
     RECORD VIDEO
  ============================ */
  const recordVideo = async () => {
    try {
      const { status } =
        await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need camera access to record videos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'], // ✅ New expo-image-picker API
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      console.log('📹 Camera result:', result);

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setVideoUri(asset.uri);
        setVideoDuration(asset.duration ? asset.duration / 1000 : 0);
        console.log('✅ Video recorded:', asset.uri);
      }
    } catch (error) {
      console.error('❌ recordVideo error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  /* ============================
     UPLOAD REEL
  ============================ */
  const handleUpload = async () => {
    if (!videoUri) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (actual progress would need XHR)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const uploadedReel = await uploadReelWithPresign(videoUri, caption, videoDuration);

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('✅ Reel uploaded successfully:', uploadedReel);

      Alert.alert('Success', 'Reel uploaded successfully!', [
        {
          text: 'OK',
          onPress: async () => {
            // Reset form
            setVideoUri(null);
            setCaption('');
            setVideoDuration(0);

            // Refresh reels list to include the new reel
            await dispatch(fetchReels({ page: 1, refresh: true }));

            // Navigate back to Reels tab
            navigation.navigate(ROUTES.MAIN_TAB, {
              screen: ROUTES.REELS,
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        error?.response?.data?.message ||
          error.message ||
          'Could not upload video. Please try again.'
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  /* ============================
     CLEAR VIDEO
  ============================ */
  const clearVideo = () => {
    setVideoUri(null);
    setVideoDuration(0);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Reel</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Video Preview / Select */}
        {videoUri ? (
          <View style={styles.previewContainer}>
            <Video
              source={{ uri: videoUri }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
            <TouchableOpacity style={styles.removeBtn} onPress={clearVideo}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
            {videoDuration > 0 && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                  {Math.round(videoDuration)}s
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.selectContainer}>
            <TouchableOpacity style={styles.selectOption} onPress={pickVideo}>
              <View style={styles.selectIconContainer}>
                <Ionicons
                  name="images-outline"
                  size={40}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.selectText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.selectOption} onPress={recordVideo}>
              <View style={styles.selectIconContainer}>
                <Ionicons
                  name="videocam-outline"
                  size={40}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.selectText}>Record Video</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <Text style={styles.captionLabel}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor={colors.textSecondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
          />
          <Text style={styles.charCount}>{caption.length}/2200</Text>
        </View>

        {/* Upload Progress */}
        {loading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${uploadProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
          </View>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!videoUri || loading) && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={!videoUri || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
              <Text style={styles.uploadButtonText}>Share Reel</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for great Reels:</Text>
          <Text style={styles.tipItem}>• Keep it under 60 seconds</Text>
          <Text style={styles.tipItem}>• Use good lighting</Text>
          <Text style={styles.tipItem}>• Film vertically (9:16)</Text>
          <Text style={styles.tipItem}>• Add an engaging caption</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  /* Video Preview */
  previewContainer: {
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Select Video */
  selectContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  selectOption: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  selectIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },

  /* Caption */
  captionContainer: {
    marginBottom: 20,
  },
  captionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: {
    textAlign: 'right',
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },

  /* Progress */
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },

  /* Upload Button */
  uploadButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  uploadButtonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },

  /* Tips */
  tipsContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  tipItem: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default UploadScreen;