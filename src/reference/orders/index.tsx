import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { useCallback, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

type Order = {
  id: number;

  order_number: string;

  status: string;

  total: number;

  payment_status: string;

  created_at: string;
};

export default function OrdersScreen() {
  const token = useAuthStore((state) => state.token);

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(
        '',

        {
          params: {
            path: 'orders',
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  function renderOrder({ item }: { item: Order }) {
    return (
      <TouchableOpacity
        style={styles.card}

        onPress={() =>
          router.push({
            pathname: '/orders/[id]',

            params: {
              id: String(item.id),
            },
          })
        }>
        <View style={styles.topRow}>
          <Text style={styles.orderNumber}>{item.order_number}</Text>

          <View style={styles.status}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>

        <View style={styles.bottomRow}>
          <Text>Payment: {item.payment_status}</Text>

          <Text style={styles.price}>${Number(item.total).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <FlatList
        data={orders}

        keyExtractor={(item) => String(item.id)}

        renderItem={renderOrder}

        contentContainerStyle={styles.list}

        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>You haven't placed any orders yet.</Text>
          </View>
        }
      />
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
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
  },

  list: {
    padding: 15,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  orderNumber: {
    fontWeight: '900',
    fontSize: 16,
  },

  status: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  date: {
    color: '#6B7280',
    marginTop: 8,
  },

  bottomRow: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  price: {
    fontWeight: '900',
    color: '#16A34A',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    padding: 50,
    alignItems: 'center',
  },
});
