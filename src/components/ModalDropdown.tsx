import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface DropdownItem {
  label: string;
  value: string;
}

interface ModalDropdownProps {
  items: DropdownItem[];
  value?: string | string[];
  placeholder?: string;
  onSelect: (item: DropdownItem) => void;
  onMultiSelect?: (items: DropdownItem[]) => void;
  style?: any;
  disabled?: boolean;
  multiple?: boolean;
}

const ModalDropdown: React.FC<ModalDropdownProps> = ({
  items,
  value,
  placeholder = 'Select an option',
  onSelect,
  onMultiSelect,
  style,
  disabled = false,
  multiple = false,
}) => {
  const {theme} = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Handle both single and multiple selection values
  const getSelectedValues = (): string[] => {
    if (multiple && Array.isArray(value)) {
      return value;
    } else if (!multiple && typeof value === 'string') {
      return value ? [value] : [];
    }
    return [];
  };
  
  const selectedValues = getSelectedValues();
  const selectedItems = items.filter(item => selectedValues.includes(item.value));

  const handleSelect = (item: DropdownItem) => {
    if (multiple && onMultiSelect) {
      const isSelected = selectedValues.includes(item.value);
      let newSelectedValues: string[];
      
      if (isSelected) {
        newSelectedValues = selectedValues.filter(v => v !== item.value);
      } else {
        newSelectedValues = [...selectedValues, item.value];
      }
      
      const newSelectedItems = items.filter(i => newSelectedValues.includes(i.value));
      onMultiSelect(newSelectedItems);
    } else {
      onSelect(item);
      setModalVisible(false);
    }
  };

  const handleDone = () => {
    setModalVisible(false);
  };

  const getDisplayText = () => {
    if (multiple) {
      if (selectedItems.length === 0) return placeholder;
      if (selectedItems.length === 1) return selectedItems[0].label;
      return `${selectedItems.length} selected`;
    } else {
      const selectedItem = items.find(item => item.value === value);
      return selectedItem ? selectedItem.label : placeholder;
    }
  };

  const renderItem = ({item}: {item: DropdownItem}) => {
    const isSelected = selectedValues.includes(item.value);
    
    return (
      <TouchableOpacity
        style={[
          styles.modalItem,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          },
          isSelected && {
            backgroundColor: theme.colors.primary + '20',
          },
        ]}
        onPress={() => handleSelect(item)}>
        <Text
          style={[
            styles.modalItemText,
            {color: theme.colors.text},
            isSelected && {
              color: theme.colors.primary,
              fontWeight: 'bold',
            },
          ]}>
          {item.label}
        </Text>
        {isSelected && (
          <Ionicons
            name={multiple ? "checkbox" : "checkmark"}
            size={20}
            color={theme.colors.primary}
          />
        )}
        {multiple && !isSelected && (
          <Ionicons
            name="square-outline"
            size={20}
            color={theme.colors.text + '40'}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.dropdown,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
          disabled && styles.disabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}>
        <Text
          style={[
            styles.dropdownText,
            {color: selectedItems.length > 0 ? theme.colors.text : theme.colors.text + '80'},
          ]}>
          {getDisplayText()}
        </Text>
        <Ionicons
          name={modalVisible ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.text}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.modalContainer,
              {backgroundColor: theme.colors.card},
            ]}>
            <View style={[styles.modalHeader, {borderBottomColor: theme.colors.border}]}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Select Option
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={item => item.value}
              style={styles.modalList}
              showsVerticalScrollIndicator={true}
              bounces={false}
            />
            {multiple && (
              <View style={[styles.modalFooter, {borderTopColor: theme.colors.border}]}>
                <TouchableOpacity
                  onPress={handleDone}
                  style={[styles.doneButton, {backgroundColor: theme.colors.primary}]}>
                  <Text style={[styles.doneButtonText, {color: 'white'}]}>
                    Done ({selectedItems.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const {height: screenHeight} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: screenHeight * 0.7,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: screenHeight * 0.5,
    borderRadius:12
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ModalDropdown;
