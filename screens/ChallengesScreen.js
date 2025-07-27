import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChallengesScreen = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [challengeName, setChallengeName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [duration, setDuration] = useState('4');
  const [penaltyType, setPenaltyType] = useState('burpees');

  // Mock data for challenges
  const challenges = [
    {
      id: 1,
      name: 'Weekend Warriors',
      partner: 'Alex',
      status: 'active',
      daysLeft: 3,
      progress: 75,
      penalty: 25,
      type: 'burpees',
      startDate: '2024-01-15',
    },
    {
      id: 2,
      name: 'Summer Shred',
      partner: 'Sarah',
      status: 'active',
      daysLeft: 12,
      progress: 45,
      penalty: 12,
      type: 'miles',
      startDate: '2024-01-10',
    },
    {
      id: 3,
      name: 'New Year Resolution',
      partner: 'Mike',
      status: 'completed',
      daysLeft: 0,
      progress: 100,
      penalty: 0,
      type: 'burpees',
      startDate: '2024-01-01',
    },
  ];

  const penaltyTypes = [
    { id: 'burpees', name: 'Burpees', icon: 'fitness', color: '#FF6B35' },
    { id: 'miles', name: 'Miles Run', icon: 'walk', color: '#4CAF50' },
    {
      id: 'calories',
      name: 'Calories Burned',
      icon: 'flame',
      color: '#FF9800',
    },
    { id: 'steps', name: 'Steps', icon: 'footsteps', color: '#2196F3' },
  ];

  const renderChallengeCard = challenge => (
    <TouchableOpacity key={challenge.id} style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeName}>{challenge.name}</Text>
          <View style={styles.partnerBadge}>
            <Ionicons name="person" size={12} color="#FF6B35" />
            <Text style={styles.partnerText}>{challenge.partner}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                challenge.status === 'active' ? '#4CAF50' : '#8E8E93',
            },
          ]}
        >
          <Text style={styles.statusText}>
            {challenge.status === 'active' ? 'Active' : 'Completed'}
          </Text>
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
          <Text style={styles.statText}>
            {challenge.daysLeft > 0
              ? `${challenge.daysLeft} days left`
              : 'Completed'}
          </Text>
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

  const renderPenaltyType = type => (
    <TouchableOpacity
      key={type.id}
      style={[
        styles.penaltyTypeButton,
        penaltyType === type.id && styles.penaltyTypeSelected,
      ]}
      onPress={() => setPenaltyType(type.id)}
    >
      <Ionicons
        name={type.icon}
        size={20}
        color={penaltyType === type.id ? '#FFF' : type.color}
      />
      <Text
        style={[
          styles.penaltyTypeText,
          penaltyType === type.id && styles.penaltyTypeTextSelected,
        ]}
      >
        {type.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Challenges</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Active Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          {challenges
            .filter(c => c.status === 'active')
            .map(renderChallengeCard)}
        </View>

        {/* Completed Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Challenges</Text>
          {challenges
            .filter(c => c.status === 'completed')
            .map(renderChallengeCard)}
        </View>
      </ScrollView>

      {/* Create Challenge Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Challenge</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Challenge Name</Text>
              <TextInput
                style={styles.input}
                value={challengeName}
                onChangeText={setChallengeName}
                placeholder="e.g., Weekend Warriors"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Partner's Email</Text>
              <TextInput
                style={styles.input}
                value={partnerEmail}
                onChangeText={setPartnerEmail}
                placeholder="partner@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (weeks)</Text>
              <View style={styles.durationButtons}>
                {['2', '4', '8'].map(weeks => (
                  <TouchableOpacity
                    key={weeks}
                    style={[
                      styles.durationButton,
                      duration === weeks && styles.durationButtonSelected,
                    ]}
                    onPress={() => setDuration(weeks)}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        duration === weeks && styles.durationButtonTextSelected,
                      ]}
                    >
                      {weeks} weeks
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Penalty Type</Text>
              <View style={styles.penaltyTypes}>
                {penaltyTypes.map(renderPenaltyType)}
              </View>
            </View>

            <TouchableOpacity style={styles.createChallengeButton}>
              <Text style={styles.createChallengeButtonText}>
                Create Challenge
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  challengeInfo: {
    flex: 1,
  },
  challengeName: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    backgroundColor: '#F8F9FA',
    flex: 1,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    elevation: 4,
    height: 40,
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 40,
  },
  createChallengeButton: {
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    elevation: 8,
    marginBottom: 40,
    marginTop: 20,
    paddingVertical: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createChallengeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  durationButton: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
  },
  durationButtonSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  durationButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  durationButtonTextSelected: {
    color: '#FFF',
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalContainer: {
    backgroundColor: '#F8F9FA',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  partnerBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
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
  penaltyTypeButton: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '48%',
  },
  penaltyTypeSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  penaltyTypeText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  penaltyTypeTextSelected: {
    color: '#FFF',
  },
  penaltyTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statText: {
    color: '#8E8E93',
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChallengesScreen;
