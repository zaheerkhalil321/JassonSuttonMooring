import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  Dimensions,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { useTheme } from "../theme/ThemeContext";
import { apiClient } from "../services/ApiClient";
import Ionicons from "react-native-vector-icons/Ionicons";
import ModalDropdown from "../components/ModalDropdown";
import Header from "../components/Header";
import { format } from "date-fns";
import useSavedTime from "../hooks/useSavedTime";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { commentsHelper } from "../helper";

interface OperationsScreenProps {
  navigation: DrawerNavigationProp<any>;
}

interface DropdownOption {
  label: string;
  value: string;
}

interface FormData {
  agent: string;
  date: string;
  vessel: string;
  type: string;
  length: string;
  movement: string;
  staffIds: string[];
  berth: string;
  comments: string;
  invoiceNumber: string;
  orderStatus: string;
}

const OperationsScreen: React.FC<OperationsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSS")
  );
  const { parseTime, formatTime, formatDate } = useSavedTime();

  // Form data
  const [formData, setFormData] = useState<FormData>({
    agent: "",
    date: "",
    vessel: "",
    type: "",
    length: "",
    movement: "",
    staffIds: [],
    berth: "",
    comments: "",
    invoiceNumber: "",
    orderStatus: "",
  });

  // Dropdown data
  const [agents, setAgents] = useState<DropdownOption[]>([]);
  const [vessels, setVessels] = useState<DropdownOption[]>([]);
  const [types, setTypes] = useState<DropdownOption[]>([]);
  const [lengths, setLengths] = useState<DropdownOption[]>([]);
  const [movements, setMovements] = useState<DropdownOption[]>([]);
  const [staffs, setStaffs] = useState<DropdownOption[]>([]);
  const [berths, setBerths] = useState<DropdownOption[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<DropdownOption[]>([]);

  useEffect(() => {
    loadOperationData();
  }, []);

  const loadOperationData = async () => {
    try {
      setLoading(true);
      const [operationResponse, staffResponse] = await Promise.all([
        apiClient.getAllOperationData(),
        apiClient.getAllUsers(),
      ]);

      if (operationResponse.success && operationResponse.data) {
        const data = operationResponse.data as any;

        setAgents(
          data.agents?.map((a: any) => ({
            label: a.label,
            value: a.id?.toString() || a.value,
          })) || []
        );

        setVessels(
          data.vessels?.map((v: any) => ({
            label: v.label,
            value: v.id?.toString() || v.value,
          })) || []
        );

        setTypes(
          data.types?.map((t: any) => ({
            label: t.label,
            value: t.id?.toString() || t.value,
          })) || []
        );

        setLengths(
          data.lengths?.map((l: any) => ({
            label: l.label,
            value: l.id?.toString() || l.value,
          })) || []
        );

        setMovements(
          data.movements?.map((m: any) => ({
            label: m.label,
            value: m.id?.toString() || m.value,
          })) || []
        );

        setBerths(
          data.berths?.map((b: any) => ({
            label: b.label,
            value: b.id?.toString() || b.value,
          })) || []
        );

        setOrderStatuses(
          data.orderStatuses?.map((s: any) => ({
            label: s.label,
            value: s.id?.toString() || s.value,
          })) || []
        );
      }

      if (staffResponse.success && staffResponse.data) {
        const staffData = staffResponse.data as any;
        setStaffs(
          staffData.users?.map((s: any) => ({
            label: s.name,
            value: s.id?.toString(),
          })) || []
        );
      }
    } catch (error) {
      console.error("Failed to load operation data:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load operation data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const localISO = format(selectedDate!, "yyyy-MM-dd'T'HH:mm:ss.SSS");
    if (Platform.OS === "android") {
      // On Android, the picker automatically closes after selection
      if (event.type === "dismissed") {
        setShowDatePicker(false);
        setDatePickerMode("date");
        return;
      }

      setShowDatePicker(false);

      if (localISO) {
        setTempDate(localISO);

        if (datePickerMode === "date") {
          // After selecting date, show time picker
          setDatePickerMode("time");
          setShowDatePicker(true);
        } else {
          // After selecting time, save the final date and close
          setFormData((prev) => ({ ...prev, date: localISO }));
          setDatePickerMode("date");
        }
      }
    } else {
      // On iOS, datetime mode handles both in the modal
      if (localISO) {
        setTempDate(localISO);
        setFormData((prev) => ({ ...prev, date: localISO }));
      }
    }
  };

  const openDatePicker = () => {
    setTempDate(
      formData.date || format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSS")
    );
    setDatePickerMode("date");
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
    setDatePickerMode("date");
    // Reset tempDate to current formData.date or current date
    setTempDate(
      formData.date || format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSS")
    );
  };

  const confirmDate = () => {
    setFormData((prev) => ({ ...prev, date: tempDate }));
    setShowDatePicker(false);
  };

  const validateForm = () => {
    const required = [
      "agent",
      "vessel",
      "type",
      "berth",
      "orderStatus",
      "movement",
    ];
    for (const field of required) {
      if (!formData[field as keyof FormData]) {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } is required`,
        });
        return false;
      }
    }

    if (!formData.date) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Date is required",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const jobData = {
        agentId: formData.agent,
        scheduledDate: formData.date,
        startTime: formData.date,
        endTime: formData.date,
        vesselId: formData.vessel,
        typeId: formData.type,
        lengthId: formData.length ? parseInt(formData.length) : undefined,
        staffIds: formData.staffIds,
        movementId: formData.movement || undefined,
        berthId: formData.berth,
        orderStatusId: formData.orderStatus,
        comments: commentsHelper(formData.comments),
        invoiceNumber: commentsHelper(formData.invoiceNumber),
      };
      const formDataObj = new FormData();
      Object.keys(jobData).forEach((key) => {
        formDataObj.append(key, (jobData as Record<string, any>)[key]);
      });
      const response = await apiClient.createJob(formDataObj);

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Job created successfully!",
        });

        // Reset form
        setFormData({
          agent: "",
          date: "",
          vessel: "",
          type: "",
          length: "",
          movement: "",
          staffIds: [],
          berth: "",
          comments: "",
          invoiceNumber: "",
          orderStatus: "",
        });

        navigation.navigate("MainStack");
      } else {
        throw new Error(response.message || "Failed to create job");
      }
    } catch (error: any) {
      console.error("Failed to create job:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to create job",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading operation data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header text="Create Operation" navigation={navigation} />
      <KeyboardAwareScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollViewContent}
        bottomOffset={120}
        extraKeyboardSpace={120}
        enabled={true}
      >
        <View style={styles.formContainer}>
          {/* Agent */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Agent *
            </Text>
            <ModalDropdown
              items={agents}
              value={formData.agent}
              placeholder="Select Agent"
              onSelect={(item) =>
                setFormData((prev) => ({ ...prev, agent: item.value }))
              }
              disabled={showDatePicker}
            />
          </View>

          {/* Date */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Date & Time *
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: "#FFFFFF",
                },
              ]}
              onPress={openDatePicker}
            >
              <View style={styles.dateButtonContent}>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.dateText,
                    {
                      color: formData.date
                        ? theme.colors.text
                        : theme.colors.placeholder,
                    },
                  ]}
                >
                  {formData.date
                    ? `${formatDate(formData.date)} • ${formatTime(
                        formData.date,
                        "HH:mm"
                      )}`
                    : "Select Date & Time"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.placeholder}
              />
            </TouchableOpacity>
          </View>

          {/* Vessel */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Vessel *
            </Text>
            <ModalDropdown
              items={vessels}
              value={formData.vessel}
              placeholder="Select Vessel"
              onSelect={(item) =>
                setFormData((prev) => ({ ...prev, vessel: item.value }))
              }
              disabled={showDatePicker}
            />
          </View>

          {/* Type */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Type *
            </Text>
            <ModalDropdown
              items={types}
              value={formData.type}
              placeholder="Select Type"
              onSelect={(item) =>
                setFormData((prev) => ({ ...prev, type: item.value }))
              }
              disabled={showDatePicker}
            />
          </View>

          {/* Movement */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Movement
            </Text>
            <ModalDropdown
              items={movements}
              value={formData.movement}
              placeholder="Select Movement"
              onSelect={(item) =>
                setFormData((prev) => ({ ...prev, movement: item.value }))
              }
              disabled={showDatePicker}
            />
          </View>

          {/* Berth */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Berth *
            </Text>
            <ModalDropdown
              items={berths}
              value={formData.berth}
              placeholder="Select Berth"
              onSelect={(item) =>
                setFormData((prev) => ({ ...prev, berth: item.value }))
              }
              disabled={showDatePicker}
            />
          </View>

          {/* Staff */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Staff
            </Text>
            <ModalDropdown
              items={staffs}
              value={formData.staffIds}
              placeholder="Select Staff"
              multiple={true}
              onMultiSelect={(items) =>
                setFormData((prev) => ({
                  ...prev,
                  staffIds: items.map((item) => item.value),
                }))
              }
              onSelect={() => {}} // Required but not used for multiple
              disabled={showDatePicker}
            />
          </View>

          {/* Status */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Status *
            </Text>
            <ModalDropdown
              items={orderStatuses}
              value={formData.orderStatus}
              placeholder="Select Status"
              onSelect={(item) =>
                setFormData((prev) => ({ ...prev, orderStatus: item.value }))
              }
              disabled={showDatePicker}
            />
          </View>

          {/* Invoice Number */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Invoice Number
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
              placeholder="Enter invoice number"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.invoiceNumber}
              returnKeyType="done"
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, invoiceNumber: text }))
              }
            />
          </View>

          {/* Comments */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Comments
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  height: 100,
                },
              ]}
              placeholder="Enter additional comments..."
              placeholderTextColor={theme.colors.placeholder}
              value={formData.comments}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, comments: text }))
              }
              multiline
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Create Operation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Date Picker - Platform Specific Implementation */}
      {Platform.OS === "ios" ? (
        // iOS: Custom Modal with Spinner
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={closeDatePicker}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeDatePicker}
          >
            <TouchableOpacity
              style={[
                styles.modalContainer,
                { backgroundColor: theme.colors.card },
              ]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              {/* iOS Header */}
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <View style={styles.modalTitleContainer}>
                  <Ionicons
                    name="calendar"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.text }]}
                  >
                    Select Date & Time
                  </Text>
                </View>
              </View>

              {/* Selected Date/Time Display */}
              <View
                style={[
                  styles.selectedDateContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text
                  style={[
                    styles.selectedDateLabel,
                    { color: theme.colors.text },
                  ]}
                >
                  Current Selection:
                </Text>
                <Text
                  style={[
                    styles.selectedDateText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {tempDate.toLocaleString()}
                </Text>
              </View>

              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={new Date(tempDate)}
                  mode="datetime"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  style={styles.dateTimePicker}
                  textColor={theme.colors.text}
                />
              </View>

              {/* iOS Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.footerButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={confirmDate}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={[styles.footerButtonText, { marginLeft: 8 }]}>
                    Confirm Selection
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : (
        // Android: Native DateTimePicker without modal wrapper
        showDatePicker && (
          <DateTimePicker
            value={new Date(tempDate)}
            mode={datePickerMode}
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerSafeArea: {
    backgroundColor: "#45BBA5",
    height: Dimensions.get("window").height * 0.15,
    paddingHorizontal: 20,
    flexDirection: "row",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  dropdownContainer: {
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    textAlignVertical: "top",
  },
  submitButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    zIndex: 9999, // High z-index for web compatibility
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20, // Increased elevation for Android
    zIndex: 10000, // High z-index for web compatibility
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginLeft: 8,
  },
  modalButton: {
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  cancelButton: {
    // Additional styles for cancel button if needed
  },
  confirmButton: {
    fontWeight: "600",
  },
  datePickerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: "center",
    minHeight: 200,
  },
  dateTimePicker: {
    width: "100%",
    height: 200,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  footerButton: {
    flexDirection: "row",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  footerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Enhanced Modal styles
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: "center",
  },
  cancelHeaderButton: {
    backgroundColor: "transparent",
  },
  confirmHeaderButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  progressSteps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  progressStep: {
    alignItems: "center",
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressLine: {
    width: 60,
    height: 2,
    marginHorizontal: 10,
  },
  instructionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  instructionText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  selectedDateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedDateLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  continueButton: {
    flexDirection: "row",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
});

export default OperationsScreen;
