import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TrackService() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Service Screen</Text>
      <Text>Track Service feature coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
});