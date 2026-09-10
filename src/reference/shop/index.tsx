import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';

import { useCallback, useEffect, useState } from 'react';

import { router } from 'expo-router';

import { api } from '../../../../src/api/client';

type Product = {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
};

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(
        '',

        {
          params: {
            path: 'shop/products',

            search,
          },
        }
      );

      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 400);

    return () => clearTimeout(timer);
  }, [loadProducts]);

  function renderProduct({ item }: { item: Product }) {
    return (
      <TouchableOpacity
        style={styles.card}

        onPress={() =>
          router.push({
            pathname: '/shop/product/[id]',

            params: {
              id: String(item.id),
            },
          })
        }>
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image
              source={{
                uri: item.image_url,
              }}

              style={styles.image}
            />
          ) : (
            <Text style={styles.imagePlaceholder}>🚗</Text>
          )}
        </View>

        <Text style={styles.brand}>{item.brand}</Text>

        <Text
          style={styles.name}

          numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>

        <Text style={item.stock_quantity > 0 ? styles.inStock : styles.outStock}>
          {item.stock_quantity > 0 ? `${item.stock_quantity} in stock` : 'Out of stock'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spare Parts</Text>

          <Text style={styles.subtitle}>Parts for your vehicle</Text>
        </View>

        <TouchableOpacity
          style={styles.cartButton}

          onPress={() => router.push('/shop/cart')}>
          <Text>🛒</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        value={search}

        onChangeText={setSearch}

        placeholder={'Search parts, brands or SKU...'}

        style={styles.search}
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <FlatList
          data={products}

          numColumns={2}

          keyExtractor={(item) => String(item.id)}

          renderItem={renderProduct}

          columnWrapperStyle={styles.row}

          contentContainerStyle={styles.list}

          ListEmptyComponent={
            <View style={styles.empty}>
              <Text>No products found.</Text>
            </View>
          }
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 3,
    color: '#6B7280',
  },

  cartButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  search: {
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  list: {
    paddingHorizontal: 12,
    paddingBottom: 30,
  },

  row: {
    justifyContent: 'space-between',
  },

  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },

  imageContainer: {
    height: 130,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  imagePlaceholder: {
    fontSize: 42,
  },

  brand: {
    marginTop: 9,
    fontSize: 12,
    color: '#6B7280',
  },

  name: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '700',
  },

  price: {
    marginTop: 7,
    fontSize: 18,
    fontWeight: '900',
    color: '#16A34A',
  },

  inStock: {
    marginTop: 3,
    fontSize: 12,
    color: '#16A34A',
  },

  outStock: {
    marginTop: 3,
    fontSize: 12,
    color: '#DC2626',
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
