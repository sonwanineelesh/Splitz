import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Direct-split detail reuses the group screen: a `Direct` group IS the split
// (same balances/settlement logic, PRD Sec 39). This route just forwards.
export default function DirectSplitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/group/${id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Opening split…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: 'Geist_400Regular', fontSize: 15 },
});
