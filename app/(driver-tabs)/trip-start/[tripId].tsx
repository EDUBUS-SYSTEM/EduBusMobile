import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Params = { tripId?: string };

export default function TripStartScreen() {
  const { tripId } = useLocalSearchParams<Params>();

  const onStart = () => {
    Alert.alert('Reminder', 'Trip started. Drive safely!', [
      { 
        text: 'OK', 
        onPress: () => {
          if (tripId) {
            router.replace(`/(driver-tabs)/trip/${tripId}` as any);
          } else {
            router.back();
          }
        }
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFDD00", "#FFDD00"]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Before you start</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#FFDD00" />
            <Text style={styles.cardTitle}>Important notes</Text>
          </View>

          <View style={styles.noteRow}>
            <Ionicons name="alert" size={16} color="#FFDD00" />
            <Text style={styles.noteText}>Check vehicle condition: brakes, lights, horn, and tires.</Text>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="alert" size={16} color="#FFDD00" />
            <Text style={styles.noteText}>Confirm today’s route and pickup points.</Text>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="alert" size={16} color="#FFDD00" />
            <Text style={styles.noteText}>Ensure your phone has enough battery and internet.</Text>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="alert" size={16} color="#FFDD00" />
            <Text style={styles.noteText}>Arrive on time at the first pickup point.</Text>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="alert" size={16} color="#FFDD00" />
            <Text style={styles.noteText}>Drive carefully and follow traffic rules.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onStart}>
          <Text style={styles.primaryButtonText}>Start Trip</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'RobotoSlab-Bold',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFDD00',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    marginLeft: 8,
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#111827',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteText: {
    marginLeft: 8,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#FFDD00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
  },
});


