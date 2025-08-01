import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

const ProfileScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // Mock user data
  const user = {
    name: 'Michael Tillcock',
    email: 'michael@golflists.com',
    avatar: '👨‍💻',
    streak: 7,
    totalBurpees: 150,
    challengesWon: 3,
    challengesLost: 1,
  };

  const achievements = [
    {
      id: 1,
      name: 'First Challenge',
      icon: 'trophy',
      color: '#FFD700',
      unlocked: true,
    },
    {
      id: 2,
      name: '7 Day Streak',
      icon: 'flame',
      color: '#FF6B35',
      unlocked: true,
    },
    {
      id: 3,
      name: '100 Burpees',
      icon: 'fitness',
      color: '#4CAF50',
      unlocked: true,
    },
    {
      id: 4,
      name: 'Perfect Week',
      icon: 'star',
      color: '#9C27B0',
      unlocked: false,
    },
  ];

  const settings = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      icon: 'notifications',
      type: 'switch',
      value: notificationsEnabled,
      onValueChange: setNotificationsEnabled,
    },
    {
      id: 'darkMode',
      title: 'Dark Mode',
      icon: 'moon',
      type: 'switch',
      value: darkModeEnabled,
      onValueChange: setDarkModeEnabled,
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      icon: 'shield-checkmark',
      type: 'navigate',
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle',
      type: 'navigate',
    },
    {
      id: 'about',
      title: 'About BurpeeBet',
      icon: 'information-circle',
      type: 'navigate',
    },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', error.message);
      }
      // The AppNavigator will automatically redirect to auth screen
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const renderAchievement = achievement => (
    <View key={achievement.id} style={styles.achievementCard}>
      <View
        style={[
          styles.achievementIcon,
          {
            backgroundColor: achievement.unlocked
              ? achievement.color
              : '#E5E5EA',
          },
        ]}
      >
        <Ionicons
          name={achievement.icon}
          size={24}
          color={achievement.unlocked ? '#FFF' : '#8E8E93'}
        />
      </View>
      <Text
        style={[
          styles.achievementName,
          { color: achievement.unlocked ? '#1A1A1A' : '#8E8E93' },
        ]}
      >
        {achievement.name}
      </Text>
    </View>
  );

  const renderSetting = setting => (
    <TouchableOpacity key={setting.id} style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons
          name={setting.icon}
          size={20}
          color="#8E8E93"
          style={styles.settingIcon}
        />
        <Text style={styles.settingTitle}>{setting.title}</Text>
      </View>
      {setting.type === 'switch' ? (
        <Switch
          value={setting.value}
          onValueChange={setting.onValueChange}
          trackColor={{ false: '#E5E5EA', true: '#FF6B35' }}
          thumbColor={setting.value ? '#FFF' : '#FFF'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{user.avatar}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#FF6B35" />
            <Text style={styles.statNumber}>{user.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="fitness" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>{user.totalBurpees}</Text>
            <Text style={styles.statLabel}>Total Burpees</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>{user.challengesWon}</Text>
            <Text style={styles.statLabel}>Challenges Won</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map(renderAchievement)}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsContainer}>
            {settings.map(renderSetting)}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>BurpeeBet v1.0.0</Text>
          <Text style={styles.appTagline}>
            "Miss your macros? Your buddy pays the price!"
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  achievementCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '48%',
  },
  achievementIcon: {
    alignItems: 'center',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    marginBottom: 8,
    width: 50,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appTagline: {
    color: '#8E8E93',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  appVersion: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  avatar: {
    fontSize: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF5F2',
    borderRadius: 40,
    elevation: 4,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: 80,
  },
  container: {
    backgroundColor: '#F8F9FA',
    flex: 1,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginBottom: 20,
    paddingVertical: 30,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingItem: {
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  settingTitle: {
    color: '#1A1A1A',
    fontSize: 16,
  },
  settingsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
  },
  statNumber: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  userEmail: {
    color: '#8E8E93',
    fontSize: 14,
  },
  userName: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default ProfileScreen;
