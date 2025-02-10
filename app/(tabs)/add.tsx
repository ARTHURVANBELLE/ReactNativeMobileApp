import { StyleSheet, View, Text, SectionList, Button, TextInput, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedTextInput} from '@/components/ThemedTextInput';

const DATA = [
  { title: 'TEAM A', data: ['F. Icker', 'L. Van Belle', 'G. Lambert'] },
  { title: 'TEAM B', data: ['P. Lalune', 'R. Séchan', 'F. Gump'] },
  { title: 'TEAM C', data: ['E. Hunt', 'T. Rinner', 'B. Buck'] },
];

export default function TabTwoScreen() {

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelect = (item:string) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ThemedText style={styles.headerText}>Create new activity</ThemedText>
        <TextInput placeholder="Activity Title" style={styles.input} />
        <Button title="Next" onPress={() => {}} />
        <p></p>

        {/* Selectable SectionList */}
        <SectionList
          sections={DATA}
          keyExtractor={(item, index) => item + index}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)} style={[styles.itemContainer, selectedItems.includes(item) && styles.selectedItem]}>
              <Text style={styles.itemText}>{item}</Text>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  input: { height: 40, borderBottomWidth: 1, marginBottom: 10, paddingHorizontal: 8 },
  itemContainer: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', backgroundColor: 'white' },
  itemText: { fontSize: 16 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', backgroundColor: '#f4f4f4', padding: 10 },
  selectedItem: { backgroundColor: '#d1e7ff' }, // Highlight selected item
});