import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  View,
  StyleProp,
  ViewStyle
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { IconSymbol, IconSymbolName } from './ui/IconSymbol';

interface SelectionCardProps {
  title: string;
  description?: string;
  isSelected: boolean;
  onSelect: () => void;
  icon?: IconSymbolName;
  style?: StyleProp<ViewStyle>;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  description,
  isSelected,
  onSelect,
  icon,
  style,
}) => {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <TouchableOpacity 
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <ThemedView 
        style={[
          styles.container, 
          {
            borderColor: isSelected ? tintColor : 'transparent',
            backgroundColor: isSelected 
              ? colorScheme === 'dark' 
                ? 'rgba(255, 255, 255, 0.15)' 
                : 'rgba(10, 126, 164, 0.15)'
              : Colors[colorScheme ?? 'light'].inputBackground,
            shadowColor: isSelected ? tintColor : '#000',
            shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
            shadowOpacity: isSelected ? 0.3 : 0.1,
            shadowRadius: isSelected ? 8 : 4,
            elevation: isSelected ? 6 : 2,
          },
          style
        ]}
      >
        <View style={styles.contentContainer}>
          {icon && (
            <IconSymbol 
              name={icon} 
              size={24} 
              color={isSelected ? tintColor : Colors[colorScheme ?? 'light'].icon} 
              style={styles.icon}
            />
          )}
          
          <View style={styles.textContainer}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            {description && (
              <ThemedText style={styles.description}>{description}</ThemedText>
            )}
          </View>
        </View>
        
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: tintColor }]}>
            <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
          </View>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
