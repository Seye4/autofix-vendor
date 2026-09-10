import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useEffect, useState } from 'react';

import { useLocalSearchParams, router } from 'expo-router';

import { api } from '../../../../../src/api/client';

type Product = {
  id: number;

  name: string;

  brand: string;

  sku: string;

  description: string;

  price: number;

  stock_quantity: number;

  images: {
    id: number;
    image_url: string;
  }[];
};

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    try {
      const response = await api.get(
        '',

        {
          params: {
            path: `shop/products/${id}`,
          },
        }
      );

      if (response.data.success) {
        setProduct(response.data.product);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to load product.');
    } finally {
      setLoading(false);
    }
  }

  async function addToCart() {
    if (!product) {
      return;
    }

    try {
      const response = await api.post(
        '',

        {
          product_id: product.id,

          quantity: 1,
        },

        {
          params: {
            path: 'cart/items',
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Added to cart', 'Product has been added to your cart.');
      } else {
        Alert.alert('Unable to add', response.data.message);
      }
    } catch (error: any) {
      Alert.alert('Unable to add', error.response?.data?.message ?? 'Something went wrong.');
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loading}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {product.images?.length > 0 ? (
            product.images.map((image) => (
              <Image
                key={image.id}

                source={{
                  uri: image.image_url,
                }}

                style={styles.productImage}
              />
            ))
          ) : (
            <View style={styles.placeholder}>
              <Text
                style={{
                  fontSize: 60,
                }}>
                🚗
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.details}>
          <Text style={styles.brand}>{product.brand}</Text>

          <Text style={styles.name}>{product.name}</Text>

          <Text style={styles.sku}>SKU: {product.sku}</Text>

          <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>

          <Text style={styles.stock}>
            {product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}
          </Text>

          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          disabled={product.stock_quantity <= 0}

          style={[styles.addButton, product.stock_quantity <= 0 && styles.disabled]}

          onPress={addToCart}>
          <Text style={styles.addText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },

  back: {
    fontSize: 30,
  },

  productImage: {
    width: 400,
    height: 320,
    resizeMode: 'contain',
    backgroundColor: '#F3F4F6',
  },

  placeholder: {
    width: 400,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },

  details: {
    padding: 20,
  },

  brand: {
    color: '#6B7280',
    fontSize: 14,
  },

  name: {
    marginTop: 5,
    fontSize: 25,
    fontWeight: '900',
  },

  sku: {
    marginTop: 8,
    color: '#6B7280',
  },

  price: {
    marginTop: 15,
    fontSize: 27,
    fontWeight: '900',
    color: '#16A34A',
  },

  stock: {
    marginTop: 5,
    color: '#16A34A',
    fontWeight: '700',
  },

  description: {
    marginTop: 20,
    lineHeight: 23,
    color: '#374151',
  },

  bottom: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  addButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.5,
  },

  addText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});
