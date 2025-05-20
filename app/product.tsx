// app/products.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, FAB } from 'react-native-paper';
import api from '../lib/api';
import colors from '../theme/colors';


export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/products')
      .then((res) => setProducts(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <Card.Title title={item.attributes.name} subtitle={`Price: ${item.attributes.price}`} />
            <Card.Actions>
              <Button onPress={() => router.push(`/stocks?id=${item.id}`)}>View Stock</Button>
            </Card.Actions>
          </Card>
        )}
      />

<FAB
  icon="plus"
  style={{
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
  }}
  color="white"
  onPress={() => {
    // TODO: Show Add Stock Modal or navigate to add-stock screen
    console.log('FAB pressed – trigger Add Stock modal');
  }}
/>
    </View>
  );
}