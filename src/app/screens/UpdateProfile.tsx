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
import { registerVendor, RegisterVendorPayload, VendorType } from '@/api/vendor';
import { router } from 'expo-router/build/exports';

export default function UpdateProfile() {
  const [vendorType, setVendorType] = useState<VendorType>('mechanic');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    const payload: RegisterVendorPayload = {
      vendor_type: vendorType,
      business_name: businessName,
      phone: phone,
      address: address,
      city: city,
      province: province,
      postal_code: postalCode,
      bio: bio,
      years_experience: parseInt(yearsExperience, 10) || 0,
    };

    try {
      const result = await registerVendor(payload);

      if (result.success) {
        // Mark onboarding complete in store and local storage
        router.replace('/(vendor)'); // Navigate to the vendor dashboard

        Alert.alert('Success', result.message || 'Vendor profile updated successfully.');
      } else {
        Alert.alert('Error', result.message || 'Something went wrong.');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Update Vendor Profile</Text>

        <Text style={styles.label}>Business Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Business Name"
          value={businessName}
          onChangeText={setBusinessName}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Street Address"
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.row}>
          <View style={[styles.field, { marginRight: 8 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Province / State</Text>
            <TextInput
              style={styles.input}
              placeholder="Province"
              value={province}
              onChangeText={setProvince}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { marginRight: 8 }]}>
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              value={postalCode}
              onChangeText={setPostalCode}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Years Experience</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={yearsExperience}
              onChangeText={setYearsExperience}
            />
          </View>
        </View>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us about your services..."
          multiline
          numberOfLines={4}
          value={bio}
          onChangeText={setBio}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Save Profile Changes</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
