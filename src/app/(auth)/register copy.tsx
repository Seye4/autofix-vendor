import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

export type ProviderType = 'driver' | 'mechanic' | 'tow_operator';

export interface RegisterVendorPayload {
  provider_type: ProviderType;
  business_name?: string;
  phone?: string;
  license_number?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  vehicle_plate?: string;
}

const PROVIDER_TYPES: { label: string; value: ProviderType }[] = [
  { label: '🚗 Driver', value: 'driver' },
  { label: '🔧 Mechanic', value: 'mechanic' },
  { label: '🚛 Tow Operator', value: 'tow_operator' },
];

export default function VendorRegisterScreen({ userToken }: { userToken: string }) {
  const router = useRouter();

  const [providerType, setProviderType] = useState<ProviderType>('driver');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    const payload: RegisterVendorPayload = {
      provider_type: providerType,
      business_name: businessName || undefined,
      phone: phone || undefined,
      license_number: licenseNumber || undefined,
      vehicle_make: vehicleMake || undefined,
      vehicle_model: vehicleModel || undefined,
      vehicle_year: vehicleYear ? parseInt(vehicleYear, 10) : undefined,
      vehicle_color: vehicleColor || undefined,
      vehicle_plate: vehiclePlate || undefined,
    };

    try {
      const response = await fetch('https://your-domain.com/api/vendors/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert('Success', result.message || 'Vendor registered successfully.');
        router.replace('/vendor-status' as any);
      } else {
        Alert.alert('Error', result.message || 'Registration failed.');
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        error instanceof Error ? error.message : 'Failed to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Vendor Registration</Text>

        {/* Provider Type Picker */}
        <Text style={styles.label}>Provider Type *</Text>
        <View style={styles.pickerContainer}>
          {PROVIDER_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeOption, providerType === type.value && styles.selectedTypeOption]}
              onPress={() => setProviderType(type.value)}>
              <Text
                style={[styles.typeText, providerType === type.value && styles.selectedTypeText]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Business & Personal Info */}
        <Text style={styles.sectionHeader}>Business & Driver Details</Text>

        <Text style={styles.label}>Business Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Acme Auto Care"
          value={businessName}
          onChangeText={setBusinessName}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. +1 555-0199"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Driver License Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Driver License Number"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
        />

        {/* Vehicle Information */}
        <Text style={styles.sectionHeader}>Vehicle Information</Text>

        <View style={styles.row}>
          <View style={[styles.field, { marginRight: 8 }]}>
            <Text style={styles.label}>Make</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Toyota"
              value={vehicleMake}
              onChangeText={setVehicleMake}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Camry"
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { marginRight: 8 }]}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2022"
              keyboardType="numeric"
              value={vehicleYear}
              onChangeText={setVehicleYear}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Silver"
              value={vehicleColor}
              onChangeText={setVehicleColor}
            />
          </View>
        </View>

        <Text style={styles.label}>License Plate</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. ABC-1234"
          autoCapitalize="characters"
          value={vehiclePlate}
          onChangeText={setVehiclePlate}
        />

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Registration</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 10,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
    backgroundColor: '#FFFFFF',
  },
  selectedTypeOption: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  selectedTypeText: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  field: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
