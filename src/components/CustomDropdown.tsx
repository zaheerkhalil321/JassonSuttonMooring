import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import DropDownPicker from 'react-native-dropdown-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface CustomDropdownProps {
  label: string;
  options: DropdownOption[];
  onSelect: (value: string | number) => void;
  selectedValue: string | number | null;
  placeholder: string;
  zIndex?: number;
  zIndexInverse?: number;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  onSelect,
  selectedValue,
  placeholder,
  zIndex = 1000,
  zIndexInverse = 1000,
}) => {
  const {theme} = useTheme();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(options);
  const [value, setValue] = useState(selectedValue);

  // Handle value change
  const handleValueChange = (val: any) => {
    if (val !== null) {
      onSelect(val);
    }
  };

  return (
    <View style={[styles.container, {zIndex}]}>
      <Text style={[styles.label, {color: theme.colors.text}]}>{label}</Text>

      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setItems}
        onChangeValue={handleValueChange}
        placeholder={placeholder}
        // Add item separators (dividers) with improved styling
        itemSeparator={true}
        itemSeparatorStyle={{
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          height: 1,
          marginHorizontal: 6,
        }}
        // Styling based on theme
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: 8,
          minHeight: 45,
        }}
        dropDownContainerStyle={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          borderRadius: 8,
          // Enhanced styling with subtle shadow
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.1,
          shadowRadius: 6,
          // Android shadow
          elevation: 3,
          // Better spacing
          paddingVertical: 8,
          // Maximum height to prevent overflow
          maxHeight: 200,
          position: 'relative',
          top: 0,
        }}
        // Use dropdown mode with fixes for Android
        listMode="SCROLLVIEW"
        // Style the scrollview to fix Android issues
        scrollViewProps={{
          nestedScrollEnabled: true,
          contentContainerStyle: {paddingBottom: 10},
          showsVerticalScrollIndicator: true,
          persistentScrollbar: true,
          // Android optimization
          removeClippedSubviews: true,
          // Prevent parent scroll interference
          onScrollBeginDrag: () => {
            // This helps prevent parent scrolling when dropdown is active
            return true;
          },
        }}
        // Better positioning
        bottomOffset={100}
        textStyle={{
          fontSize: 16,
          color: theme.colors.text,
        }}
        placeholderStyle={{
          color: theme.colors.placeholder,
        }}
        labelStyle={{
          color: theme.colors.text,
        }}
        selectedItemLabelStyle={{
          fontWeight: 'bold',
          color: theme.colors.primary,
        }}
        // Set icons
        ArrowDownIconComponent={() => (
          <Ionicons
            name="chevron-down"
            size={20}
            color={theme.colors.primary}
          />
        )}
        ArrowUpIconComponent={() => (
          <Ionicons name="chevron-up" size={20} color={theme.colors.primary} />
        )}
        TickIconComponent={() => (
          <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
        )}
        zIndex={zIndex}
        zIndexInverse={zIndexInverse}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default CustomDropdown;
