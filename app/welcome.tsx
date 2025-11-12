import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace("/(tabs)"); // Navigate to tabs
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
            }}
            style={styles.logoImage}
            accessibilityLabel="Location logo"
          />
        </View>

        {/* Welcome Text */}
        <Text style={styles.title}>TrackPoint</Text>
        <Text style={styles.subtitle}>
          Get instant notifications when you're near your customers
        </Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Track delivery in real-time</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔔</Text>
            <Text style={styles.featureText}>Smart customer notifications</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Easy to use interface</Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Footer Note */}
        <Text style={styles.footerText}>
          We'll ask for location permission to provide the best experience
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#007AFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "white",
    marginTop: 60,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    fontSize: 40,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 50,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 40,
    textAlign: "center",
  },
  featureText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 30,
    lineHeight: 18,
  },
});
