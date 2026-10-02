import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface RatingStarsProps {
  rating?: number | string;
  count?: number;
  size?: number;
  showNumericRating?: boolean;
}

export default function RatingStars({
  rating = 0,
  count = 0,
  size = 18,
  showNumericRating = true,
}: RatingStarsProps) {
  const numericRating = Number(rating) || 0;
  const rounded = Math.round(numericRating);

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => {
          const isActive = value <= rounded;
          return (
            <Ionicons
              key={value}
              name={isActive ? 'star' : 'star-outline'}
              size={size}
              color={isActive ? '#F59E0B' : '#CBD5E1'}
              style={styles.star}
            />
          );
        })}
      </View>

      {showNumericRating && (
        <Text style={[styles.rating, { fontSize: size * 0.85 }]}>{numericRating.toFixed(1)}</Text>
      )}

      {count > 0 && <Text style={[styles.count, { fontSize: size * 0.8 }]}>({count})</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  rating: {
    marginLeft: 6,
    fontWeight: '700',
    color: '#334155',
  },
  count: {
    marginLeft: 4,
    color: '#64748B',
  },
});
