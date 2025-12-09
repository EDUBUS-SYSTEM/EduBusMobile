import { UserAvatar } from "@/components/UserAvatar";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { authApi } from "@/lib/auth/auth.api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ParentAccountScreen() {
  const { avatarUrl, loading: avatarLoading } = useUserAvatar();

  // Debug logging
  React.useEffect(() => {
    console.log('[ParentAccountScreen] Avatar state:', {
      hasUrl: !!avatarUrl,
      url: avatarUrl?.substring(0, 50) + '...',
      loading: avatarLoading,
    });
  }, [avatarUrl, avatarLoading]);

  const menuItems = [
    {
      id: 1,
      title: "Account profile",
      icon: "person-outline",
      description: "Account profile",
    },
    {
      id: 2,
      title: "School information",
      icon: "information-circle-outline",
      description: "School information",
    },
    {
      id: 3,
      title: "Absence Report",
      icon: "document-text-outline",
      description: "Absence Report",
    },
    {
      id: 4,
      title: "Register history",
      icon: "home-outline",
      description: "Register history",
    },
    {
      id: 5,
      title: "Trip report",
      icon: "stats-chart-outline",
      description: "Trips and attendance",
    },
    {
      id: 6,
      title: "Help",
      icon: "help-circle-outline",
      description: "Help",
    },
    {
      id: 7,
      title: "Logout",
      icon: "log-out-outline",
      description: "Logout",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header Section with Yellow Circles Background */}
      <View
        style={{
          paddingTop: 40,
          paddingBottom: 40,
          paddingHorizontal: 24,
          position: "relative",
          minHeight: 200,
          backgroundColor: "transparent",
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
              top: -40,
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
              top: -30,
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
              top: -30,
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
              top: -40,
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
              top: -90,
              right: 180,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "#FCCF08",
              opacity: 1,
            }}
          />
          {/* Circle 5 - Bottom Right */}
          <View
            style={{
              position: "absolute",
              top: -90,
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

        {/* Logo */}
        <View
          style={{ alignItems: "flex-start", marginBottom: 0, marginTop: 0 }}
        >
          <Image
            source={require("@/assets/images/edubus_logo.png")}
            style={{ width: 150, height: 150 }}
            contentFit="contain"
          />
        </View>

        {/* Curved White Border */}
        <View
          style={{
            position: "absolute",
            bottom: -30,
            left: 0,
            right: 0,
            height: 40,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
        />
      </View>

      {/* Profile Section */}
      <View
        style={{
          alignItems: "center",
          marginTop: -45,
          marginBottom: 20,
        }}
      >
        {/* Avatar */}
        <View style={{ marginBottom: 12 }}>
          {!avatarLoading && <UserAvatar avatarUrl={avatarUrl} size={120} />}
          {avatarLoading && (
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#E0F7FA",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Ionicons name="person" size={60} color="#01CBCA" />
            </View>
          )}
        </View>

        {/* Parent Account Text */}
        <Text
          style={{
            fontFamily: "RobotoSlab-Bold",
            fontSize: 18,
            color: "#000000",
            textAlign: "center",
          }}
        >
          Parent
        </Text>
      </View>

      {/* Menu Items */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              {
                backgroundColor: "#E0F7FA",
                borderRadius: 25,
                paddingVertical: 16,
                paddingHorizontal: 20,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              },
              index === 0 && { marginTop: 0 },
            ]}
            onPress={async () => {
              if (item.id === 1) {
                router.push("/account-profile" as any);
                return;
              }
              if (item.id === 2) {
                router.push("/school-information" as any);
                return;
              }
              if (item.id === 3) {
                router.push("/application-comments" as any);
                return;
              }
              if (item.id === 4) {
                router.push("/register-history" as any);
                return;
              }
              if (item.id === 5) {
                router.push("/trip-report" as any);
                return;
              }
              if (item.id === 6) {
                router.push("/help" as any);
                return;
              }
              if (item.id === 7) {
                // Logout
                try {
                  await authApi.logout();
                } finally {
                  router.replace("/login");
                }
                return;
              }
              // Add more navigation logic for other menu items here
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 15,
              }}
            >
              <Ionicons name={item.icon as any} size={20} color="#01CBCA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 16,
                  color: "#000000",
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Regular",
                  fontSize: 12,
                  color: "#666",
                  marginTop: 2,
                }}
              >

                {item.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#01CBCA" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Navigation Bar Background */}
      <View
        style={{
          height: 80,
          backgroundColor: "#FFF9C4",
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: -1,
        }}
      >
        {/* Curved Pattern */}
        <View
          style={{
            position: "absolute",
            top: -20,
            left: 0,
            right: 0,
            height: 40,
            backgroundColor: "#FFF9C4",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
        />
      </View>
    </View>
  );
}
