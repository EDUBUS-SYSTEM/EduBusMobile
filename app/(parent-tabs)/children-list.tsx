import { useChildrenList } from "@/hooks/useChildren";
import { childrenApi } from "@/lib/parent/children.api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TermsModal from "@/components/FaceRegistration/TermsModal";

export default function ChildrenListScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedChildForFace, setSelectedChildForFace] = useState<any>(null);

  // Use API hook to fetch children data
  const { children: apiChildren, loading, error } = useChildrenList();

  // Format API data for UI or use fallback data
  const childrenData =
    apiChildren.length > 0
      ? apiChildren.map((child) => childrenApi.formatChildForUI(child))
      : [
          {
            id: "1",
            name: "Tran Minh Hieu",
            avatar: {
              uri: "https://cdn.vietnam.vn/wp-content/uploads/2024/08/HIEUTHUHAI-khien-ca-Hieu-thu-nhat-cung-noi-tieng.jpg",
            },
            studentId: "HS001",
            className: "1B",
            schoolName: "FPT School",
            address: "105 Xuan Dieu",
            status: "Being on the bus",
          },
          {
            id: "2",
            name: "Tran Quang Huy",
            avatar: {
              uri: "https://www.elle.vn/wp-content/uploads/2024/01/21/567142/HIEUTHUHAI-3-scaled.jpg",
            },
            studentId: "HS002",
            className: "2A",
            schoolName: "FPT School",
            address: "105 Xuan Dieu",
            status: "At school",
          },
          {
            id: "3",
            name: "HIEUTHUHAI",
            avatar: {
              uri: "https://www.elle.vn/wp-content/uploads/2024/01/21/567142/HIEUTHUHAI-3-scaled.jpg",
            },
            studentId: "HS003",
            className: "3C",
            schoolName: "FPT School",
            address: "105 Xuan Dieu",
            status: "At home",
          },
        ];

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? childrenData.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === childrenData.length - 1 ? 0 : prev + 1
    );
  };

  const handleCardPress = () => {
    console.log("Card pressed, navigating to profile with:", currentChild);
    router.push(
      `/children-profile?child=${encodeURIComponent(
        JSON.stringify(currentChild)
      )}`
    );
  };

  const handleFaceRegister = (child: any) => {
    setSelectedChildForFace(child);
    setShowTermsModal(true);
  };

  const handleAgreeTerms = () => {
    setShowTermsModal(false);
    // Navigate to face registration screen
    router.push({
      pathname: "/face-registration",
      params: {
        childId: selectedChildForFace.studentId,
        childName: selectedChildForFace.name,
      },
    } as any);
  };

  const currentChild = childrenData[currentIndex];

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ fontSize: 18, color: "#000000" }}>
          Loading children...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    console.error("API Error:", error);
    // Continue with fallback data instead of showing error
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCDC44" />
      {/* Header Section with Yellow Circles */}

      <View
        style={{
          paddingTop: 80,
          paddingBottom: 60,
          paddingHorizontal: 24,
          position: "relative",
          minHeight: 250,
        }}
      >
        {/* Yellow Circles Background */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {/* Circle 1 - Top Left */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: -100,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />

          {/* Circle 2 - Top Right */}
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 40,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />

          {/* Circle 3 - Bottom Left */}
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 180,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 320,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FDE370",
              opacity: 1,
            }}
          />

          {/* Circle 4 - Bottom Right */}
          <View
            style={{
              position: "absolute",
              top: -80,
              right: 180,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
          <Image
            source={require("../../assets/images/edubus_logo.png")}
            style={styles.logo}
          />
          {/* Circle 5 - Bottom Right */}
          <View
            style={{
              position: "absolute",
              top: -80,
              right: 40,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
          {/* Circle 6 - Bottom Right */}
          <View
            style={{
              position: "absolute",
              top: -90,
              right: 320,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: -90,
              right: -100,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Main content card */}
        <View style={styles.mainCard}>
          <TouchableOpacity
            onPress={handleCardPress}
            activeOpacity={0.8}
            style={{ alignItems: "center", width: "80%" }}
          >
            <Image source={currentChild.avatar} style={styles.childImage} />
            <Text style={styles.childName}>{currentChild.name}</Text>
          </TouchableOpacity>

          {/* Navigation and Face Register buttons */}
          <View style={{ width: "50%", gap: 12 }}>
            {/* Navigation arrows */}
            <View style={styles.navRow}>
              <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Face Register button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#01CBCA",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
              onPress={() => handleFaceRegister(currentChild)}
            >
              <Ionicons name="camera" size={18} color="#FFFFFF" />
              <Text
                style={{
                  fontFamily: "RobotoSlab-Medium",
                  fontSize: 14,
                  color: "#FFFFFF",
                  marginLeft: 8,
                }}
              >
                Face Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Terms Modal */}
      <TermsModal
        visible={showTermsModal}
        childName={selectedChildForFace?.name || ""}
        onAgree={handleAgreeTerms}
        onCancel={() => setShowTermsModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 50,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    zIndex: 1,
  },
  mainCard: {
    backgroundColor: "#FFF8CF",
    borderRadius: 20,
    marginHorizontal: 19,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  childImage: {
    width: 240,
    height: 240,
    borderRadius: 12,
    resizeMode: "cover",
    marginBottom: 12,
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 80,
    width: "100%",
  },
  navBtn: {
    backgroundColor: "#FCCF08",
    borderRadius: 20,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
});
