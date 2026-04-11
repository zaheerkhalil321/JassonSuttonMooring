import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme/ThemeContext';
import { apiClient } from '../services/ApiClient';
import Header from '../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';

// Simple date picker component (no external lib needed)
function DateRow({
  label,
  value,
  onPress,
  theme,
}: {
  label: string;
  value: string;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.dateRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={onPress}
    >
      <Text style={[styles.dateLabel, { color: theme.colors.placeholder }]}>{label}</Text>
      <View style={styles.dateRight}>
        <Text style={[styles.dateValue, { color: value ? theme.colors.text : theme.colors.placeholder }]}>
          {value || 'Select date'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

interface Props {
  navigation: any;
  route: any;
}

const ApplyLeaveScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const currentUser = route?.params?.currentUser;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [currentPicker, setCurrentPicker] = useState<'start' | 'end' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Support multiple leave ranges
  const [leaveRanges, setLeaveRanges] = useState<
    { startDate: string; endDate: string; reason: string }[]
  >([]);
  const [multiMode, setMultiMode] = useState(false);

  const validateForm = () => {
    if (!currentUser?.id) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return false;
    }
    if (!startDate) {
      Alert.alert('Validation', 'Please select a start date');
      return false;
    }
    if (!endDate) {
      Alert.alert('Validation', 'Please select an end date');
      return false;
    }
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (sd < today) {
      Alert.alert('Validation', 'Start date cannot be in the past');
      return false;
    }
    return true;
  };

  // date picker helpers (inside component so they can see state)
  const openPicker = (which: 'start' | 'end') => {
    setCurrentPicker(which);
    const base = which === 'start' ? startDate : endDate;
    setTempDate(base ? new Date(base) : new Date());
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setShowDatePicker(false);
        setCurrentPicker(null);
        return;
      }
      setShowDatePicker(false);
      if (selected) commitDate(selected);
    } else {
      if (selected) setTempDate(selected);
    }
  };

  const confirmDate = () => {
    commitDate(tempDate);
    setShowDatePicker(false);
  };

  const commitDate = (date: Date) => {
    // Use local date format to avoid UTC timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${day}`;

    if (currentPicker === 'start') {
      setStartDate(iso);
      if (endDate && new Date(endDate) < date) {
        setEndDate('');
      }
    } else if (currentPicker === 'end') {
      setEndDate(iso);
    }
    setCurrentPicker(null);
  };

  const getMinDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (currentPicker === 'end' && startDate) {
      const d = new Date(startDate);
      return d > today ? d : today;
    }
    return today;
  };

  const addToMulti = () => {
    if (!validateForm()) return;
    setLeaveRanges((prev) => [
      ...prev,
      { startDate, endDate, reason },
    ]);
    setStartDate('');
    setEndDate('');
    setReason('');
    Toast.show({ type: 'success', text1: 'Leave range added', text2: `${startDate} → ${endDate}` });
  };

  const removeRange = (idx: number) => {
    setLeaveRanges((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    let entries = leaveRanges;

    // If not in multi mode or ranges empty, use current form
    if (!multiMode || entries.length === 0) {
      if (!validateForm()) return;
      entries = [{ startDate, endDate, reason }];
    }

    try {
      setSubmitting(true);

      // Submit each leave one by one (backend also supports bulk)
      const results = await Promise.all(
        entries.map((e) =>
          apiClient.applyLeave({
            staffId: currentUser.id,
            startDate: e.startDate,
            endDate: e.endDate,
            reason: e.reason || undefined,
          })
        )
      );

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        const errorMessages = failed
          .map((r) => {
            // Check if error is about existing leave
            if (r.message?.includes('Leave already exists')) {
              return `${r.message}\n\nYou have already applied for leave on those dates.`;
            }
            return r.message || 'Failed to submit';
          })
          .join('\n');
        Alert.alert('Error', errorMessages);
      } else {
        Toast.show({
          type: 'success',
          text1: 'Leave Applied!',
          text2: `${entries.length} leave request${entries.length > 1 ? 's' : ''} submitted for approval.`,
        });
        // Clear form after successful submission
        setStartDate('');
        setEndDate('');
        setReason('');
        setLeaveRanges([]);
        setMultiMode(false);
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
         style={[styles.container, { backgroundColor: theme.colors.background }]}
       >
      <Header text="Apply for Leave" navigation={navigation} />

 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* dates and reason fields */}
        <DateRow label="Start Date" value={startDate} onPress={() => openPicker('start')} theme={theme} />
        <DateRow label="End Date" value={endDate} onPress={() => openPicker('end')} theme={theme} />

        {/* Reason */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>How many days (optional)</Text>
          <View
            style={[styles.textAreaWrap, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <TextInput
              style={[styles.textArea, { color: theme.colors.text }]}
              placeholder="How many days..."
              placeholderTextColor={theme.colors.placeholder}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.primary }]}>
            Your leave{leaveRanges.length > 1 ? 's' : ''} will be reviewed by admin and you'll be notified of the decision.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: theme.colors.primary },
            submitting && { opacity: 0.7 },
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>
                   Submit Leave{leaveRanges.length > 1 ? 's' : ''} Request
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      {/* Calendar modal (same style as create operation) */}
      {showDatePicker && (
        <Modal transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />
          <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              minimumDate={getMinDate()}
              style={styles.dateTimePicker}
              textColor={theme.colors.text}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, { backgroundColor: theme.colors.primary }]}
                onPress={confirmDate}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={[styles.footerButtonText, { marginLeft: 8 }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
     </View>
   );
};

// picker helpers
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldBlock: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  typeChipText: { fontSize: 13, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: { fontSize: 15 },
  textAreaWrap: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 100,
  },
  textArea: { fontSize: 15, minHeight: 80 },
  addRangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 6,
  },
  addRangeText: { fontSize: 14, fontWeight: '600' },
  rangesBlock: { marginBottom: 16 },
  rangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  rangeTitle: { fontSize: 14, fontWeight: '600' },
  rangeType: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  rangeReason: { fontSize: 12, marginTop: 2 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  dateLabel: { fontSize: 13, fontWeight: '600' },
  dateRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateValue: { fontSize: 14 },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    elevation: 5,
  },
  dateTimePicker: {
    width: '100%',
    height: 200,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ApplyLeaveScreen;
