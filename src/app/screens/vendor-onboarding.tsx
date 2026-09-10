// app/vendor-onboarding.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';

interface VendorFormData {
  businessName: string;
  category: string;
  phone: string;
  address: string;
  description: string;
  governmentId: string | null;
  driversLicense: string | null;
}

export default function VendorOnboardingScreenDemo() {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<VendorFormData>({
    businessName: 'Apex Electronics',
    category: 'Retail',
    phone: '+1 555-0199',
    address: '123 Main St, Suite 400',
    description: 'Specializing in premium high-end tech accessories and consumer electronics.',
    governmentId: null,
    driversLicense: null,
  });

  const updateField = <K extends keyof VendorFormData>(key: K, value: VendorFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Simulated Document Picker action
  const handleDocumentPick = (type: 'governmentId' | 'driversLicense') => {
    // In a production app, use `expo-document-picker` or `expo-image-picker`:
    // const result = await ImagePicker.launchImageLibraryAsync({...});

    Alert.alert(
      'Select Document Source',
      `Choose an action to upload your ${type === 'governmentId' ? 'Government ID' : "Driver's License"}`,
      [
        {
          text: 'Simulate Upload',
          onPress: () => {
            const fileName =
              type === 'governmentId' ? 'national_id_card.pdf' : 'drivers_license.jpg';
            updateField(type, fileName);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleNextStep = () => {
    if (step === 1 && (!formData.businessName || !formData.category)) {
      Alert.alert('Required Fields', 'Please fill in your Business Name and Category.');
      return;
    }
    if (step === 2 && (!formData.phone || !formData.address)) {
      Alert.alert('Required Fields', 'Please fill in your Contact Phone and Address.');
      return;
    }
    if (step === 2 && (!formData.governmentId || !formData.driversLicense)) {
      Alert.alert(
        'Required Documents',
        'Please upload both your Government ID and Driver’s License.'
      );
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleFinishDemo = async () => {
    if (!formData.description) {
      Alert.alert('Required Fields', 'Please enter a business description.');
      return;
    }

    setSubmitting(true);

    // Simulate API delay
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        'Demo Complete! 🎉',
        `Form submitted successfully:\n\n` +
          `• Business: ${formData.businessName}\n` +
          `• Category: ${formData.category}\n` +
          `• Phone: ${formData.phone}\n` +
          `• Address: ${formData.address}\n` +
          `• Govt ID: ${formData.governmentId}\n` +
          `• Driver's License: ${formData.driversLicense}\n` +
          `• Description: ${formData.description}`
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Progress Header */}
          <View style={styles.header}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
            </View>
            <Text style={styles.badge}>STEP {step} OF 3</Text>
            <Text style={styles.title}>
              {step === 1 && 'Business Info'}
              {step === 2 && 'Contact & Identity'}
              {step === 3 && 'Final Verification'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 && 'Tell us about your store identity.'}
              {step === 2 && 'Provide contact details and verification documents.'}
              {step === 3 && 'Add a brief overview to launch your dashboard.'}
            </Text>
          </View>

          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <View style={styles.formSection}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Apex Electronics"
                value={formData.businessName}
                onChangeText={(val) => updateField('businessName', val)}
              />

              <Text style={styles.label}>Category *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Retail, Grocery, Mechanics"
                value={formData.category}
                onChangeText={(val) => updateField('category', val)}
              />
            </View>
          )}

          {/* STEP 2: Contact & Document Uploads */}
          {step === 2 && (
            <View style={styles.formSection}>
              <Text style={styles.label}>Contact Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 555-0199"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(val) => updateField('phone', val)}
              />

              <Text style={styles.label}>Physical Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main St, Suite 400"
                value={formData.address}
                onChangeText={(val) => updateField('address', val)}
              />

              {/* Document Upload Section */}
              <Text style={styles.sectionHeader}>Verification Documents</Text>

              {/* Government ID Upload */}
              <Text style={styles.label}>National ID Card / Passport *</Text>
              <TouchableOpacity
                style={[styles.uploadBox, formData.governmentId ? styles.uploadBoxSuccess : null]}
                onPress={() => handleDocumentPick('governmentId')}>
                <Text style={styles.uploadIcon}>{formData.governmentId ? '✅' : '📄'}</Text>
                <View style={styles.uploadTextWrapper}>
                  <Text style={styles.uploadTitle}>
                    {formData.governmentId ?? 'Upload Government ID'}
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    {formData.governmentId ? 'Tap to replace file' : 'PDF, PNG, or JPG (max. 5MB)'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Driver's License Upload */}
              <Text style={styles.label}>Driver's License *</Text>
              <TouchableOpacity
                style={[styles.uploadBox, formData.driversLicense ? styles.uploadBoxSuccess : null]}
                onPress={() => handleDocumentPick('driversLicense')}>
                <Text style={styles.uploadIcon}>{formData.driversLicense ? '✅' : '🪪'}</Text>
                <View style={styles.uploadTextWrapper}>
                  <Text style={styles.uploadTitle}>
                    {formData.driversLicense ?? "Upload Driver's License"}
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    {formData.driversLicense
                      ? 'Tap to replace file'
                      : 'PDF, PNG, or JPG (max. 5MB)'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Description & Summary */}
          {step === 3 && (
            <View style={styles.formSection}>
              <Text style={styles.label}>Business Overview *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what services or products your store provides..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(val) => updateField('description', val)}
              />

              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Uploaded Documents</Text>
                <Text style={styles.summaryItem}>
                  • Government ID: {formData.governmentId || 'Not uploaded'}
                </Text>
                <Text style={styles.summaryItem}>
                  • Driver's License: {formData.driversLicense || 'Not uploaded'}
                </Text>
              </View>
            </View>
          )}

          {/* Navigation Controls */}
          <View style={styles.buttonContainer}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep((prev) => prev - 1)}
                disabled={submitting}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            {step < 3 ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, submitting && styles.disabledButton]}
                onPress={handleFinishDemo}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Finish & Submit</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1 },
  scrollContainer: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: 24 },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: '#2563EB', borderRadius: 3 },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  formSection: { marginBottom: 20 },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  textArea: { height: 110 },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  uploadBoxSuccess: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    borderStyle: 'solid',
  },
  uploadIcon: { fontSize: 24, marginRight: 12 },
  uploadTextWrapper: { flex: 1 },
  uploadTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  uploadSubtext: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF', marginBottom: 6 },
  summaryItem: { fontSize: 13, color: '#1E3A8A', marginBottom: 4 },
  buttonContainer: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.7 },
});
