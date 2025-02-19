import { StyleSheet, View, SectionList, Button, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';

const DATA = [
  { title: 'TEAM A', data: ['F. Icker', 'L. Van Belle', 'G. Lambert'] },
  { title: 'TEAM B', data: ['P. Lalune', 'R. Séchan', 'F. Gump'] },
  { title: 'TEAM C', data: ['E. Hunt', 'T. Rinner', 'B. Buck'] },
];

export default function TabTwoScreen() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const selectedItemColor = useThemeColor({}, 'tabIconSelected');

  const handleSelect = (item: string) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1, padding: 16 }}>
        <ThemedText style={styles.headerText}>Create New Activity</ThemedText>
        <ThemedTextInput placeholder="Activity Title" style={styles.input} />

        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <ThemedText style={styles.buttonText}>Next</ThemedText>
        </TouchableOpacity>

        {/* Selectable SectionList */}
        <SectionList
          sections={DATA}
          keyExtractor={(item, index) => item + index}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              style={[
                styles.itemContainer,
                { backgroundColor },
                selectedItems.includes(item) && { backgroundColor: selectedItemColor }
              ]}
            >
              <ThemedText style={[styles.itemText, { color: textColor }]}>{item}</ThemedText>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <ThemedText style={[styles.sectionHeader, { backgroundColor }]}>{title}</ThemedText>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  input: { height: 40, borderBottomWidth: 1, marginBottom: 10, paddingHorizontal: 8 },
  itemContainer: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  itemText: { fontSize: 16 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', padding: 10 },
  button: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});
