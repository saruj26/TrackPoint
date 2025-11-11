import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';

type Customer = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
};

const customerLocations: Customer[] = [
  {
    id: 1,
    name: 'Coffee Shop Central',
    latitude: 37.7749, // Replace with your actual coordinates
    longitude: -122.4194,
    address: '123 Main Street, Downtown',
    phone: '+1-555-0101',
  },
  {
    id: 2,
    name: 'Book Store Plus',
    latitude: 37.7849, // Replace with your actual coordinates
    longitude: -122.4094,
    address: '456 Oak Avenue, Midtown',
    phone: '+1-555-0102',
  },
  {
    id: 3,
    name: 'Restaurant Delight',
    latitude: 37.7649, // Replace with your actual coordinates
    longitude: -122.4294,
    address: '789 Pine Road, Uptown',
    phone: '+1-555-0103',
  },
];

export default function LocationPopupProvider() {
  const [showPopup, setShowPopup] = useState(false);
  const [popupCustomer, setPopupCustomer] = useState<Customer | null>(null);
  
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const alertedCustomers = useRef<Set<number>>(new Set());

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
  };

  // Check if user is near any customer
  const checkNearbyCustomers = (location: { latitude: number; longitude: number }) => {
    const { latitude, longitude } = location;
    const thresholdDistance = 100; // 100 meters threshold

    customerLocations.forEach(customer => {
      const distance = calculateDistance(
        latitude,
        longitude,
        customer.latitude,
        customer.longitude
      );

      // If within threshold and not already alerted
      if (distance <= thresholdDistance && !alertedCustomers.current.has(customer.id)) {
        setPopupCustomer(customer);
        setShowPopup(true);
        alertedCustomers.current.add(customer.id);
        
        // Auto hide popup after 8 seconds
        setTimeout(() => {
          setShowPopup(false);
        }, 8000);
      }
    });
  };

  // Start location tracking
  const startLocationTracking = async () => {
    try {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return;
      }

      // Start watching position
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Update every 5 seconds
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          checkNearbyCustomers({ latitude, longitude });
        }
      );

    } catch (error) {
      console.error('Location error:', error);
    }
  };

  useEffect(() => {
    startLocationTracking();

    // Cleanup
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <Modal
      visible={showPopup}
      transparent={true}
      animationType="fade"
      onRequestClose={closePopup}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.popupContainer}>
          <View style={styles.popupHeader}>
            <Text style={styles.popupIcon}>🎉</Text>
            <Text style={styles.popupTitle}>Customer Nearby!</Text>
          </View>
          
          {popupCustomer && (
            <View style={styles.popupContent}>
              <Text style={styles.popupCustomerName}>{popupCustomer.name}</Text>
              <Text style={styles.popupCustomerAddress}>{popupCustomer.address}</Text>
              {popupCustomer.phone && (
                <Text style={styles.popupCustomerPhone}>{popupCustomer.phone}</Text>
              )}
              
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceBadgeText}>Within 100m</Text>
              </View>
              
              <Text style={styles.popupMessage}>
                You're near this customer location!
              </Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.closeButton} onPress={closePopup}>
            <Text style={styles.closeButtonText}>Got It!</Text>
          </TouchableOpacity>
          
          <Text style={styles.autoCloseText}>Auto-closes in 8 seconds</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  popupContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  popupIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  popupContent: {
    alignItems: 'center',
    marginBottom: 25,
  },
  popupCustomerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  popupCustomerAddress: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
    lineHeight: 20,
  },
  popupCustomerPhone: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 15,
  },
  distanceBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 15,
  },
  distanceBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  popupMessage: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  autoCloseText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});