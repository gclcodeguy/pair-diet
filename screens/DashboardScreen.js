import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DashboardScreen = () => {
  const [currentStreak, setCurrentStreak] = useState(7);
  const [totalBurpees, setTotalBurpees] = useState(150);
  const [activeChallenges, setActiveChallenges] = useState(2);

  // Mock data for active challenges
  const challenges = [
    {
      id: 1,
      name: 'Weekend Warriors',
      partner: 'Alex',
      daysLeft: 3,
      progress: 75,
      penalty: 25,
      type: 'burpees',
    },
    {
      id: 2,
      name: 'Summer Shred',
      partner: 'Sarah',
      daysLeft: 12,
      progress: 45,
      penalty: 12,
      type: 'miles',
    },
  ];

  const renderChallengeCard = challenge => (
    <TouchableOpacity key={challenge.id} style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeName}>{challenge.name}</Text>
        <View style={styles.partnerBadge}>
          <Ionicons name="person" size={12} color="#FF6B35" />
          <Text style={styles.partnerText}>{challenge.partner}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${challenge.progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{challenge.progress}%</Text>
      </View>

      <View style={styles.challengeStats}>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#8E8E93" />
          <Text style={styles.statText}>{challenge.daysLeft} days left</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="fitness" size={16} color="#FF6B35" />
          <Text style={styles.statText}>
            {challenge.penalty} {challenge.type}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with streak */}
        <View style={styles.header}>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={24} color="#FF6B35" />
            <Text style={styles.streakText}>{currentStreak} day streak!</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="fitness" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{totalBurpees}</Text>
            <Text style={styles.statLabel}>Total Burpees</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="trophy" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statNumber}>{activeChallenges}</Text>
            <Text style={styles.statLabel}>Active Challenges</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="trending-up" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Active Challenges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {challenges.map(renderChallengeCard)}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add-circle" size={24} color="#FF6B35" />
              <Text style={styles.actionText}>New Challenge</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="restaurant" size={24} color="#FF6B35" />
              <Text style={styles.actionText}>Log Food</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="fitness" size={24} color="#FF6B35" />
              <Text style={styles.actionText}>Log Exercise</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivation Quote */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            "Miss your macros? Your buddy pays the price! 💪"
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
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
  actionText: {
    color: '#1A1A1A',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  challengeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeName: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    backgroundColor: '#F8F9FA',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  motivationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 20,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  motivationText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  notificationButton: {
    padding: 8,
  },
  partnerBadge: {
    alignItems: 'center',
    backgroundColor: '#FFF5F2',
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  partnerText: {
    color: '#FF6B35',
    fontSize: 12,
    marginLeft: 4,
  },
  progressBar: {
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    flex: 1,
    height: 8,
    marginRight: 12,
  },
  progressContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  progressFill: {
    backgroundColor: '#FF6B35',
    borderRadius: 4,
    height: '100%',
  },
  progressText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
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
  statIcon: {
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
  },
  statNumber: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statText: {
    color: '#8E8E93',
    fontSize: 12,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  streakContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    elevation: 4,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  streakText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DashboardScreen;
