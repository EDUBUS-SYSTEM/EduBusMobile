import { AuthenticatedImage } from "@/components/AuthenticatedImage";
import { userAccountApi, UserResponse } from "@/lib/userAccount/userAccount.api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { formatDate } from "@/utils/date.utils";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [token, cachedFullName] = await AsyncStorage.multiGet([
        "accessToken",
        "userFullName",
      ]);
      if (cachedFullName[1]) setFullName(cachedFullName[1]);

      const accessToken = token[1];
      if (!accessToken) return;

      const payload: any = decodeJwtPayload(accessToken);
      const userId: string | undefined =
        payload?.nameid ||
        payload?.sub ||
        payload?.[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];
      if (!userId) return;

      const userData = await userAccountApi.getUserById(userId);
      setProfile(userData);

      const name = [userData.firstName, userData.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (name) setFullName(name);

      // Load avatar if exists
      if (userData.userPhotoFileId) {
        setAvatarUrl(userAccountApi.getAvatarUrl(userId));
      } else {
        setAvatarUrl(null);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need camera roll permissions to upload your avatar.");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadAvatar = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "Please login again.");
        return;
      }

      const payload: any = decodeJwtPayload(token);
      const userId: string | undefined =
        payload?.nameid ||
        payload?.sub ||
        payload?.[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];
      if (!userId) {
        Alert.alert("Error", "User ID not found.");
        return;
      }

      // Get file extension
      const uri = imageAsset.uri;
      const extension = uri.split(".").pop() || "jpg";
      const mimeType = `image/${extension === "jpg" || extension === "jpeg" ? "jpeg" : extension}`;

      await userAccountApi.uploadAvatar(userId, {
        uri,
        type: mimeType,
        name: `avatar.${extension}`,
      });

      // Reload profile to get updated avatar
      await loadProfile();
      Alert.alert("Success", "Avatar updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };


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
          {/* Avatar Container */}
          <View style={{ position: "relative", marginBottom: 15 }}>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploading || loading}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "#E0F7FA",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
                overflow: "hidden",
              }}
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#01CBCA" />
              ) : avatarUrl ? (
                <AuthenticatedImage
                  uri={avatarUrl}
                  size={120}
                  style={{ width: 120, height: 120, borderRadius: 60 }}
                  contentFit="cover"
                />
              ) : (
                <Text
                  style={{
                    fontFamily: "RobotoSlab-Bold",
                    fontSize: 48,
                    color: "#01CBCA",
                  }}
                >
                  {fullName
                    ? fullName
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2)
                    : "U"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Edit Icon Badge */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#01CBCA",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Ionicons name="pencil" size={18} color="#FFFFFF" />
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
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploading || loading}
            style={{ marginTop: 8 }}
          >
            <Text
              style={{
                fontFamily: "RobotoSlab-Medium",
                fontSize: 14,
                color: "#01CBCA",
                textDecorationLine: "underline",
              }}
            >

            </Text>
          </TouchableOpacity>
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
                ? formatDate(profile.dateOfBirth)
                : "—"}
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
