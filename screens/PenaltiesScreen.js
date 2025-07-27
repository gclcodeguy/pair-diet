import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PenaltiesScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock penalty data
  const penalties = [
    {
      id: 1,
      challengeName: 'Weekend Warriors',
      partner: 'Alex',
      type: 'burpees',
      total: 25,
      completed: 15,
      remaining: 10,
      dueDate: '2024-01-20',
      color: '#FF6B35',
      icon: 'fitness',
    },
    {
      id: 2,
      challengeName: 'Summer Shred',
      partner: 'Sarah',
      type: 'miles',
      total: 12,
      completed: 8,
      remaining: 4,
      dueDate: '2024-01-25',
      color: '#4CAF50',
      icon: 'walk',
    },
    {
      id: 3,
      challengeName: 'New Year Resolution',
      partner: 'Mike',
      type: 'calories',
      total: 500,
      completed: 500,
      remaining: 0,
      dueDate: '2024-01-15',
      color: '#FF9800',
      icon: 'flame',
    },
  ];

  const filters = [
    { id: 'all', name: 'All', icon: 'list' },
    { id: 'burpees', name: 'Burpees', icon: 'fitness' },
    { id: 'miles', name: 'Miles', icon: 'walk' },
    { id: 'calories', name: 'Calories', icon: 'flame' },
  ];

  const filteredPenalties =
    selectedFilter === 'all'
      ? penalties
      : penalties.filter(p => p.type === selectedFilter);

  const totalRemaining = penalties.reduce((sum, p) => sum + p.remaining, 0);
  const totalCompleted = penalties.reduce((sum, p) => sum + p.completed, 0);

  const renderFilterButton = filter => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterButton,
        selectedFilter === filter.id && styles.filterButtonSelected,
      ]}
      onPress={() => setSelectedFilter(filter.id)}
    >
      <Ionicons
        name={filter.icon}
        size={16}
        color={selectedFilter === filter.id ? '#FFF' : '#8E8E93'}
      />
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter.id && styles.filterButtonTextSelected,
        ]}
      >
        {filter.name}
      </Text>
    </TouchableOpacity>
  );

  const renderPenaltyCard = ({ item }) => (
    <View style={styles.penaltyCard}>
      <View style={styles.penaltyHeader}>
        <View style={styles.penaltyInfo}>
          <Text style={styles.challengeName}>{item.challengeName}</Text>
          <View style={styles.partnerBadge}>
            <Ionicons name="person" size={12} color="#FF6B35" />
            <Text style={styles.partnerText}>{item.partner}</Text>
          </View>
        </View>
        <View
          style={[styles.penaltyTypeBadge, { backgroundColor: item.color }]}
        >
          <Ionicons name={item.icon} size={16} color="#FFF" />
          <Text style={styles.penaltyTypeText}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(item.completed / item.total) * 100}%`,
                backgroundColor: item.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: item.color }]}>
          {item.completed}/{item.total}
        </Text>
      </View>

      <View style={styles.penaltyStats}>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#8E8E93" />
          <Text style={styles.statText}>Due: {item.dueDate}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={16} color={item.color} />
          <Text style={[styles.statText, { color: item.color }]}>
            {item.remaining} remaining
          </Text>
        </View>
      </View>

      {item.remaining > 0 && (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: item.color }]}
        >
          <Ionicons name="checkmark" size={16} color="#FFF" />
          <Text style={styles.completeButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with summary */}
        <View style={styles.header}>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Total Penalties</Text>
            <Text style={styles.summaryNumber}>{totalRemaining}</Text>
            <Text style={styles.summarySubtitle}>remaining</Text>
          </View>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Completed</Text>
            <Text style={styles.summaryNumber}>{totalCompleted}</Text>
            <Text style={styles.summarySubtitle}>total</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.sectionTitle}>Filter by Type</Text>
          <View style={styles.filters}>{filters.map(renderFilterButton)}</View>
        </View>

        {/* Penalties List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Penalties</Text>
          <FlatList
            data={filteredPenalties}
            renderItem={renderPenaltyCard}
            keyExtractor={item => item.id.toString()}
            scrollEnabled={false}
          />
        </View>

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <Ionicons name="fitness" size={32} color="#FF6B35" />
          <Text style={styles.motivationTitle}>Time to Pay Up!</Text>
          <Text style={styles.motivationText}>
            Complete your penalties to stay accountable and keep your streak
            alive.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="fitness" size={24} color="#FF6B35" />
              <Text style={styles.actionText}>Log Burpees</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="walk" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Log Miles</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="flame" size={24} color="#FF9800" />
              <Text style={styles.actionText}>Log Calories</Text>
            </TouchableOpacity>
          </View>
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
  challengeName: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  completeButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  container: {
    backgroundColor: '#F8F9FA',
    flex: 1,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
  },
  filterButtonSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterButtonText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  filterButtonTextSelected: {
    color: '#FFF',
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filtersContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  motivationCard: {
    alignItems: 'center',
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
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  motivationTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
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
  penaltyCard: {
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
  penaltyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  penaltyInfo: {
    flex: 1,
  },
  penaltyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  penaltyTypeBadge: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  penaltyTypeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 4,
    height: '100%',
  },
  progressText: {
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
  summaryContainer: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    color: '#1A1A1A',
    fontSize: 28,
    fontWeight: 'bold',
  },
  summarySubtitle: {
    color: '#8E8E93',
    fontSize: 12,
  },
  summaryTitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
});

export default PenaltiesScreen;
