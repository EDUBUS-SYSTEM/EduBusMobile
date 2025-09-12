import { useRegistrationInfo } from "@/hooks/useRegistration";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  // Dimensions,
} from "react-native";

// const { width } = Dimensions.get('window'); // Unused for now

export default function RegistrationReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const registrationId = params.registrationId as string;
  
  const { info, loading, error } = useRegistrationInfo(registrationId);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleConfirm = () => {
    Alert.alert(
      "Confirm Payment",
      `Are you sure you want to pay ${info?.pricing.estimatedPrice.toLocaleString()} VND for student transportation service?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            setIsConfirming(true);
            // Navigate to payment screen
            router.push({
              pathname: "/payment",
              params: {
                registrationId: registrationId,
                amount: info?.pricing.estimatedPrice.toString(),
                description: "Student Transportation Service Payment",
              },
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading information...</Text>
      </SafeAreaView>
    );
  }

  if (error || !info) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Cannot load registration information</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header - Smaller */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registration Review</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section - White background with larger logo */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image
                source={require("../assets/images/edubus_logo.png")}
                style={styles.logo}
              />
            </View>
            <Text style={styles.heroTitle}>Registration Information</Text>
            <Text style={styles.heroSubtitle}>EduBus - Student Transportation Service</Text>
          </View>
        </View>

        {/* Parent Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color="#01CBCA" />
            <Text style={styles.cardTitle}>Parent Information</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name:</Text>
              <Text style={styles.infoValue}>{info.parentName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{info.parentEmail}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{info.phoneNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{info.address}</Text>
            </View>
          </View>
        </View>

        {/* Pickup Point Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color="#01CBCA" />
            <Text style={styles.cardTitle}>Pickup Point</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{info.pickupPoint.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Distance:</Text>
              <Text style={styles.infoValue}>{info.pickupPoint.distanceKm} km</Text>
            </View>
            {info.pickupPoint.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Note:</Text>
                <Text style={styles.infoValue}>{info.pickupPoint.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Students Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={24} color="#01CBCA" />
            <Text style={styles.cardTitle}>Students</Text>
          </View>
          <View style={styles.cardContent}>
            {info.students.map((student, index) => (
              <View key={student.id} style={styles.studentItem}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentDetails}>
                    {student.studentId} - {student.className} - {student.schoolName}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color="#01CBCA" />
            <Text style={styles.cardTitle}>Service Cost</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Rate per km:</Text>
              <Text style={styles.pricingValue}>
                {info.pricing.unitPricePerKm.toLocaleString()} VND
              </Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Distance:</Text>
              <Text style={styles.pricingValue}>{info.pricing.distanceKm} km</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Number of students:</Text>
              <Text style={styles.pricingValue}>{info.students.length} students</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {info.pricing.estimatedPrice.toLocaleString()} VND
              </Text>
            </View>
          </View>
        </View>

        {/* Expiry Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="time" size={20} color="#FF9800" />
          <Text style={styles.noticeText}>
            This registration will expire on {new Date(info.expiresAt).toLocaleDateString('en-US')}
          </Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={isConfirming}
        >
          <LinearGradient
            colors={['#FFF8CF', '#F5E6A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmButtonGradient}
          >
            <Ionicons name="card" size={24} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>
              {isConfirming ? "Processing..." : "Confirm Payment"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#666666",
    fontFamily: "RobotoSlab-Regular",
  },
  errorText: {
    fontSize: 18,
    color: "#FF5722",
    fontFamily: "RobotoSlab-Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#01CBCA",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#000000",
    fontFamily: "RobotoSlab-Medium",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18, // Smaller header
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    marginHorizontal: -20,
    paddingVertical: 30, // Smaller padding
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#FFFFFF", // White background
  },
  logoContainer: {
    alignItems: "center",
  },
  logoBackground: {
    width: 120, // Larger logo background
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF8CF", // Card color
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 100, // Larger logo
    height: 80,
    resizeMode: "contain",
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Regular",
    color: "rgba(0, 0, 0, 0.7)",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFF8CF", // Card color
    borderRadius: 20,
    marginBottom: 25,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 25,
    paddingBottom: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
    marginLeft: 15,
  },
  cardContent: {
    padding: 25,
    paddingTop: 0,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Medium",
    color: "#666666",
    width: 100,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Regular",
    color: "#000000",
    flex: 1,
  },
  studentItem: {
    marginBottom: 15,
  },
  studentInfo: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
  },
  studentName: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
    marginBottom: 5,
  },
  studentDetails: {
    fontSize: 14,
    fontFamily: "RobotoSlab-Regular",
    color: "#666666",
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  pricingLabel: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Regular",
    color: "#666666",
  },
  pricingValue: {
    fontSize: 16,
    fontFamily: "RobotoSlab-Medium",
    color: "#000000",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
  },
  totalValue: {
    fontSize: 20,
    fontFamily: "RobotoSlab-Bold",
    color: "#D4A574",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  noticeText: {
    fontSize: 14,
    fontFamily: "RobotoSlab-Regular",
    color: "#F57C00",
    marginLeft: 10,
    flex: 1,
  },
  confirmButton: {
    marginBottom: 30,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 30,
    backgroundColor: "#FCCF08", // Button color
    shadowColor: "#FCCF08",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmButtonText: {
    color: "#000000",
    fontFamily: "RobotoSlab-Bold",
    fontSize: 20,
    marginLeft: 12,
  },
});
