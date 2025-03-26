import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { IconSymbol, IconSymbolName } from './ui/IconSymbol';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: IconSymbolName;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  style,
  textStyle,
  fullWidth = false,
}) => {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  // Determine button styles based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? 'rgba(128, 128, 128, 0.3)' : tintColor,
          borderColor: 'transparent',
        };
      case 'secondary':
        return {
          backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(10, 126, 164, 0.1)',
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? 'rgba(128, 128, 128, 0.3)' : tintColor,
        };
      default:
        return {
          backgroundColor: disabled ? 'rgba(128, 128, 128, 0.3)' : tintColor,
          borderColor: 'transparent',
        };
    }
  };
  
  // Determine text color based on variant
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
      case 'outline':
        return disabled 
          ? 'rgba(128, 128, 128, 0.5)' 
          : tintColor;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        getButtonStyles(),
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#FFFFFF' : tintColor} 
          size="small" 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <IconSymbol 
              name={icon} 
              size={20} 
              color={getTextColor()} 
              style={styles.leftIcon} 
            />
          )}
          
          <ThemedText 
            style={[
              styles.text, 
              { color: getTextColor() },
              textStyle
            ]}
          >
            {title}
          </ThemedText>
          
          {icon && iconPosition === 'right' && (
            <IconSymbol 
              name={icon} 
              size={20} 
              color={getTextColor()} 
              style={styles.rightIcon} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
});
