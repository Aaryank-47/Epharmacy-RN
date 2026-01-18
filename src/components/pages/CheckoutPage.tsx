import React from 'react';
import { View, Text, StyleSheet } from 'react-native';



const CheckoutPage: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default CheckoutPage;
