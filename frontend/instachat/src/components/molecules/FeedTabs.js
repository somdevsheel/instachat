import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const TABS = [
  { key: 'for_you', label: 'For you' },
  { key: 'following', label: 'Following' },
  { key: 'close_friends', label: 'Close Friends' },
];

const FeedTabs = ({ activeFilter, onChange, onManagePress }) => {
  return (
    <View style={styles.row}>
      <View style={styles.pills}>
        {TABS.map((tab) => {
          const active = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChange(tab.key)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.manageBtn}
        onPress={onManagePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

export default FeedTabs;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  pills: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  manageBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
