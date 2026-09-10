import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

import { router } from 'expo-router';

export default function ServicesScreen() {
  return (
    <ScrollView
      style={styles.container}

      contentContainerStyle={styles.content}>
      <Text style={styles.title}>What do you need?</Text>

      <Text style={styles.subtitle}>Choose a service below</Text>

      <TouchableOpacity
        style={styles.card}

        onPress={() =>
          router.push({
            pathname: '/services/book',

            params: {
              type: 'ride',
            },
          })
        }>
        <Text style={styles.icon}>🚗</Text>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Ride</Text>

          <Text style={styles.cardText}>Get a driver to your pickup location.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}

        onPress={() =>
          router.push({
            pathname: '/services/book',

            params: {
              type: 'mechanic',
            },
          })
        }>
        <Text style={styles.icon}>🔧</Text>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Mechanic</Text>

          <Text style={styles.cardText}>Get a mechanic to diagnose or repair your vehicle.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}

        onPress={() =>
          router.push({
            pathname: '/services/book',

            params: {
              type: 'tow',
            },
          })
        }>
        <Text style={styles.icon}>🪝</Text>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Tow Vehicle</Text>

          <Text style={styles.cardText}>Request roadside towing assistance.</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  content: {
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    color: '#6B7280',
    marginTop: 5,
    marginBottom: 25,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  icon: {
    fontSize: 42,
    marginRight: 18,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 5,
  },

  cardText: {
    color: '#6B7280',
    lineHeight: 19,
  },
});
