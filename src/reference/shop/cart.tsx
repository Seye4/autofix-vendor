import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';

import { useCallback, useEffect, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { api } from '../../../../src/api/client';

import { useAuthStore } from '../../../../src/store/authStore';

type CartItem = {
  id: number;

  product_id: number;

  name: string;

  price: number;

  quantity: number;

  stock_quantity: number;

  image_url?: string;
};

export default function CartScreen() {
  const token = useAuthStore((state) => state.token);

  const [items, setItems] = useState<CartItem[]>([]);

  const [subtotal, setSubtotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
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
        setItems(response.data.items);

        setSubtotal(Number(response.data.subtotal));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  async function updateQuantity(item: CartItem, quantity: number) {
    try {
      await api.put(
        '',

        {
          quantity,
        },

        {
          params: {
            path: `cart/items/${item.id}`,
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loadCart();
    } catch {
      Alert.alert('Error', 'Unable to update cart.');
    }
  }

  async function removeItem(item: CartItem) {
    try {
      await api.delete(
        '',

        {
          params: {
            path: `cart/items/${item.id}`,
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loadCart();
    } catch {
      Alert.alert('Error', 'Unable to remove item.');
    }
  }

  function renderItem({ item }: { item: CartItem }) {
    return (
      <View style={styles.item}>
        <View style={styles.itemImageContainer}>
          {item.image_url ? (
            <Image
              source={{
                uri: item.image_url,
              }}

              style={styles.itemImage}
            />
          ) : (
            <Text
              style={{
                fontSize: 30,
              }}>
              🚗
            </Text>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text
            style={styles.itemName}

            numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.quantityButton}

              onPress={() => updateQuantity(item, item.quantity - 1)}>
              <Text>−</Text>
            </TouchableOpacity>

            <Text style={styles.quantity}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.quantityButton}

              disabled={item.quantity >= item.stock_quantity}

              onPress={() => updateQuantity(item, item.quantity + 1)}>
              <Text>+</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => removeItem(item)}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>

        <Text style={styles.emptyTitle}>Your cart is empty</Text>

        <TouchableOpacity
          style={styles.shopButton}

          onPress={() => router.back()}>
          <Text style={styles.shopText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Cart</Text>
      </View>

      <FlatList
        data={items}

        keyExtractor={(item) => String(item.id)}

        renderItem={renderItem}

        contentContainerStyle={styles.list}
      />

      <View style={styles.checkout}>
        <View style={styles.totalRow}>
          <Text>Subtotal</Text>

          <Text style={styles.total}>${subtotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}

          onPress={() => router.push('/shop/checkout')}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
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

  list: {
    padding: 15,
  },

  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
  },

  itemImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },

  itemName: {
    fontWeight: '800',
  },

  itemPrice: {
    marginTop: 5,
    color: '#16A34A',
    fontSize: 17,
    fontWeight: '900',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantity: {
    marginHorizontal: 12,
    fontWeight: '800',
  },

  remove: {
    marginLeft: 15,
    color: '#DC2626',
    fontSize: 12,
  },

  checkout: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  total: {
    fontSize: 20,
    fontWeight: '900',
  },

  checkoutButton: {
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  checkoutText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },

  emptyIcon: {
    fontSize: 50,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '900',
  },

  shopButton: {
    marginTop: 20,
    backgroundColor: '#16A34A',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 10,
  },

  shopText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
