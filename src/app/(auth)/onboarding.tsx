import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../store/appStore';

export default function Onboarding() {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  async function getStarted() {
    await completeOnboarding();
    // Navigates to login route inside (auth) group
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.logo}>RoadAssist</Text>
        <Text style={styles.title}>Help when you need it.</Text>
        <Text style={styles.description}>
          Book rides, mechanics and towing services from one app.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={getStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    marginTop: 80,
    fontSize: 32,
    fontWeight: '900',
    color: '#16A34A',
  },
  title: {
    marginTop: 40,
    fontSize: 38,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    marginTop: 20,
    fontSize: 18,
    lineHeight: 28,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#16A34A',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
