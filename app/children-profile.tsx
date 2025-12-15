import { StudentAvatar } from '@/components/StudentAvatar';
import { useChild } from "@/hooks/useChildren";
import { childrenApi } from "@/lib/parent/children.api";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChildrenProfileScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ChildrenProfileContent />
    </>
  );
}

function ChildrenProfileContent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const childParam = params.child;

  console.log("Received params:", params);
  console.log("Child param:", childParam);

  // Parse child data from params to get childId
  let childId: string | null = null;
  let fallbackData = null;

  try {
    if (childParam && typeof childParam === "string") {
      const parsedChild = JSON.parse(decodeURIComponent(childParam));
      childId = parsedChild.id;
      fallbackData = parsedChild;
      console.log("Parsed child ID:", childId);
    }
  } catch (error) {
    console.log("Error parsing child param:", error);
  }

  // Use API hook to fetch child data
  const { child: apiChild, loading, error } = useChild(childId);

  // Fallback data if no params are passed or API fails
  const defaultChildData = {
    id: "1",
    firstName: "Tran Minh",
    lastName: "Hieu",
    avatarUrl:
      "https://cdn.vietnam.vn/wp-content/uploads/2024/08/HIEUTHUHAI-khien-ca-Hieu-thu-nhat-cung-noi-tieng.jpg",
    studentImageId: null,
    parentId: "",
    className: "1B",
    schoolName: "FPT School",
    address: "105 Xuan Dieu",
  };

  // Determine which data to use
  let childData;
  if (loading) {
    // Show loading state
    childData = fallbackData
      ? childrenApi.formatChildForUI(fallbackData)
      : childrenApi.formatChildForUI(defaultChildData);
  } else if (apiChild) {
    // Use API data
    childData = childrenApi.formatChildForUI(apiChild);
  } else if (fallbackData) {
    // Use fallback from params - need to format it properly
    childData = childrenApi.formatChildForUI(fallbackData);
  } else {
    // Use default data
    childData = childrenApi.formatChildForUI(defaultChildData);
  }

  if (loading && !fallbackData) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ fontSize: 18, color: "#000000" }}>
          Loading student...
        </Text>
      </SafeAreaView>
    );
  }

  if (error && !fallbackData) {
    console.error("API Error:", error);
    // Continue with default data instead of showing error
  }

  const handleBack = () => {
    console.log("Back button pressed");
    router.push("/(parent-tabs)/children-list");
  };

  const handleNotification = () => {
    console.log("Notification button pressed");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Children Profile</Text>

        <TouchableOpacity
          onPress={handleNotification}
          style={styles.headerButton}
        >
          <Ionicons name="notifications" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Profile Picture with Yellow Rings */}
          <View style={styles.profileImageContainer}>
            <View style={styles.ringOuter}>
              <View style={styles.ringMiddle}>
                <View style={styles.ringInner}>
                  <StudentAvatar
                    studentId={childData.studentId}
                    studentName={childData.name}
                    studentImageId={childData.studentImageId}
                    size={130}
                    showBorder={false}
                    style={styles.profileImage}
                  />
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.studentName}>{childData.name}</Text>
          <Text style={styles.studentStatus}>( {childData.status} )</Text>
        </View>

        {/* Information Cards */}
        <View style={styles.cardsContainer}>
          {/* Class Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="people" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardText}>{childData.className}</Text>
            </View>
          </View>

          {/* School Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="business" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardText}>{childData.schoolName}</Text>
            </View>
          </View>

          {/* Address Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="location" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardText}>{childData.address}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 50, // Add padding at bottom for better scrolling
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 30,
    width: "100%",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCCF08",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#000000",
  },
  profileSection: {
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 50,
    width: "100%",
    paddingTop: 50,
  },
  profileImageContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  ringOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FDF0A7",
    alignItems: "center",
    justifyContent: "center",
  },
  ringMiddle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#FCDC44",
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    resizeMode: "cover",
  },
  studentName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
    textAlign: "center",
  },
  studentStatus: {
    fontSize: 19,
    color: "#463B3B",
    fontWeight: "500",
    textAlign: "center",
    fontStyle: "italic",
  },
  cardsContainer: {
    paddingHorizontal: 40,
    marginTop: 30,
    width: "100%",
  },
  infoCard: {
    flexDirection: "row",
    marginBottom: 25,
    marginHorizontal: 20,
    alignItems: "center",
  },
  cardIconContainer: {
    width: 50,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#01CBCA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTextContainer: {
    flex: 1,
    backgroundColor: "#FCDC44",
    borderRadius: 12,
    padding: 18,
    justifyContent: "center",
  },
  cardText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
});
