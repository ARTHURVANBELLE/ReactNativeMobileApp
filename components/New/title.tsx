import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TitleProps {
  formData: {
    title: string;
    description: string;
    date: Date;
  };
  updateFormData: (data: Partial<{ title: string; description: string; date: Date }>) => void;
}

const Title: React.FC<TitleProps> = ({ formData, updateFormData }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date | undefined) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      updateFormData({ date: selectedDate });
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format date for web input
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <div style={webStyles.dateInputContainer}>
          <input
            type="date"
            style={webStyles.dateInput}
            value={formatDateForInput(formData.date)}
            onChange={(e) => {
              if (e.target.value) {
                onChangeDate(null, new Date(e.target.value));
              }
            }}
          />
          <div style={webStyles.calendarIconContainer}>📅</div>
        </div>
      );
    }

    return (
      <>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(formData.date)}</Text>
          <View style={styles.calendarIcon}>
            <Text style={styles.calendarIconText}>📅</Text>
          </View>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Details</Text>
      
      <View style={styles.formField}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => updateFormData({ title: text })}
          placeholder="Enter activity title"
        />
      </View>
      
      <View style={styles.formField}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => updateFormData({ description: text })}
          placeholder="Enter activity description"
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.formField}>
        <Text style={styles.label}>Date</Text>
        {renderDatePicker()}
      </View>
    </View>
  );
};

// Web-specific styles
const webStyles = {
  dateInputContainer: {
    position: 'relative' as 'relative',
    width: '100%',
  },
  dateInput: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '12px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box' as 'border-box',
    color: '#333',
    height: '48px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    paddingRight: '36px', // Space for the calendar icon
  },
  calendarIconContainer: {
    position: 'absolute' as 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as 'none',
    fontSize: '16px',
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  calendarIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIconText: {
    fontSize: 16,
  },
});

export default Title;