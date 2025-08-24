import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {Job, User, statusColorsRN, AuthResponse} from '../types';
import {apiClient} from '../services/ApiClient';
import useSavedTime from '../hooks/useSavedTime';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

interface JobDetailScreenProps {
  route: any;
  navigation: any;
}

const JobDetailScreen: React.FC<JobDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const {theme} = useTheme();
  const {jobId} = route.params;
  const [job, setJob] = useState<Job | null>({} as Job);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingComments, setUpdatingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<number>(1);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null);
  const [originalComment, setOriginalComment] = useState('');
  const [statuses, setStatuses] = useState<{
    id: number;
    label: string;
    value: string;
  }[]>([]);
  const { formatTime, formatDate } = useSavedTime();

  // Load current user from AsyncStorage
  const loadCurrentUser = async () => {
    try {
      const user = await apiClient.getSavedUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };
  const getJobStatus= async()=>{
    try {
      const response = await apiClient.getJobStatus();
      setStatuses(response.data?.order_status)
    } catch (error) {
      console.log("🚀 ~ getJobStatus ~ error:", error)
      
    }
  }

  // Check if current user is assigned to this job
  const isUserAssigned = job?.staffJobs?.some(sj => sj.staffId === currentUser?.user.id);

  useEffect(() => {
    loadCurrentUser();
    getJobStatus();
  }, []);

  useEffect(() => {
    if (job) {
      const comments = job.comments === ' ' ? '' : job.comments;
      setNewComment(comments);
      setOriginalComment(comments);
      
      // Find the matching status option
      const statusOption = statuses.find(option =>
        option.label.toLowerCase() === job.orderStatus?.label?.toLowerCase()
      );
      setSelectedStatus(statusOption?.id || 1);
    }
  }, [job]);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getJobById(jobId.toString());
      console.log("🚀 ~ fetchJobDetails ~ response:", response)
      
      if (response.success && response.data) {
        setJob(response.data?.job);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load job details',
        });
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load job details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!job || !isUserAssigned) {
      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: 'You can only update jobs assigned to you',
      });
      return;
    }

    try {
      setUpdating(true);
      
      const updateData: any = {};
      
      // Only include status if it's changed
      const currentStatusOption = statuses.find(option =>
        option.label.toLowerCase() === job.orderStatus?.label?.toLowerCase()
      );
      if (selectedStatus !== currentStatusOption?.id) {
        updateData.status = selectedStatus;
      }
      
      // Only include comments if it's changed
      const commentToSend = newComment?.trim() === '' ? '' : newComment.trim();
      if (commentToSend !== job.comments) {
        updateData.comments = commentToSend;
      }

      // Check if there are any changes
      if (Object.keys(updateData).length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No Changes',
          text2: 'No changes to update',
        });
        return;
      }
      const finalObj={
        id: jobId,
        agentId: job.agent?.id.toString() || "",
        scheduledDate: job.scheduledDate || "",
        vesselId: job.vessel?.id?.toString() || "",
        typeId: job.type?.id?.toString() || "",
        staffIds: job.staffJobs?.map((sj) => sj.staffId) || [],
        lengthId: job.length?.id?.toString() || "",
        movementId: job.movement?.id?.toString() || "",
        berthId: job.berth?.id?.toString() || "",
        comments: updateData.comments || job.comments,
        status: "PENDING",
        invoiceNumber: job.invoiceNumber || "",
        orderStatusId: updateData?.status ? updateData.status : job.orderStatus?.value?.toString() || "",
      }
      const response = await apiClient.updateJob(jobId.toString(), finalObj);

      if (response.success) {
        // Update local job state
        const updatedStatusOption = statuses.find(option => option.id === selectedStatus);
        setJob(prev => prev ? {
          ...prev,
          orderStatus: {
            ...prev.orderStatus,
            label: updatedStatusOption?.label || prev.orderStatus.label,
            value: updatedStatusOption?.value.toString() || prev.orderStatus.value,
          },
          comments: commentToSend,
          updatedAt: new Date().toISOString(),
        } : null);

        Toast.show({
          type: 'success',
          text1: 'Job Updated',
          text2: 'Job has been updated successfully',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: response.message || 'Failed to update job',
        });
      }
    } catch (error) {
      console.error('Error updating job:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Something went wrong. Please try again.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateComments = async () => {
    if (!job || !isUserAssigned) {
      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: 'You can only update jobs assigned to you',
      });
      return;
    }

    try {
      setUpdatingComments(true);
      
      const commentToSend = newComment?.trim() === '' ? '' : newComment?.trim();
      
      if (commentToSend === job.comments) {
        Toast.show({
          type: 'info',
          text1: 'No Changes',
          text2: 'Comments are unchanged',
        });
        return;
      }

  // jobData.agentId =
  //         operationData?.agents.find((opt) => opt.label === formData.agentId)
  //           ?.value || formData.agentId;
  //     if (formData.scheduledDate)
  //       jobData.scheduledDate = formData.scheduledDate;
  //     if (formData.vesselId) jobData.vesselId = formData.vesselId;
  //     if (formData.typeId) jobData.typeId = formData.typeId;
  //     if (formData.lengthId) jobData.lengthId = parseInt(formData.lengthId);
  //     jobData.staffIds = formData.staffIds;
  //     if (formData.movementId) jobData.movementId = formData.movementId;
  //     if (formData.berthId) jobData.berthId = formData.berthId;
  //     if (formData.orderStatus) jobData.orderStatusId = formData.orderStatus;
  //     if (formData.comments) jobData.comments = formData.comments;
  //     if (formData.status) jobData.status = formData.status;
  //     if (formData.invoiceNumber)
  //       jobData.invoiceNumber = formData.invoiceNumber;

   const finalObj={
        id: jobId,
        agentId: job.agent?.id.toString() || "",
        scheduledDate: job.scheduledDate || "",
        vesselId: job.vessel?.id?.toString() || "",
        typeId: job.type?.id?.toString() || "",
        staffIds: job.staffJobs?.map((sj) => sj.staffId) || [],
        lengthId: job.length?.id?.toString() || "",
        movementId: job.movement?.id?.toString() || "",
        berthId: job.berth?.id?.toString() || "",
        comments:commentToSend,
        status: "PENDING",
        invoiceNumber: job.invoiceNumber || "",
        orderStatusId:  selectedStatus.toString() || "1",
      }
      const response = await apiClient.updateJob(jobId.toString(), finalObj);
      
      if (response.success) {
        // Update local job state
        setJob(prev => prev ? {
          ...prev,
          comments: commentToSend,
          updatedAt: new Date().toISOString(),
        } : null);

        setOriginalComment(newComment);

        Toast.show({
          type: 'success',
          text1: 'Comments Updated',
          text2: 'Comments have been updated successfully',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: response.message || 'Failed to update comments',
        });
      }
    } catch (error) {
      console.error('Error updating comments:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Something went wrong. Please try again.',
      });
    } finally {
      setUpdatingComments(false);
    }
  };

  const getSelectedStatusLabel = () => {
    const option = statuses.find(opt => opt.id === selectedStatus);
    return option?.label || 'Select Status';
  };

  const hasCommentChanges = newComment?.trim() !== originalComment?.trim();


  const getStatusStyle = (status: string) => {
    const normalizedStatus = status?.toLowerCase()??'';
    return statusColorsRN[normalizedStatus as keyof typeof statusColorsRN] || statusColorsRN.expected;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#45BBA5" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Job Not Found</Text>
          <Text style={styles.errorMessage}>
            The requested job could not be found.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusStyle(job.orderStatus?.label);
  if(!job?.agent){
    //loading
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#45BBA5" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Custom Header with Back Button and Edit */}
      <SafeAreaView style={[styles.headerSafeArea, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              console.log('Edit button pressed, navigating to JobEdit');
              navigation.navigate('JobEdit', {jobId: job.id, job});
            }}>
            <Ionicons name="create-outline" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <Text style={[styles.vesselName, { fontSize: 20 }]}>{job.vessel?.label}</Text>
            <Text style={[styles.jobType, { fontSize: 14 }]}>{job.type?.label}</Text>
            <Text style={[styles.jobId, { fontSize: 12 }]}>Job #{job.id}</Text>
          </View>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={[styles.statusText, {color: statusStyle.color, fontSize: 12}]}>
              {job.orderStatus?.label?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* User Assignment Indicator */}
        {isUserAssigned && (
          <View style={styles.assignmentBadge}>
            <Text style={styles.assignmentText}>● Assigned to You</Text>
          </View>
        )}

        {/* Schedule Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleColumn}>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>{formatDate(job.scheduledDate)}</Text>
              </View>
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>{formatTime(job.scheduledDate)}</Text>
              </View>
            </View>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Berth</Text>
                <Text style={styles.scheduleValue}>{job.berth?.label}</Text>
              </View>
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Movement</Text>
                <Text style={styles.scheduleValue}>{job.movement?.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Operation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operation Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Agent:</Text>
            <Text style={styles.detailValue}>{job.agent?.label}</Text>
          </View>
        </View>

        {/* Staff Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Staff</Text>
          <View style={styles.staffList}>
            {job.staffJobs?.map((staffJob) => (
              <View
                key={staffJob.id}
                style={[
                  styles.staffCard,
                  staffJob.staffId === currentUser?.user?.id && styles.currentUserCard,
                ]}>
                <Text style={[
                  styles.staffName,
                  staffJob.staffId === currentUser?.user?.id && styles.currentUserName,
                ]}>
                  {staffJob.staff.name}
                </Text>
                <Text style={[
                  styles.staffEmail,
                  staffJob.staffId === currentUser?.user?.id && styles.currentUserEmail,
                ]}>
                  {staffJob.staff.email}
                </Text>
                {staffJob.staffId === currentUser?.user?.id && (
                  <Text style={styles.youLabel}>(You)</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Update Section - Only for assigned users */}
        {isUserAssigned && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Job Status</Text>
            
            {/* Status Dropdown */}
            <View style={styles.updateItem}>
              <Text style={styles.updateLabel}>Job Status:</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowStatusDropdown(true)}>
                <Text style={styles.dropdownButtonText}>
                  {getSelectedStatusLabel()}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Update Status Button */}
            <TouchableOpacity
              style={[styles.updateButton, updating && styles.updateButtonDisabled]}
              onPress={handleUpdateJob}
              disabled={updating}>
              {updating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                    style={styles.buttonSpinner}
                  />
                  <Text style={styles.updateButtonText}>Updating Status...</Text>
                </View>
              ) : (
                <Text style={styles.updateButtonText}>Update Status</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Comments Section - Prominent and Editable */}
        {isUserAssigned && (
          <View style={styles.prominentSection}>
            <Text style={styles.prominentSectionTitle}>Job Comments</Text>
            <Text style={styles.commentHint}>Add or update comments about this job</Text>
            
            <View style={styles.commentContainer}>
              <TextInput
                style={styles.prominentCommentInput}
                placeholder="Enter your comments here..."
                placeholderTextColor="#9CA3AF"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {hasCommentChanges && (
              <TouchableOpacity
                style={[styles.commentUpdateButton, updatingComments && styles.updateButtonDisabled]}
                onPress={handleUpdateComments}
                disabled={updatingComments}>
                {updatingComments ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                      style={styles.buttonSpinner}
                    />
                    <Text style={styles.updateButtonText}>Saving Comments...</Text>
                  </View>
                ) : (
                  <Text style={styles.updateButtonText}>Save Comments</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Current Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Comments</Text>
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsText}>
              {job.comments === '' ? 'No issues reported' : job.comments}
            </Text>
          </View>
        </View>

        {/* Job History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(job.createdAt).toLocaleDateString('en-US')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated:</Text>
            <Text style={styles.detailValue}>
              {new Date(job.updatedAt).toLocaleDateString('en-US')}
            </Text>
          </View>
          {job.invoiceNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice:</Text>
              <Text style={styles.detailValue}>{job.invoiceNumber}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Status Dropdown Modal */}
      <Modal
        visible={showStatusDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusDropdown(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Status</Text>
            <ScrollView>
              {statuses?.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                  selectedStatus === option.id && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedStatus(option.id);
                  setShowStatusDropdown(false);
                }}>
                <Text style={[
                  styles.modalOptionText,
                  selectedStatus === option.id && styles.modalOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSafeArea: {
    backgroundColor: "#45BBA5",
    height: Dimensions.get("window").height * (Platform.OS === 'ios' ? 0.15 : 0.12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 5 : 15,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  jobHeaderLeft: {
    flex: 1,
  },
  vesselName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobType: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  jobId: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  assignmentBadge: {
    backgroundColor: '#45BBA5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  assignmentText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  scheduleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  scheduleColumn: {
    flexDirection: 'column',
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  scheduleItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'left',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  staffList: {
    gap: 12,
  },
  staffCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentUserCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#45BBA5',
    borderWidth: 2,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  currentUserName: {
    color: '#059669',
  },
  staffEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentUserEmail: {
    color: '#059669',
  },
  youLabel: {
    fontSize: 12,
    color: '#45BBA5',
    fontWeight: '600',
    marginTop: 4,
  },
  updateItem: {
    marginBottom: 20,
  },
  updateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  statusOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#45BBA5',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: '#45BBA5',
    fontWeight: '600',
  },
  commentInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  updateButton: {
    backgroundColor: '#45BBA5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonSpinner: {
    marginRight: 8,
  },
  commentsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#45BBA5',
  },
  commentsText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth:1,
    borderBottomColor: '#E5E7EB',
  },
  modalOptionSelected: {
    backgroundColor: '#45BBA5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Prominent Comment Styles
  prominentSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#45BBA5',
  },
  prominentSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  commentHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  commentContainer: {
    marginBottom: 16,
  },
  prominentCommentInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  commentUpdateButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
});

export default JobDetailScreen;
