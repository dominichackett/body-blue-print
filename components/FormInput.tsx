import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  Platform,
  KeyboardTypeOptions
} from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface FormInputProps {
  label: string;
  value: string | number;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  suffix?: string;
  isRequired?: boolean;
  min?: number;
  max?: number;
  autoFocus?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  error,
  suffix,
  isRequired = false,
  min,
  max,
  autoFocus = false,
}) => {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = (text: string) => {
    // For numeric inputs, validate the input
    if (keyboardType === 'numeric' || keyboardType === 'number-pad') {
      // Allow empty string or valid numbers
      if (text === '' || /^\d*\.?\d*$/.test(text)) {
        onChangeText(text);
      }
    } else {
      onChangeText(text);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Validate min/max for numeric inputs when blurring
    if ((keyboardType === 'numeric' || keyboardType === 'number-pad') && value !== '') {
      const numValue = Number(value);
      if (min !== undefined && numValue < min) {
        onChangeText(min.toString());
      } else if (max !== undefined && numValue > max) {
        onChangeText(max.toString());
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.labelContainer}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {isRequired && <Text style={styles.required}>*</Text>}
      </View>
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: error 
                ? '#FF3B30' 
                : isFocused 
                  ? tintColor 
                  : Colors[colorScheme ?? 'light'].border,
              color: Colors[colorScheme ?? 'light'].text,
              backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
              shadowColor: isFocused ? tintColor : '#000',
              shadowOffset: { width: 0, height: isFocused ? 4 : 2 },
              shadowOpacity: isFocused ? 0.2 : 0.1,
              shadowRadius: isFocused ? 6 : 3,
              elevation: isFocused ? 4 : 2,
            },
          ]}
          value={value.toString()}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          autoFocus={autoFocus}
        />
        
        {suffix && (
          <View style={styles.suffixContainer}>
            <ThemedText style={styles.suffix}>{suffix}</ThemedText>
          </View>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
  required: {
    color: '#FF3B30',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  suffixContainer: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  suffix: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
});
