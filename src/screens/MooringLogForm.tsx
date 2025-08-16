import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import CustomDropdown from '../components/CustomDropdown';
import {
  agentOptions,
  vesselOptions,
  typeOptions,
  materialOptions,
} from '../utils/dropdownData';
import {
  MooringLogFormData,
  DateOption,
  LengthOption,
  Berth,
  Staff,
  Comment,
} from '../types';
import {useTheme} from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MooringLogForm: React.FC = () => {
  const {theme} = useTheme();

  const [formData, setFormData] = useState<MooringLogFormData>({
    agent: null,
    date: null,
    vessel: null,
    type: null,
    length: null,
    material: null,
    berth: null,
    staff: null,
    comments: null,
  });

  // Generate dates for the last 30 days
  const dateOptions: DateOption[] = Array.from({length: 30}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      label: date.toLocaleDateString(),
      value: date.toISOString().split('T')[0],
    };
  });

  // Generate numbers 1-100 for length options
  const lengthOptions: LengthOption[] = Array.from({length: 100}, (_, i) => ({
    label: `${i + 1} m`,
    value: i + 1,
  }));

  // Generate berth options
  const berthOptions: Berth[] = [
    {label: '27', value: '27'},
    {label: '28', value: '28'},
    {label: 'JU', value: 'JU'},
    {label: '31', value: '31'},
    {label: '32', value: '32'},
    {label: '33', value: '33'},
    {label: '34', value: '34'},
    {label: '35', value: '35'},
    {label: '37', value: '37'},
    {label: '39', value: '39'},
    {label: 'M1', value: 'M1'},
    {label: 'M2', value: 'M2'},
    {label: 'M3', value: 'M3'},
    {label: 'M4', value: 'M4'},
    {label: '46', value: '46'},
    {label: '47', value: '47'},
    {label: 'Other', value: 'Other'},
  ];

  // Staff options
  const staffOptions: Staff[] = [
    {label: 'Add', value: 'add'},
    {label: 'Drop', value: 'drop'},
  ];

  // Comments options
  const commentOptions: Comment[] = [
    {label: 'No issues', value: 'no_issues'},
    {label: 'Maintenance required', value: 'maintenance'},
    {label: 'Damaged line', value: 'damaged'},
    {label: 'Custom...', value: 'custom'},
  ];

  const handleFormChange = <K extends keyof MooringLogFormData>(
    field: K,
    value: MooringLogFormData[K],
  ): void => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value,
    }));
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      nestedScrollEnabled={true}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Mooring Log
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <CustomDropdown
          label="Agent"
          options={agentOptions}
          onSelect={value => handleFormChange('agent', value as string)}
          selectedValue={formData.agent}
          placeholder="Select Agent"
          zIndex={9000}
          zIndexInverse={1000}
        />

        <CustomDropdown
          label="Date"
          options={dateOptions}
          onSelect={value => handleFormChange('date', value as string)}
          selectedValue={formData.date}
          placeholder="Select Date"
          zIndex={8000}
          zIndexInverse={2000}
        />

        <CustomDropdown
          label="Vessel Name"
          options={vesselOptions}
          onSelect={value => handleFormChange('vessel', value as string)}
          selectedValue={formData.vessel}
          placeholder="Select Vessel"
          zIndex={7000}
          zIndexInverse={3000}
        />

        <CustomDropdown
          label="Type"
          options={typeOptions}
          onSelect={value => handleFormChange('type', value as string)}
          selectedValue={formData.type}
          placeholder="Select Type"
          zIndex={6000}
          zIndexInverse={4000}
        />

        <CustomDropdown
          label="Length"
          options={lengthOptions}
          onSelect={value => handleFormChange('length', value as number)}
          selectedValue={formData.length}
          placeholder="Select Length"
          zIndex={5000}
          zIndexInverse={5000}
        />

        <CustomDropdown
          label="Material"
          options={materialOptions}
          onSelect={value => handleFormChange('material', value as string)}
          selectedValue={formData.material}
          placeholder="Select Material"
          zIndex={4000}
          zIndexInverse={6000}
        />

        <CustomDropdown
          label="Berth"
          options={berthOptions}
          onSelect={value => handleFormChange('berth', value as string)}
          selectedValue={formData.berth}
          placeholder="Select Berth"
          zIndex={3000}
          zIndexInverse={7000}
        />

        <CustomDropdown
          label="Staff"
          options={staffOptions}
          onSelect={value => handleFormChange('staff', value as string)}
          selectedValue={formData.staff}
          placeholder="Select Staff"
          zIndex={2000}
          zIndexInverse={8000}
        />

        <CustomDropdown
          label="Comments"
          options={commentOptions}
          onSelect={value => handleFormChange('comments', value as string)}
          selectedValue={formData.comments}
          placeholder="Add Comments"
          zIndex={1000}
          zIndexInverse={9000}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  themeToggle: {
    padding: 10,
    borderRadius: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
});

export default MooringLogForm;
