import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HelpScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Help & Terms</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#007AFF"
            style={styles.sectionIcon}
          />
          <Text style={styles.sectionTitle}>How It Works</Text>
        </View>
        <Text style={styles.text}>
          • App tracks your location in real-time{"\n"}• Popup appears when
          within 100m of a customer{"\n"}• Popup auto-closes after 8 seconds
          {"\n"}• No duplicate alerts for same customer
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="document-text-outline"
            size={22}
            color="#007AFF"
            style={styles.sectionIcon}
          />
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
        </View>
        <Text style={styles.text}>
          By using TrackPoint you agree to share location data with the
          application. This sample app stores data locally and does not send it
          to remote servers unless configured. For production use, implement
          secure storage and privacy policies.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={22}
            color="#007AFF"
            style={styles.sectionIcon}
          />
          <Text style={styles.sectionTitle}>Support</Text>
        </View>
        <Text style={styles.text}>
          For questions, please contact support@example.com (placeholder).
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#f8f9fa",
    flexGrow: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  text: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
});
