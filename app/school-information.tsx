import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import type { ImageSourcePropType } from "react-native";
import { useMemo, type ComponentProps, type ReactNode } from "react";

const placeholderLogo = require("@/assets/images/edubus_logo.png");

const buildDataUri = (base64?: string, contentType?: string) => {
  if (!base64 || !contentType) return undefined;
  const sanitizedBase64 = base64.replace(/\s/g, "");
  return `data:${contentType};base64,${sanitizedBase64}`;
};

export default function SchoolInformationScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SchoolInformationContent />
    </>
  );
}

function SchoolInformationContent() {
  const router = useRouter();
  const { schoolInfo, loading, error, refresh } = useSchoolInfo();

  const renderValueOrPlaceholder = (value?: string) =>
    value && value.trim().length > 0 ? value : "Updating soon";

  const normalizeUrl = (value?: string) => {
    if (!value) return undefined;
    return value.startsWith("http") ? value : `https://${value}`;
  };

  const heroLogoSource = useMemo<ImageSourcePropType>(() => {
    const dataUri = buildDataUri(
      schoolInfo?.logoImageBase64,
      schoolInfo?.logoImageContentType
    );
    if (dataUri) {
      return { uri: dataUri };
    }
    return placeholderLogo;
  }, [schoolInfo?.logoImageBase64, schoolInfo?.logoImageContentType]);

  const generalDetails = [
    {
      icon: "school-outline" as const,
      label: "School Name",
      value: renderValueOrPlaceholder(schoolInfo?.schoolName),
    },
    {
      icon: "ribbon-outline" as const,
      label: "Slogan",
      value: renderValueOrPlaceholder(
        schoolInfo?.slogan || schoolInfo?.shortDescription
      ),
    },
    {
      icon: "document-text-outline" as const,
      label: "Description",
      value: renderValueOrPlaceholder(schoolInfo?.shortDescription),
    },
    {
      icon: "location-outline" as const,
      label: "Full Address",
      value: renderValueOrPlaceholder(
        schoolInfo?.displayAddress || schoolInfo?.fullAddress
      ),
    },
  ];

  const contactDetails = [
    {
      icon: "call-outline" as const,
      label: "Hotline",
      value: renderValueOrPlaceholder(schoolInfo?.phoneNumber),
    },
    {
      icon: "mail-outline" as const,
      label: "Email",
      value: renderValueOrPlaceholder(schoolInfo?.email),
    },
    {
      icon: "globe-outline" as const,
      label: "Website",
      value: renderValueOrPlaceholder(schoolInfo?.website),
    },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleOpenWebsite = () => {
    const normalized = normalizeUrl(schoolInfo?.website);
    if (!normalized) return;
    Linking.openURL(normalized).catch(() => {
      // noop - best effort
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#F0F0F0",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
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
            School Information
          </Text>

          <TouchableOpacity
            onPress={refresh}
            disabled={loading}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#FFD700",
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Ionicons name="refresh" size={22} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={["#01CBCA"]}
            tintColor="#01CBCA"
          />
        }
      >
        <HeroCard
          name={renderValueOrPlaceholder(schoolInfo?.schoolName)}
          tagline={renderValueOrPlaceholder(
            schoolInfo?.slogan || schoolInfo?.shortDescription
          )}
          address={renderValueOrPlaceholder(
            schoolInfo?.displayAddress || schoolInfo?.fullAddress
          )}
          logoSource={heroLogoSource}
        />

        {error && !loading && (
          <View
            style={{
              backgroundColor: "#FFF0F0",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#F8B4B4",
            }}
          >
            <Text
              style={{
                fontFamily: "RobotoSlab-Bold",
                fontSize: 16,
                color: "#B91C1C",
                marginBottom: 8,
              }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={refresh}
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#B91C1C",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 14,
                }}
              >
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <SectionCard title="General Details" items={generalDetails} />
        <SectionCard
          title="Contact Information"
          items={contactDetails}
          footerContent={
            schoolInfo?.website?.trim() ? (
              <TouchableOpacity
                onPress={handleOpenWebsite}
                style={{
                  marginTop: 12,
                  alignSelf: "flex-start",
                  backgroundColor: "#01CBCA",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "RobotoSlab-Bold",
                    fontSize: 14,
                  }}
                >
                  Visit Website
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        {loading && !schoolInfo && (
          <View
            style={{
              marginTop: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color="#01CBCA" />
            <Text
              style={{
                marginTop: 10,
                fontFamily: "RobotoSlab-Regular",
                color: "#666666",
              }}
            >
              Loading school information...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type IconName = ComponentProps<typeof Ionicons>["name"];

type SectionItem = {
  icon: IconName;
  label: string;
  value: string;
};

type SectionCardProps = {
  title: string;
  items: SectionItem[];
  footerContent?: ReactNode;
};

function SectionCard({ title, items, footerContent }: SectionCardProps) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <Text
        style={{
          fontFamily: "RobotoSlab-Bold",
          fontSize: 18,
          color: "#000000",
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: 6 }}>
        {items.map((item, index) => (
          <View
            key={item.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 6,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: "#F2F2F2",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#F1FBFC",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name={item.icon} size={20} color="#01CBCA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Regular",
                  fontSize: 14,
                  color: "#9E9E9E",
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  fontFamily: "RobotoSlab-Bold",
                  fontSize: 16,
                  color: "#333333",
                }}
              >
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {footerContent}
    </View>
  );
}

type HeroCardProps = {
  name: string;
  tagline: string;
  address: string;
  logoSource: ImageSourcePropType;
};

function HeroCard({ name, tagline, address, logoSource }: HeroCardProps) {
  return (
    <LinearGradient
      colors={["#FFF9C4", "#FFE082", "#FFD54F"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 24,
        padding: 22,
        marginBottom: 22,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "RobotoSlab-Bold",
            fontSize: 24,
            color: "#1F1F1F",
            marginBottom: 6,
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            fontFamily: "RobotoSlab-Regular",
            fontSize: 16,
            color: "#4A4A4A",
            marginBottom: 14,
          }}
        >
          {tagline}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.7)",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 16,
          }}
        >
          <Ionicons name="location-outline" size={18} color="#01CBCA" />
          <Text
            style={{
              fontFamily: "RobotoSlab-Medium",
              fontSize: 14,
              color: "#1F1F1F",
              marginLeft: 8,
              flex: 1,
            }}
          >
            {address}
          </Text>
        </View>
      </View>
      <View
        style={{
          width: 110,
          height: 110,
          borderRadius: 24,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          padding: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }}
      >
        <Image
          source={logoSource}
          resizeMode="contain"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </View>
    </LinearGradient>
  );
}

