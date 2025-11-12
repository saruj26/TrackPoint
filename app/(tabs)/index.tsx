import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import LocationPopupProvider from "../../components/LocationPopupProvider";
import { Ionicons } from "@expo/vector-icons";

type Customer = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
};
export default function HomeScreen() {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  const customerLocations: Customer[] = [
    {
      id: 1,
      name: "Gymnasium - Uva Wellassa University",
      latitude: 6.981733040150603,
      longitude: 81.07852941068032,
      address: "Peradeniya-Badulla-Chenkaladi Hwy, Badulla",
    },
    {
      id: 2,
      name: "Kadala Boys Boarding",
      latitude: 6.981045576537692,
      longitude: 81.08306007112968,
      address: "30 Peradeniya-Badulla-Chenkaladi Hwy, Badulla",
    },
    {
      id: 3,
      name: "Pizza Hut",
      latitude: 6.9919596461505815,
      longitude: 81.05429115791192,
      address: "Keppetipola Road, Badulla",
    },
    {
      id: 4,
      name: "KFC",
      latitude: 6.990380957801956,
      longitude: 81.05146504616746,
      address: "45 Bandarawela Rd, Badulla",
    },
    {
      id: 5,
      name: "E Lecture Hall",
      latitude: 6.982081376655212,
      longitude: 81.07600720993864,
      address: "Peradeniya-Badulla-Chenkaladi Hwy, Badulla",
    },
    {
      id: 6,
      name: "RIVER VIEW RESTAURANT",
      latitude: 6.987899714566949,
      longitude: 81.05586386896313,
      address: "10 Clinic Road, Badulla",
    },
    {
      id: 7,
      name: "Main Canteen UWU",
      latitude: 6.980819436077193,
      longitude: 81.07744219174182,
      address: "Peradeniya-Badulla-Chenkaladi Hwy, Badulla",
    },
  ];

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance);
  };

  const startLocationTracking = async () => {
    try {
      setLoading(true);

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for this app to work properly."
        );
        setLocationPermission(false);
        setLoading(false);
        return;
      }

      setLocationPermission(true);

      // Get initial position
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      try {
        // Reverse geocode to get a human readable address
        const geocoded = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocoded && geocoded.length > 0) {
          const a = geocoded[0];
          const parts = [
            a.name,
            a.street,
            a.city,
            a.region,
            a.postalCode,
            a.country,
          ].filter(Boolean);
          setCurrentAddress(parts.join(", "));
        } else {
          setCurrentAddress(null);
        }
      } catch (err) {
        console.warn("Reverse geocode failed", err);
        setCurrentAddress(null);
      }
      setLoading(false);
    } catch (error) {
      console.error("Location error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    startLocationTracking();
  }, []);

  const formatCoordinates = (
    location: { latitude: number; longitude: number } | null
  ) => {
    if (!location) return "Unknown";
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const openDirections = async (
    destLat: number,
    destLng: number,
    label?: string
  ) => {
    if (!currentLocation) {
      Alert.alert(
        "Location required",
        "Current location is required to open directions. Please enable location and try again."
      );
      return;
    }

    const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
    const destination = `${destLat},${destLng}`;

    // Use Google Maps directions URL which works on both Android/iOS (will open in browser or Maps app)
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

    // For android devices we can try the google.navigation intent for a better app experience
    const androidUrl = `google.navigation:q=${destLat},${destLng}`;

    try {
      if (Platform.OS === "android") {
        const supported = await Linking.canOpenURL(androidUrl);
        if (supported) {
          await Linking.openURL(androidUrl);
          return;
        }
      }

      // Fallback to web/google maps url
      const supportedWeb = await Linking.canOpenURL(googleMapsUrl);
      if (supportedWeb) {
        await Linking.openURL(googleMapsUrl);
        return;
      }

      Alert.alert(
        "Can't open maps",
        "No suitable app found to open directions."
      );
    } catch (err) {
      console.warn("Error opening maps", err);
      Alert.alert("Error", "Could not open maps. Please try again.");
    }
  };

  const getNearestCustomerInfo = ():
    | (Customer & { distance: number })
    | null => {
    if (!currentLocation) return null;

    let nearest: (Customer & { distance: number }) | null = null;
    let minDistance = Infinity;

    customerLocations.forEach((customer) => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        customer.latitude,
        customer.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...customer, distance };
      }
    });

    return nearest;
  };

  const nearestCustomer = getNearestCustomerInfo();

  const [searchQuery, setSearchQuery] = useState("");

  // Prepare filtered and sorted customers by distance (closest first)
  const filteredCustomers = customerLocations.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
    );
  });

  const customersWithDistance = filteredCustomers.map((c) => {
    const distance = currentLocation
      ? calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          c.latitude,
          c.longitude
        )
      : null;
    return { ...c, distance };
  });

  const sortedCustomers = customersWithDistance.sort((a, b) => {
    if (a.distance == null && b.distance == null) return 0;
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=3d0b7d7d2f1b4c0e3f0b7c8f6d5a9a12",
          }}
          style={styles.header}
          imageStyle={styles.headerImage}
        >
          <View style={styles.titleRow}>
            <Image
              source={{
                uri: "https://img.icons8.com/ios-filled/50/ffffff/marker.png",
              }}
              style={styles.titleImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Smart way to reach customers</Text>
          </View>
          <Text style={styles.subtitle}>Get alerts when near customers</Text>
        </ImageBackground>

        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: locationPermission ? "#4CAF50" : "#f44336" },
              ]}
            />
            <Text style={styles.statusText}>
              {locationPermission ? "Location Active" : "Location Disabled"}
            </Text>
          </View>

          <Text style={styles.infoText}>
            📍 Your Location:{" "}
            {currentAddress
              ? currentAddress
              : formatCoordinates(currentLocation)}
          </Text>
          {currentLocation && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Ionicons
                name="location-sharp"
                size={14}
                color="#999"
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.infoText, { fontSize: 12, color: "#999" }]}>
                {formatCoordinates(currentLocation)}
              </Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Getting location...</Text>
            </View>
          )}
        </View>

        {/* Nearest Customer Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nearest Customer</Text>
          {nearestCustomer ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                openDirections(
                  nearestCustomer.latitude,
                  nearestCustomer.longitude,
                  nearestCustomer.name
                )
              }
              style={styles.customerCard}
            >
              <Text style={styles.customerName}>{nearestCustomer.name}</Text>
              <Text style={styles.customerAddress}>
                {nearestCustomer.address}
              </Text>
              <Text
                style={[
                  styles.distanceText,
                  {
                    color:
                      nearestCustomer.distance <= 100 ? "#4CAF50" : "#FF9800",
                  },
                ]}
              >
                📏 {nearestCustomer.distance}m away
              </Text>
              {nearestCustomer.distance <= 100 && (
                <Text style={styles.nearbyText}>🎉 You're nearby!</Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.noDataText}>Calculating distance...</Text>
          )}
        </View>

        {/* All Customers Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            All Customers ({customerLocations.length})
          </Text>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={16}
              color="#999"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Search by name or address"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={{ paddingLeft: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {sortedCustomers.map((customer, index) => {
            const distance = customer.distance;

            return (
              <TouchableOpacity
                key={customer.id}
                activeOpacity={0.8}
                onPress={() =>
                  openDirections(
                    customer.latitude,
                    customer.longitude,
                    customer.name
                  )
                }
                style={[
                  styles.customerItem,
                  index < sortedCustomers.length - 1 &&
                    styles.customerItemBorder,
                ]}
              >
                <Image
                  source={{
                    uri: `https://picsum.photos/seed/${customer.id}/80/80`,
                  }}
                  style={styles.customerThumb}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.customerHeader}>
                    <Text style={styles.customerItemName}>{customer.name}</Text>
                    {distance != null && (
                      <Text
                        style={[
                          styles.customerDistance,
                          { color: distance <= 100 ? "#4CAF50" : "#666" },
                        ]}
                      >
                        {distance}m
                      </Text>
                    )}
                  </View>
                  <Text style={styles.customerItemAddress}>
                    {customer.address}
                  </Text>
                  {distance != null && distance <= 100 && (
                    <Text style={styles.withinRangeText}>Within range! 🎯</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Instructions moved to Help screen (access from header menu) */}
      </ScrollView>

      {/* Location Popup Provider */}
      <LocationPopupProvider />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    padding: 15,
    paddingTop: 20,
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 5,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#007AFF",
  },
  customerCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  customerAddress: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  nearbyText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    fontStyle: "italic",
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  customerItem: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  customerItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  customerItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  customerDistance: {
    fontSize: 13,
    fontWeight: "600",
  },
  customerItemAddress: {
    fontSize: 12,
    color: "#666",
  },
  withinRangeText: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 4,
  },
  instructionText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  titleImage: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 12,
    width: "100%",
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 4,
    color: "#333",
  },
  headerImage: {
    borderRadius: 15,
    opacity: 0.95,
    height: 150,
  },
  customerThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
});
