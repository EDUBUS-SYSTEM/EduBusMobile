import API from "@/services/api";
import { Entypo, FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileStudent() {
  const [student, setStudent] = useState<any>(null);

  // Gọi API khi màn hình load
  useEffect(() => {
    API.get("/Student/a1a07301-94b7-4241-8ddd-80b310708681") // 👈 ID test
      .then(res => {
        console.log("Student data:", res.data);
        setStudent(res.data);
      })
      .catch(err => console.error("API error:", err));
  }, []);

  if (!student) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading student...</Text>
      </View>
    );
  }

  // Gộp tên
  const fullName = `${student.firstName} ${student.lastName}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Student Profile</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="notifications" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarOuterBorder}>
            <View style={styles.avatarMiddleBorder}>
              <View style={styles.avatarInnerBorder}>
                <Image
                  source={{ uri: student.avatarUrl || "https://cdn.voh.com.vn/voh/Image/2022/09/20/hieu-thu-hai-tieu-su-019.jpg" }}
                  style={styles.avatar}
                />
              </View>
            </View>
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.status}>(Being on the bus)</Text>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MaterialIcons name="perm-identity" size={24} color="#01CBCA" />
            <Text style={styles.infoText}>ID: {student.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="class" size={24} color="#01CBCA" />
            <Text style={styles.infoText}>Class: N/A</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="school" size={24} color="#01CBCA" />
            <Text style={styles.infoText}>School: FPT School</Text>
          </View>
          <View style={styles.infoRow}>
            <Entypo name="address" size={22} color="#01CBCA" />
            <Text style={styles.infoText}>Address: N/A</Text>
          </View>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FCCF08",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "RobotoSlab-Bold",
    color: "#000000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: -100,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarOuterBorder: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FDF0A7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMiddleBorder: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#FCDC44",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInnerBorder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },

  name: {
    fontSize: 24,
    fontFamily: "RobotoSlab-Bold",
    color: "#000",
    marginTop: 24,
  },
  status: {
    fontSize: 20,
    fontFamily: "RobotoSlab-Regular",
    color: "#444",
    fontStyle: "italic",
    marginTop: 2,
  },
  infoContainer: {
    marginTop: 50,
    alignSelf: "center",
    alignItems: "flex-start",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  infoText: {
    fontSize: 20,
    fontFamily: "RobotoSlab-Regular",
    color: "#000",
    marginLeft: 18,
  },
});
