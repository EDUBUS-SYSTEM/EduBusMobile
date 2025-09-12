import { apiService } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type UserResponse = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  userPhotoFileId?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
};

function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export default function AccountProfileScreen() {
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log("🔍 Starting profile load...");
        
        const [token, cachedFullName] = await AsyncStorage.multiGet([
          "accessToken",
          "userFullName",
        ]);
        
        console.log("📱 Cached full name:", cachedFullName[1]);
        if (cachedFullName[1]) setFullName(cachedFullName[1]);

        const accessToken = token[1];
        console.log("🔑 Access token exists:", !!accessToken);
        if (!accessToken) {
          console.log("❌ No access token found");
          return;
        }

        const payload: any = decodeJwtPayload(accessToken);
        console.log("🔓 JWT payload:", payload);
        
        const userId: string | undefined =
          payload?.nameid ||
          payload?.sub ||
          payload?.[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ];
        
        console.log("👤 User ID from JWT:", userId);
        if (!userId) {
          console.log("❌ No user ID found in JWT");
          return;
        }

        console.log("🌐 Making API call to:", `/UserAccount/${userId}`);
        
        // Test API connection first
        try {
          console.log("🧪 Testing API connection...");
          const testResponse = await apiService.get<any>("/UserAccount");
          console.log("✅ API connection test successful:", testResponse);
        } catch (testError) {
          console.log("❌ API connection test failed:", testError);
        }
        
        const raw = await apiService.get<any>(
          `/UserAccount/${userId}`
        );
        console.log("📡 Raw API response:", JSON.stringify(raw, null, 2));

        const normalized: UserResponse = {
          id: raw.Id || raw.id,
          email: raw.Email || raw.email,
          firstName: raw.FirstName || raw.firstName,
          lastName: raw.LastName || raw.lastName,
          phoneNumber: raw.PhoneNumber || raw.phoneNumber,
          address: raw.Address || raw.address,
          dateOfBirth: raw.DateOfBirth || raw.dateOfBirth,
          gender: raw.Gender || raw.gender,
          userPhotoFileId: raw.UserPhotoFileId || raw.userPhotoFileId,
          createdAt: raw.CreatedAt || raw.createdAt,
          updatedAt: raw.UpdatedAt || raw.updatedAt,
          isDeleted: raw.IsDeleted || raw.isDeleted,
        };
        console.log("✅ Normalized profile:", JSON.stringify(normalized, null, 2));

        setProfile(normalized);
        const name = [normalized.firstName, normalized.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (name) setFullName(name);
        console.log("📝 Final full name:", name);
      } catch (error) {
        console.log("❌ Error loading profile:", error);
        console.log("❌ Error details:", JSON.stringify(error, null, 2));
      }
    };
    loadProfile();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#FFD700",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: "RobotoSlab-Bold",
              fontSize: 20,
              color: "#000000",
            }}
          >
            Account Profile
          </Text>

          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#FFD700",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="notifications" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Profile Avatar Section */}
        <View
          style={{ alignItems: "center", marginBottom: 20, marginTop: -20 }}
        >
          {/* Yellow Rings Background */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#FFD700",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 15,
            }}
          >
            {/* Middle Ring */}
            <View
              style={{
                width: 95,
                height: 95,
                borderRadius: 47.5,
                backgroundColor: "#FFEB3B",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Inner Ring */}
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: "#FFF59D",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Avatar */}
                <View
                  style={{
                    width: 55,
                    height: 55,
                    borderRadius: 27.5,
                    backgroundColor: "#E0F7FA",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <Ionicons name="person" size={28} color="#01CBCA" />
                </View>
              </View>
            </View>
          </View>
          <Text
            style={{
              fontFamily: "RobotoSlab-Bold",
              fontSize: 24,
              color: "#000000",
              textAlign: "center",
            }}
          >
            {fullName || "Account"}
          </Text>
        </View>

        {/* Profile Information Cards */}
        <View style={{ gap: 12, marginTop: -10 }}>
          {/* Email Card */}
          <View
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 15,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#E0F7FA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 15,
                }}
              >
                <Ionicons name="mail-outline" size={20} color="#01CBCA" />
              </View>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 16,
                  color: "#000000",
                }}
              >
                Email Address
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "RobotoSlab-Regular",
                fontSize: 16,
                color: "#666666",
                marginLeft: 55,
              }}
            >
              {profile?.email || "—"}
            </Text>
          </View>

          {/* Full Name Card */}
          <View
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 15,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#E0F7FA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 15,
                }}
              >
                <Ionicons name="person-outline" size={20} color="#01CBCA" />
              </View>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 16,
                  color: "#000000",
                }}
              >
                Full Name
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "RobotoSlab-Regular",
                fontSize: 16,
                color: "#666666",
                marginLeft: 55,
              }}
            >
              {fullName || "—"}
            </Text>
          </View>

          {/* Phone Number Card */}
          <View
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 15,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#E0F7FA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 15,
                }}
              >
                <Ionicons name="call-outline" size={20} color="#01CBCA" />
              </View>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 16,
                  color: "#000000",
                }}
              >
                Phone Number
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "RobotoSlab-Regular",
                fontSize: 16,
                color: "#666666",
                marginLeft: 55,
              }}
            >
              {profile?.phoneNumber || "—"}
            </Text>
          </View>

          {/* Address Card */}
          <View
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 15,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#E0F7FA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 15,
                }}
              >
                <Ionicons name="location-outline" size={20} color="#01CBCA" />
              </View>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 16,
                  color: "#000000",
                }}
              >
                Address
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "RobotoSlab-Regular",
                fontSize: 16,
                color: "#666666",
                marginLeft: 55,
              }}
            >
              {profile?.address || "—"}
            </Text>
          </View>

          {/* Date of Birth Card */}
          <View
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 15,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#E0F7FA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 15,
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#01CBCA" />
              </View>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 16,
                  color: "#000000",
                }}
              >
                Date of Birth
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "RobotoSlab-Regular",
                fontSize: 16,
                color: "#666666",
                marginLeft: 55,
              }}
            >
              {profile?.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString()
                : "—"}
            </Text>
          </View>

          {/* Gender Card */}
          <View
            style={{
              backgroundColor: "#F8F9FA",
              borderRadius: 15,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#E0F7FA",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 15,
                }}
              >
                <Ionicons name="person-outline" size={20} color="#01CBCA" />
              </View>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 16,
                  color: "#000000",
                }}
              >
                Gender
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "RobotoSlab-Regular",
                fontSize: 16,
                color: "#666666",
                marginLeft: 55,
              }}
            >
              {profile?.gender || "—"}
            </Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#01CBCA",
            borderRadius: 25,
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginTop: 15,
            marginBottom: 30,
            alignItems: "center",
            alignSelf: "center",
            width: "60%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontFamily: "RobotoSlab-Bold",
              fontSize: 16,
              color: "#FFFFFF",
            }}
          >
            Edit Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
