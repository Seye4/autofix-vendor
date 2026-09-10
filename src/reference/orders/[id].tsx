import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { useEffect, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const token = useAuthStore((state) => state.token);

  const [order, setOrder] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    try {
      const response = await api.get(
        '',

        {
          params: {
            path: `orders/${id}`,
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setOrder(response.data.order);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loading}>
        <Text>Order not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Order Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>

          <Text style={styles.status}>Status: {order.status}</Text>

          <Text style={styles.payment}>Payment: {order.payment_status}</Text>
        </View>

        <Text style={styles.sectionTitle}>Items</Text>

        {order.items.map((item: any) => (
          <View
            key={item.id}

            style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product_name}</Text>

              <Text>Qty: {item.quantity}</Text>
            </View>

            <Text style={styles.itemPrice}>${Number(item.total_price).toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.row}>
            <Text>Subtotal</Text>

            <Text>${Number(order.subtotal).toFixed(2)}</Text>
          </View>

          <View style={styles.row}>
            <Text>Shipping</Text>

            <Text>${Number(order.shipping_fee).toFixed(2)}</Text>
          </View>

          <View style={styles.row}>
            <Text>Tax</Text>

            <Text>${Number(order.tax).toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>

            <Text style={styles.total}>${Number(order.total).toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Delivery Address</Text>

        <View style={styles.address}>
          <Text>{order.shipping_name}</Text>

          <Text>{order.shipping_phone}</Text>

          <Text>{order.shipping_address1}</Text>

          {order.shipping_address2 ? <Text>{order.shipping_address2}</Text> : null}

          <Text>
            {order.shipping_city}, {order.shipping_state}
          </Text>

          <Text>{order.shipping_postal_code}</Text>

          <Text>{order.shipping_country}</Text>
        </View>
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
    fontSize: 22,
    fontWeight: '900',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  summary: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
  },

  orderNumber: {
    fontSize: 19,
    fontWeight: '900',
  },

  status: {
    marginTop: 10,
    color: '#16A34A',
    textTransform: 'capitalize',
  },

  payment: {
    marginTop: 5,
    color: '#6B7280',
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '900',
  },

  item: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontWeight: '800',
    marginBottom: 5,
  },

  itemPrice: {
    fontWeight: '900',
    color: '#16A34A',
  },

  totals: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginTop: 15,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  totalLabel: {
    fontWeight: '900',
    fontSize: 18,
  },

  total: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 20,
  },

  address: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    gap: 5,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
