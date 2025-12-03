import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HelpScreen() {
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
          Quick guide for parents to use the EduBus app effectively.
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
              <Text style={styles.sectionTitle}>1. Sign in & profile</Text>
              <Text style={styles.sectionSubtitle}>How to start using the app</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Use the account provided by the school to sign in to the app.
            </Text>
            <Text style={styles.bulletItem}>
              • Open the <Text style={styles.highlight}>Account</Text> tab to view your profile and
              child information.
            </Text>
          </View>
        </View>

        {/* Section: Register service */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="clipboard-outline" size={22} color="#D08700" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>2. Register pick-up service</Text>
              <Text style={styles.sectionSubtitle}>How to create a new registration</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              1. From the <Text style={styles.highlight}>Home</Text> tab, tap{' '}
              <Text style={styles.highlight}>Register Service</Text>.
            </Text>
            <Text style={styles.bulletItem}>
              2. Select the student(s) you want to register and continue.
            </Text>
            <Text style={styles.bulletItem}>
              3. On the map screen, choose the pick-up location near your home and confirm.
            </Text>
            <Text style={styles.bulletItem}>
              4. Check the estimated fee for the semester and submit the request.
            </Text>
            <Text style={styles.bulletItem}>
              5. Wait for the school to review. You will receive a notification when the request is
              approved or rejected.
            </Text>
          </View>
        </View>

        {/* Section: View registration history */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="time-outline" size={22} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>3. View registration history</Text>
              <Text style={styles.sectionSubtitle}>Check past and current requests</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Go to <Text style={styles.highlight}>Account → Register history</Text>.
            </Text>
            <Text style={styles.bulletItem}>
              • Use the yellow chips at the top to switch between semesters.
            </Text>
            <Text style={styles.bulletItem}>
              • Each card shows pick-up address, student list, status (Pending / Approved /
              Rejected) and estimated fee.
            </Text>
          </View>
        </View>

        {/* Section: View trip schedule */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="calendar-outline" size={22} color="#4CAF50" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>4. View today&apos;s trips</Text>
              <Text style={styles.sectionSubtitle}>Where to see the bus schedule</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • From <Text style={styles.highlight}>Home</Text>, tap{' '}
              <Text style={styles.highlight}>Trips Today</Text>.
            </Text>
            <Text style={styles.bulletItem}>
              • You will see the trips assigned to your child for today, including pick-up time and
              route.
            </Text>
            <Text style={styles.bulletItem}>
              • Tap on a trip to view more details and stop information.
            </Text>
          </View>
        </View>

        {/* Section: Payments */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="wallet-outline" size={22} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>5. Payments & invoices</Text>
              <Text style={styles.sectionSubtitle}>Track tuition & transport fees</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Open the <Text style={styles.highlight}>Payments</Text> tab at the bottom.
            </Text>
            <Text style={styles.bulletItem}>
              • View pending and completed payments for transport service.
            </Text>
            <Text style={styles.bulletItem}>
              • Tap on an item to see payment details and status.
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
              <Text style={styles.sectionTitle}>6. Notifications & support</Text>
              <Text style={styles.sectionSubtitle}>Stay updated and get help</Text>
            </View>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Tap <Text style={styles.highlight}>Notifications</Text> in the bottom bar to see
              important updates from the school (trip changes, delays, approvals, etc.).
            </Text>
            <Text style={styles.bulletItem}>
              • If you need support, please contact the school via the official channels provided
              by the school.
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


