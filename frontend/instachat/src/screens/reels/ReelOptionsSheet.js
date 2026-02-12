import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ReelOptionsSheet = ({
  visible,
  onClose,
  isOwnReel,
  onDelete,
  onReport,
  onHide,
  onUnfollow,
  onCopyLink,
  onShare,
  username,
}) => {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDelete = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        'Delete Reel',
        'Are you sure you want to delete this reel? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: onDelete,
          },
        ]
      );
    }, 300);
  };

  const handleReport = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        'Report',
        'Why are you reporting this reel?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: "It's spam",
            onPress: () => onReport('spam'),
          },
          {
            text: "It's inappropriate",
            onPress: () => onReport('inappropriate'),
          },
          {
            text: 'Violence or dangerous',
            onPress: () => onReport('violence'),
          },
          {
            text: 'False information',
            onPress: () => onReport('false_info'),
          },
        ]
      );
    }, 300);
  };

  const handleUnfollow = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        'Unfollow',
        `Unfollow @${username}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unfollow',
            style: 'destructive',
            onPress: onUnfollow,
          },
        ]
      );
    }, 300);
  };

  const handleAction = (action) => {
    onClose();
    setTimeout(() => action(), 300);
  };

  // Options for own reels
  const ownReelOptions = [
    {
      icon: 'trash-outline',
      label: 'Delete',
      onPress: handleDelete,
      destructive: true,
    },
    {
      icon: 'share-outline',
      label: 'Share',
      onPress: () => handleAction(onShare),
    },
    {
      icon: 'link-outline',
      label: 'Copy Link',
      onPress: () => handleAction(onCopyLink),
    },
    {
      icon: 'analytics-outline',
      label: 'View Insights',
      onPress: () => handleAction(() => Alert.alert('Coming soon', 'Insights feature is coming soon!')),
    },
  ];

  // Options for other users' reels
  const otherUserOptions = [
    {
      icon: 'flag-outline',
      label: 'Report',
      onPress: handleReport,
      destructive: true,
    },
    {
      icon: 'person-remove-outline',
      label: `Unfollow @${username}`,
      onPress: handleUnfollow,
      destructive: true,
    },
    {
      icon: 'eye-off-outline',
      label: 'Not Interested',
      onPress: () => handleAction(onHide),
    },
    {
      icon: 'share-outline',
      label: 'Share',
      onPress: () => handleAction(onShare),
    },
    {
      icon: 'link-outline',
      label: 'Copy Link',
      onPress: () => handleAction(onCopyLink),
    },
    {
      icon: 'information-circle-outline',
      label: 'About this account',
      onPress: () => handleAction(() => Alert.alert('Coming soon', 'Account info feature is coming soon!')),
    },
  ];

  const options = isOwnReel ? ownReelOptions : otherUserOptions;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Title */}
              <Text style={styles.title}>
                {isOwnReel ? 'Reel Options' : 'More Options'}
              </Text>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.option}
                    onPress={option.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name={option.icon}
                        size={24}
                        color={option.destructive ? '#FF3B30' : colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          option.destructive && styles.destructiveText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background || '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary || '#8E8E93',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary || '#fff',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    paddingHorizontal: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border || '#38383A',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary || '#fff',
    marginLeft: 16,
    fontWeight: '500',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  cancelButton: {
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.inputBackground || '#2C2C2E',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary || '#007AFF',
  },
});

export default ReelOptionsSheet;
