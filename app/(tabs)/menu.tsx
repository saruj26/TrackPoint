import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MenuScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const toggleNotifications = () => setNotificationsEnabled((v) => !v);

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword) {
      Alert.alert("Validation", "Please fill both password fields");
      return;
    }
    // Mock behaviour
    Alert.alert("Success", "Password changed (mock)");
    setOldPassword("");
    setNewPassword("");
  };

  const handleViewHistory = () => {
    router.push("/history");
  };

  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Mock delivered items count for header display
  const delivered: any[] = [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Page header handled by layout; page content begins below */}

      <Text style={styles.heading}>Menu</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enable notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Past History</Text>
        <TouchableOpacity style={styles.link} onPress={handleViewHistory}>
          <Text style={styles.linkText}>View past deliveries</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Old password"
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="New password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    flexGrow: 1,
  },
  heading: {
    fontSize: 22,
    paddingHorizontal: 16,
    paddingVertical:12,
    fontWeight: "700",
    marginBottom: 16,
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#333",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 14,
    color: "#444",
  },
  link: {
    paddingVertical: 12,
  },
  linkText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f6f6f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  /* Header / Logo styles */
  header: {
    marginBottom: 16,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  headerBackground: {
    height: 110,
    backgroundColor: "#007AFF",
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  titleContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    marginLeft: 12,
  },
  statNumber: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },
});
