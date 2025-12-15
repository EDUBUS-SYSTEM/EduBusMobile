import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const options = {
  headerShown: false,
};

export default function HelpSupervisorScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Guide</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          Quick guide for supervisors to manage routes, trips, and drivers.
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Section: Getting started */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="person-circle-outline" size={22} color="#01CBCA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>1. Sign in & dashboard</Text>
              <Text style={styles.sectionSubtitle}>Overview of operations</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Sign in with your supervisor account provided by the school.
            </Text>
            <Text style={styles.bulletItem}>
              • The <Text style={styles.highlight}>Dashboard</Text> shows today&apos;s routes, active trips, and pending items.
            </Text>
            <Text style={styles.bulletItem}>
              • Check <Text style={styles.highlight}>Notifications</Text> for alerts from drivers or system updates.
            </Text>
          </View>
        </View>

        {/* Section: Monitor trips */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="map-outline" size={22} color="#4CAF50" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>2. Monitor trips</Text>
              <Text style={styles.sectionSubtitle}>Track live and scheduled trips</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Open <Text style={styles.highlight}>Dashboard</Text> or <Text style={styles.highlight}>Trip Schedule</Text> to see assigned routes.
            </Text>
            <Text style={styles.bulletItem}>
              • Check trip status (Scheduled / In-progress / Completed) and timings.
            </Text>
            <Text style={styles.bulletItem}>
              • Tap a trip to view stops, assigned driver, vehicle, and students.
            </Text>
          </View>
        </View>

        {/* Section: Vehicles & assignments */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="car-outline" size={22} color="#D08700" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>3. Vehicles & assignments</Text>
              <Text style={styles.sectionSubtitle}>Check vehicle and driver pairing</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Go to <Text style={styles.highlight}>Vehicle</Text> tab to review vehicle details and capacity.
            </Text>
            <Text style={styles.bulletItem}>
              • Verify assigned driver and the list of students per vehicle.
            </Text>
          </View>
        </View>

        {/* Section: Handle driver leave */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="calendar-outline" size={22} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>4. Driver leave requests</Text>
              <Text style={styles.sectionSubtitle}>Review and plan coverage</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Check <Text style={styles.highlight}>Leave requests</Text> submitted by drivers.
            </Text>
            <Text style={styles.bulletItem}>
              • Approve or coordinate substitutes to keep trips covered.
            </Text>
          </View>
        </View>

        {/* Section: Notifications & support */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="notifications-outline" size={22} color="#FB7185" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>5. Notifications & issues</Text>
              <Text style={styles.sectionSubtitle}>Stay updated and respond</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Open <Text style={styles.highlight}>Notifications</Text> to see alerts about delays, incidents, or approvals.
            </Text>
            <Text style={styles.bulletItem}>
              • If an issue is reported, contact the driver or parent through your official channel.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FEFCE8',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#000000',
  },
  headerSubtitle: {
    marginTop: 4,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#111827',
  },
  sectionSubtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  bulletList: {
    marginTop: 4,
    gap: 4,
  },
  bulletItem: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#374151',
  },
  highlight: {
    fontFamily: 'RobotoSlab-Bold',
    color: '#D08700',
  },
});

