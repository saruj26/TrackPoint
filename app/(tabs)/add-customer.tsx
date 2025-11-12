import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddCustomerScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [orderDetails, setOrderDetails] = useState('');
  const [deliveryPerson, setDeliveryPerson] = useState('');

  const handleSubmit = () => {
    // In a real app you'd validate and send to an API / store
    if (!name || !address) {
      Alert.alert('Validation', 'Please provide at least name and address');
      return;
    }

    const payload = {
      name,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      orderDetails,
      deliveryPerson,
      createdAt: new Date().toISOString(),
    };

    console.log('Add customer payload:', payload);
    Alert.alert('Success', 'Customer added (mock)', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Customer / Today Order</Text>

      <Text style={styles.label}>Customer Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />

      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />

      <Text style={styles.label}>Latitude</Text>
      <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} placeholder="6.123456" keyboardType="numeric" />

      <Text style={styles.label}>Longitude</Text>
      <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} placeholder="81.123456" keyboardType="numeric" />

      <Text style={styles.label}>Order Details (today)</Text>
      <TextInput style={[styles.input, styles.multiline]} value={orderDetails} onChangeText={setOrderDetails} placeholder="e.g. 2 pizzas" multiline />

      <Text style={styles.label}>Delivery Person</Text>
      <TextInput style={styles.input} value={deliveryPerson} onChangeText={setDeliveryPerson} placeholder="Name or ID" />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 13,
    color: '#444',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
