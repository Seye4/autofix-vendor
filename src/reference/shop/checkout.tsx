import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useEffect, useState } from 'react';

import { router } from 'expo-router';

import { api } from '../../../../src/api/client';

import { useAuthStore } from '../../../../src/store/authStore';

export default function CheckoutScreen() {
  const token = useAuthStore((state) => state.token);

  const [subtotal, setSubtotal] = useState(0);

  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');

  const [phone, setPhone] = useState('');

  const [address, setAddress] = useState('');

  const [city, setCity] = useState('');

  const [state, setState] = useState('');

  const [postalCode, setPostalCode] = useState('');

  const [country, setCountry] = useState('Canada');

  const shipping = subtotal >= 150 ? 0 : 15;

  const tax = subtotal * 0.05;

  const total = subtotal + shipping + tax;

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const response = await api.get(
        '',

        {
          params: {
            path: 'cart',
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSubtotal(Number(response.data.subtotal));
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to load cart.');
    }
  }

  async function placeOrder() {
    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !postalCode.trim() ||
      !country.trim()
    ) {
      Alert.alert('Missing information', 'Please complete your shipping address.');

      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        '',

        {
          shipping_name: name.trim(),

          shipping_phone: phone.trim(),

          shipping_address1: address.trim(),

          shipping_city: city.trim(),

          shipping_state: state.trim(),

          shipping_postal_code: postalCode.trim(),

          shipping_country: country.trim(),
        },

        {
          params: {
            path: 'orders/checkout',
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const order = response.data.order;

        Alert.alert(
          'Order created',
          `Order ${order.order_number} has been created.`,

          [
            {
              text: 'View Order',

              onPress: () =>
                router.replace({
                  pathname: '/orders/[id]',

                  params: {
                    id: String(order.id),
                  },
                }),
            },
          ]
        );
      } else {
        Alert.alert('Checkout failed', response.data.message);
      }
    } catch (error: any) {
      Alert.alert(
        'Checkout failed',

        error.response?.data?.message ?? 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>

        <TextInput
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TextInput
          placeholder="Street address"
          value={address}
          onChangeText={setAddress}
          style={styles.input}
        />

        <TextInput placeholder="City" value={city} onChangeText={setCity} style={styles.input} />

        <TextInput
          placeholder="Province / State"
          value={state}
          onChangeText={setState}
          style={styles.input}
        />

        <TextInput
          placeholder="Postal code"
          value={postalCode}
          onChangeText={setPostalCode}
          style={styles.input}
        />

        <TextInput
          placeholder="Country"
          value={country}
          onChangeText={setCountry}
          style={styles.input}
        />

        <View style={styles.summary}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.row}>
            <Text>Subtotal</Text>

            <Text>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.row}>
            <Text>Shipping</Text>

            <Text>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</Text>
          </View>

          <View style={styles.row}>
            <Text>Tax</Text>

            <Text>${tax.toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>

            <Text style={styles.total}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}

          disabled={loading}

          onPress={placeOrder}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue to Payment</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.paymentNote}>
          Your payment information will be securely handled by our payment provider. Card details
          are not stored on this server.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  back: {
    fontSize: 30,
    marginRight: 15,
  },

  title: {
    fontSize: 23,
    fontWeight: '900',
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 15,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },

  summary: {
    marginTop: 15,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: '900',
  },

  total: {
    fontSize: 21,
    fontWeight: '900',
    color: '#16A34A',
  },

  button: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  paymentNote: {
    marginTop: 15,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
  },
});
