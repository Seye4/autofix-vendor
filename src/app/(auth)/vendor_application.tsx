import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { VendorType, registerVendor, RegisterVendorPayload } from '../../api/vendor';

interface VendorTypeOption {
  label: string;
  value: VendorType;
  description: string;
}

const VENDOR_TYPES: VendorTypeOption[] = [
  {
    label: 'Mechanic',
    value: 'mechanic',
    description: 'Provide roadside repairs & maintenance',
  },
  {
    label: 'Tow Driver',
    value: 'tow_driver',
    description: 'Offer towing & vehicle recovery',
  },
  {
    label: 'Ride Driver',
    value: 'ride_driver',
    description: 'Provide passenger transportation',
  },
];

// Explicit colors prevent Android production builds from inheriting
// an invisible/white placeholder color from the native theme.
const PLACEHOLDER_COLOR = '#9CA3AF';

export default function VendorRegisterScreen(): React.JSX.Element {
  const [vendorType, setVendorType] = useState<VendorType>('mechanic');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');

  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(): Promise<void> {
    if (!businessName.trim() || !phone.trim()) {
      Alert.alert(
        'Missing Information',
        'Please provide a business name and contact phone number.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload: RegisterVendorPayload = {
        vendor_type: vendorType,
        business_name: businessName.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        province: province.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        years_experience: parseInt(yearsExperience, 10) || 0,
        bio: bio.trim() || undefined,
      };

      const response = await registerVendor(payload);

      if (response.success) {
        Alert.alert('Application Submitted', 'Your vendor profile is currently pending review.', [
          {
            text: 'OK',
            onPress: () => router.replace('/(vendor)/'),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.message || 'Unable to submit application.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Become a Partner</Text>

        <Text style={styles.headerSubtitle}>
          Complete your vendor application to start accepting jobs.
        </Text>

        {/* Vendor Type Selector */}
        <Text style={styles.sectionTitle}>Select Service Category</Text>

        <View style={styles.typeContainer}>
          {VENDOR_TYPES.map((type) => {
            const isSelected = vendorType === type.value;

            return (
              <Pressable
                key={type.value}
                onPress={() => setVendorType(type.value)}
                style={[styles.typeCard, isSelected && styles.typeCardSelected]}>
                <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                  {type.label}
                </Text>

                <Text style={[styles.typeDesc, isSelected && styles.typeDescSelected]}>
                  {type.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Form Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Business / Display Name</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Apex Auto Towing"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={businessName}
            onChangeText={setBusinessName}
            autoCorrect={false}
          />

          <Text style={styles.label}>Phone Number</Text>

          <TextInput
            style={styles.input}
            placeholder="(555) 000-0000"
            placeholderTextColor={PLACEHOLDER_COLOR}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Street Address</Text>

          <TextInput
            style={styles.input}
            placeholder="123 Main Street"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={address}
            onChangeText={setAddress}
            autoCorrect={false}
          />

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.flex2]}>
              <Text style={styles.label}>City</Text>

              <TextInput
                style={styles.input}
                placeholder="Winnipeg"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={city}
                onChangeText={setCity}
                autoCorrect={false}
              />
            </View>

            <View style={[styles.formGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Province</Text>

              <TextInput
                style={styles.input}
                placeholder="MB"
                placeholderTextColor={PLACEHOLDER_COLOR}
                autoCapitalize="characters"
                value={province}
                onChangeText={setProvince}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.flex1]}>
              <Text style={styles.label}>Postal Code</Text>

              <TextInput
                style={styles.input}
                placeholder="R3C 1A1"
                placeholderTextColor={PLACEHOLDER_COLOR}
                autoCapitalize="characters"
                value={postalCode}
                onChangeText={setPostalCode}
                autoCorrect={false}
              />
            </View>

            <View style={[styles.formGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Years Experience</Text>

              <TextInput
                style={styles.input}
                placeholder="5"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="numeric"
                value={yearsExperience}
                onChangeText={setYearsExperience}
              />
            </View>
          </View>

          <Text style={styles.label}>Professional Bio</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell customers about your services and availability..."
            placeholderTextColor={PLACEHOLDER_COLOR}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={bio}
            onChangeText={setBio}
            autoCorrect={true}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleRegister}
          disabled={submitting}
          style={[styles.button, submitting && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>
            {submitting ? 'Submitting Application...' : 'Submit Application'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
  },

  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },

  typeContainer: {
    gap: 10,
    marginBottom: 24,
  },

  typeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },

  typeCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  typeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  typeLabelSelected: {
    color: '#2563EB',
  },

  typeDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  typeDescSelected: {
    color: '#1D4ED8',
  },

  formGroup: {
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
  },

  flex1: {
    flex: 1,
  },

  flex2: {
    flex: 2,
  },

  marginLeft: {
    marginLeft: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,

    paddingHorizontal: 14,
    paddingVertical: 12,

    fontSize: 15,
    color: '#111827',

    // Important for Android production builds.
    // Ensures the text input itself has a known color.
    opacity: 1,
  },

  textArea: {
    minHeight: 100,
  },

  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28,

    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,

    elevation: 3,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
