import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import Toast from 'react-native-toast-message';
import {Job, User, statusColorsRN} from '../types';
import {apiClient} from '../services/ApiClient';
import {useTheme} from '../theme/ThemeContext';

const {width} = Dimensions.get('window');

interface HomeScreenProps {
  navigation: DrawerNavigationProp<any>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const {theme, isDarkMode, toggleDarkMode} = useTheme();

  // Load user data from AsyncStorage
  const loadCurrentUser = async () => {
    try {
      const savedUser = await apiClient.getSavedUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Get current hour for greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good Morning'
      : currentHour < 18
      ? 'Good Afternoon'
      : 'Good Evening';

  // Initial load only
  useEffect(() => {
    fetchJobs(true);
  }, []);

  // Auto-refresh when screen comes into focus (except initial load)
  useFocusEffect(
    useCallback(() => {
      if (!isInitialLoad) {
        console.log('🔄 Screen focused - silently refreshing jobs');
        fetchJobs(false); // Silent refresh
      }
    }, [isInitialLoad])
  );

  const fetchJobs = async (showLoader: boolean = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      
      console.log('📡 Fetching jobs...');
      const response = await apiClient.getJobs();
      
      if (response.success && response.data) {
        const jobsData = response.data as {
          todayJobs: Job[];
          futureJobs: Job[];
        };
        
        const allJobs = [
          ...(jobsData.todayJobs || []),
          ...(jobsData.futureJobs || []),
        ];
        
        setJobs(allJobs);
        console.log('✅ Jobs loaded successfully:', allJobs.length);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to load jobs',
        });
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      if (showLoader) { // Only show error toast on initial load/pull-to-refresh
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load jobs',
        });
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.logout();
              await apiClient.setToken(null);
              // Navigate to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              Toast.show({
                type: 'success',
                text1: 'Logged out successfully',
              });
            } catch (error) {
              console.error('Logout error:', error);
              Toast.show({
                type: 'error',
                text1: 'Logout failed',
                text2: 'Please try again',
              });
            }
          },
        },
      ]
    );
  };

  // Filter jobs based on search query and show only active jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter(job => job.status !== 'completed')
      .filter(job => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          job.vessel.label.toLowerCase().includes(query) ||
          job.type.label.toLowerCase().includes(query) ||
          job.berth.label.toLowerCase().includes(query) ||
          job.agent.label.toLowerCase().includes(query) ||
          job.staffJobs.some(sj =>
            sj.staff.name.toLowerCase().includes(query)
          ) ||
          job.comments.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [jobs, searchQuery]);

  // Get user's assigned jobs
  const userJobs = filteredJobs.filter(job =>
    currentUser && job.staffJobs.some(sj => sj.staffId === currentUser.id)
  );

  const otherJobs = filteredJobs.filter(job =>
    !currentUser || !job.staffJobs.some(sj => sj.staffId === currentUser.id)
  );

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Pull to refresh triggered');
    await fetchJobs(false); // Don't show main loader on pull-to-refresh
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    return statusColorsRN[normalizedStatus as keyof typeof statusColorsRN] || statusColorsRN.expected;
  };

  const renderJobCard = ({item, index}: {item: Job; index: number}) => {
    const isUserJob = currentUser && item.staffJobs.some(sj => sj.staffId === currentUser.id);
    const statusStyle = getStatusStyle(item.orderStatus.label);

    return (
      <TouchableOpacity
        style={[
          styles.jobCard,
          isUserJob && styles.userJobCard,
        ]}
        onPress={() => navigation.navigate('JobDetail', {jobId: item.id, currentUser: currentUser})}
        activeOpacity={0.7}>
        
        {/* Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <Text style={[styles.vesselName, isUserJob && styles.userJobText]}>
              {item.vessel.label}
            </Text>
            <Text style={styles.jobType}>{item.type.label}</Text>
          </View>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={[styles.statusText, {color: statusStyle.color}]}>
              {item.orderStatus.label.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>Date</Text>
            <Text style={styles.scheduleValue}>{formatDate(item.scheduledDate)}</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>Time</Text>
            <Text style={styles.scheduleValue}>{formatTime(item.scheduledDate)}</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>Berth</Text>
            <Text style={styles.scheduleValue}>{item.berth.label}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Movement: <Text style={styles.detailValue}>{item.movement.label}</Text></Text>
          <Text style={styles.detailLabel}>Agent: <Text style={styles.detailValue}>{item.agent.label}</Text></Text>
        </View>

        {/* Staff */}
        <View style={styles.staffContainer}>
          <Text style={styles.staffLabel}>Staff:</Text>
          <View style={styles.staffList}>
            {item.staffJobs.map((staffJob, idx) => (
              <View
                key={staffJob.id}
                style={[
                  styles.staffBadge,
                  currentUser && staffJob.staffId === currentUser.id && styles.currentUserBadge,
                ]}>
                <Text style={[
                  styles.staffName,
                  currentUser && staffJob.staffId === currentUser.id && styles.currentUserText,
                ]}>
                  {staffJob.staff.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Comments */}
        {item.comments && item.comments !== 'no_issues' && (
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsLabel}>Comments:</Text>
            <Text style={styles.commentsText}>
              {item.comments.replace('_', ' ')}
            </Text>
          </View>
        )}

        {/* {isUserJob && (
          <View style={styles.userJobIndicator}>
            <Text style={styles.userJobIndicatorText}>● Your Job</Text>
          </View>
        )} */}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border}]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, {color: theme.colors.placeholder}]}>
              {greeting},
            </Text>
            <Text style={[styles.userName, {color: theme.colors.text}]}>
              {currentUser?.name || 'User'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toggleDarkMode}>
              <Text style={styles.actionButtonText}>
                {isDarkMode ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.openDrawer()}>
              <Text style={styles.menuButtonText}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Simple Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }
            ]}
            placeholder="Search jobs..."
            placeholderTextColor={theme.colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearText, {color: theme.colors.placeholder}]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Simple Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
            <Text style={[styles.statValue, {color: theme.colors.primary}]}>{userJobs.length}</Text>
            <Text style={[styles.statLabel, {color: theme.colors.placeholder}]}>My Jobs</Text>
          </View>
          
          <View style={[styles.statBox, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
            <Text style={[styles.statValue, {color: theme.colors.primary}]}>{filteredJobs.length}</Text>
            <Text style={[styles.statLabel, {color: theme.colors.placeholder}]}>Total Jobs</Text>
          </View>
        </View>
      </View>

      {/* Job List */}
      <FlatList
        data={[...userJobs, ...otherJobs]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderJobCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#45BBA5"
            colors={['#45BBA5']}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'No jobs scheduled for today'}
            </Text>
          </View>
        )}
      />

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#45BBA5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  searchInput: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#45BBA5',
  },
  userJobsCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  totalJobsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    fontSize: 20,
  },
  listContent: {
    padding: 20,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  userJobCard: {
    borderWidth: 2,
    borderColor: '#45BBA5',
    backgroundColor: '#F0FDF4',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobHeaderLeft: {
    flex: 1,
  },
  vesselName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userJobText: {
    color: '#059669',
  },
  jobType: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  scheduleItem: {
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    color: '#1F2937',
    fontWeight: '500',
  },
  staffContainer: {
    marginBottom: 12,
  },
  staffLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  staffList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  staffBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  currentUserBadge: {
    backgroundColor: '#45BBA5',
  },
  staffName: {
    fontSize: 12,
    color: '#374151',
  },
  currentUserText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  commentsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  commentsLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: '#92400E',
  },
  userJobIndicator: {
    position: 'absolute',
    top: 6,
    right: 16,
  },
  userJobIndicatorText: {
    fontSize: 12,
    color: '#45BBA5',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Simple Stats Styles
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Header Actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: 'bold',
  },
    
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  logoutButtonText: {
    fontSize: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  themeToggle: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  themeToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  logoutButtonModal: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonModalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
  },
});

export default HomeScreen;
