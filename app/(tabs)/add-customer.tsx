import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { setFlash } from "../../services/flash";
import { createCustomer } from "../../services/api";

export default function AddCustomerScreen() {
  const router = useRouter();

  type CustomerForm = {
    name: string;
    address: string;
    phone: string;
    latitude: string;
    longitude: string;
    orderDetails: string;
    deliveryPerson: string;
  };

  const [formData, setFormData] = useState<CustomerForm>({
    name: "",
    address: "",
    phone: "",
    latitude: "",
    longitude: "",
    orderDetails: "",
    deliveryPerson: "",
  });
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleInputChange = (field: keyof CustomerForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Please provide customer name");
      return;
    }

    if (!formData.address.trim()) {
      Alert.alert("Validation Error", "Please provide address");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim() || undefined,
        orderDetails: formData.orderDetails.trim() || undefined,
        deliveryPerson: formData.deliveryPerson.trim() || undefined,
        latitude: formData.latitude.trim() ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude.trim() ? parseFloat(formData.longitude) : undefined,
      };

      if (formData.latitude.trim()) {
        const lat = parseFloat(formData.latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          Alert.alert("Validation Error", "Latitude must be between -90 and 90");
          setLoading(false);
          return;
        }
      }

      if (formData.longitude.trim()) {
        const lng = parseFloat(formData.longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          Alert.alert("Validation Error", "Longitude must be between -180 and 180");
          setLoading(false);
          return;
        }
      }

      await createCustomer(payload);
      setFlash("Customer added successfully");
      setSuccessVisible(true);
    } catch (error: any) {
      console.error("Error adding customer:", error);
      let errorMessage = "Failed to add customer";

      if (error.message) {
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.error || error.message;
        } catch {
          errorMessage = error.message;
        }
      }

      if (errorMessage.includes("Network request failed") || errorMessage.includes("Failed to fetch")) {
        errorMessage = "Network error: Cannot connect to server.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      latitude: "",
      longitude: "",
      orderDetails: "",
      deliveryPerson: "",
    });
  };

  const handleSuccessOk = () => {
    setSuccessVisible(false);
    router.push("/");
  };

  const handleSuccessAddAnother = () => {
    setSuccessVisible(false);
    resetForm();
  };

  const isFormValid = formData.name.trim() && formData.address.trim();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Customer</Text>
        </View>

        {/* Compact Form */}
        <View style={styles.form}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === "name" && styles.inputFocused,
                ]}
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                onFocus={() => handleFocus("name")}
                onBlur={handleBlur}
                placeholder="Customer name"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  focusedField === "address" && styles.inputFocused,
                ]}
                value={formData.address}
                onChangeText={(value) => handleInputChange("address", value)}
                onFocus={() => handleFocus("address")}
                onBlur={handleBlur}
                placeholder="Delivery address"
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === "phone" && styles.inputFocused,
                ]}
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                onFocus={() => handleFocus("phone")}
                onBlur={handleBlur}
                placeholder="Phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.doubleRow}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === "latitude" && styles.inputFocused,
                ]}
                value={formData.latitude}
                onChangeText={(value) => handleInputChange("latitude", value)}
                onFocus={() => handleFocus("latitude")}
                onBlur={handleBlur}
                placeholder="6.123456"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
                editable={!loading}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === "longitude" && styles.inputFocused,
                ]}
                value={formData.longitude}
                onChangeText={(value) => handleInputChange("longitude", value)}
                onFocus={() => handleFocus("longitude")}
                onBlur={handleBlur}
                placeholder="81.123456"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Order Details</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  focusedField === "orderDetails" && styles.inputFocused,
                ]}
                value={formData.orderDetails}
                onChangeText={(value) => handleInputChange("orderDetails", value)}
                onFocus={() => handleFocus("orderDetails")}
                onBlur={handleBlur}
                placeholder="Order items and instructions"
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Delivery Person</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === "deliveryPerson" && styles.inputFocused,
                ]}
                value={formData.deliveryPerson}
                onChangeText={(value) => handleInputChange("deliveryPerson", value)}
                onFocus={() => handleFocus("deliveryPerson")}
                onBlur={handleBlur}
                placeholder="Delivery person name"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* Compact Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid || loading) && styles.saveButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Compact Success Modal */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>Customer added successfully</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={handleSuccessAddAnother}
              >
                <Text style={styles.modalButtonSecondaryText}>Add Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleSuccessOk}
              >
                <Text style={styles.modalButtonPrimaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputRow: {
    marginBottom: 12,
  },
  doubleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    minHeight: 40,
  },
  inputFocused: {
    borderColor: "#007AFF",
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  modalButtonSecondaryText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
});