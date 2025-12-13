import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const options = {
  headerShown: false,
};

export default function HelpDriverScreen() {
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
          Quick guide for drivers to operate daily trips in EduBus.
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
              <Text style={styles.sectionSubtitle}>Start your day</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Sign in with the driver account provided by the school.
            </Text>
            <Text style={styles.bulletItem}>
              • After login, you land on <Text style={styles.highlight}>Dashboard</Text> to see today&apos;s trips and quick stats.
            </Text>
            <Text style={styles.bulletItem}>
              • Check <Text style={styles.highlight}>Notifications</Text> for updates from supervisors.
            </Text>
          </View>
        </View>

        {/* Section: Start a trip */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="play-circle-outline" size={22} color="#4CAF50" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>2. Start a trip</Text>
              <Text style={styles.sectionSubtitle}>From dashboard to live trip</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              1. Open <Text style={styles.highlight}>Dashboard</Text> and tap the trip you want to run.
            </Text>
            <Text style={styles.bulletItem}>
              2. Review route details and tap <Text style={styles.highlight}>Start trip</Text>.
            </Text>
            <Text style={styles.bulletItem}>
              3. Confirm your current location if prompted, then follow the stop list.
            </Text>
          </View>
        </View>

        {/* Section: Manage stops & attendance */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="location-outline" size={22} color="#D08700" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>3. Stops & attendance</Text>
              <Text style={styles.sectionSubtitle}>Pickup / drop-off flow</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • In the trip view, each stop shows students, planned time, and status.
            </Text>
            <Text style={styles.bulletItem}>
              • Mark <Text style={styles.highlight}>Pickup</Text> / <Text style={styles.highlight}>Drop-off</Text> for each student; add notes if needed.
            </Text>
            <Text style={styles.bulletItem}>
              • Use the timeline to move through stops; the current stop is highlighted.
            </Text>
          </View>
        </View>

        {/* Section: Trip history */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="time-outline" size={22} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>4. Trip history</Text>
              <Text style={styles.sectionSubtitle}>Review past trips</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Go to <Text style={styles.highlight}>Account → Trip history</Text>.
            </Text>
            <Text style={styles.bulletItem}>
              • See completed trips with dates, route names, and statuses.
            </Text>
            <Text style={styles.bulletItem}>
              • Open a trip to review stop details and attendance notes.
            </Text>
          </View>
        </View>

        {/* Section: Leave requests */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="calendar-outline" size={22} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>5. Leave requests</Text>
              <Text style={styles.sectionSubtitle}>Plan time off</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Open <Text style={styles.highlight}>Account → Leave requests</Text>.
            </Text>
            <Text style={styles.bulletItem}>
              • Submit a new request with date range and reason.
            </Text>
            <Text style={styles.bulletItem}>
              • Track approval status from supervisors.
            </Text>
          </View>
        </View>

        {/* Section: Vehicle & checklist */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="car-outline" size={22} color="#01CBCA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>6. Vehicle info</Text>
              <Text style={styles.sectionSubtitle}>Vehicle assignment & students</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Use the <Text style={styles.highlight}>Vehicle</Text> tab to see your assigned bus, plate number, and capacity.
            </Text>
            <Text style={styles.bulletItem}>
              • View the list of students for the vehicle and related trip schedules.
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
              <Text style={styles.sectionTitle}>7. Notifications & issues</Text>
              <Text style={styles.sectionSubtitle}>Stay updated and report problems</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Check <Text style={styles.highlight}>Notifications</Text> tab for changes, delays, or approvals.
            </Text>
            <Text style={styles.bulletItem}>
              • If you encounter issues on a trip, inform your supervisor through the official channel your school provides.
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

