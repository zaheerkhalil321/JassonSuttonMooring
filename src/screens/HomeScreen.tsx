import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import NetInfo from "@react-native-community/netinfo";
import { AuthResponse, Job, statusColorsRN } from "../types";
import { apiClient } from "../services/ApiClient";
import { useTheme } from "../theme/ThemeContext";
import useSavedTime from "../hooks/useSavedTime";
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "../components/Header";

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  // Network state
  const [isConnected, setIsConnected] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const { formatTime, formatDate } = useSavedTime();
  const { theme } = useTheme();

  // Simple rotation animation for assigned jobs
  const rotationValue = useRef(new Animated.Value(0)).current;

  // Load user data from AsyncStorage
  const loadCurrentUser = async () => {
    try {
      const savedUser = await apiClient.getSavedUser();
      console.log("🚀 ~ loadCurrentUser ~ savedUser:", savedUser);
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  useEffect(() => {
    loadCurrentUser();

    // Start continuous rotation animation
    Animated.loop(
      Animated.timing(rotationValue, {
        toValue: 1,
        duration: 3000, // 3 seconds per rotation
        useNativeDriver: false, // Must be false for borderColor animation
      })
    ).start();
  }, []);

  const refreshJobsIfPossible = async () => {
    const hasToken = await apiClient.hasValidToken();
    if (hasToken && isConnected) {
      console.log("Connection restored, refreshing jobs...");
      fetchJobs(1);
    }
  };

  // Get current hour for greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 18
      ? "Good Afternoon"
      : "Good Evening";

  // Initial load only - check for valid token first
  useEffect(() => {
    const checkTokenAndFetch = async () => {
      const hasToken = await apiClient.hasValidToken();
      if (hasToken && isConnected) {
        fetchJobs(1);
      } else {
        setLoading(false);
        setIsInitialLoad(false);
        if (!hasToken) {
          console.log("No valid token available, skipping job fetch");
        }
      }
    };

    checkTokenAndFetch();
  }, [isConnected]);

  // Auto-refresh when screen comes into focus (except initial load)
  useFocusEffect(
    useCallback(() => {
      const checkAndRefresh = async () => {
        if (!isInitialLoad) {
          const hasToken = await apiClient.hasValidToken();
          if (hasToken && isConnected) {
            console.log("🔄 Screen focused - silently refreshing jobs");
            fetchJobs(1); // Refresh from first page
          }
        }
      };

      checkAndRefresh();
    }, [isInitialLoad, isConnected])
  );

  const fetchJobs = async (page: number = 1, append: boolean = false) => {
    try {
      // Check network connectivity
      if (!isConnected) {
        console.log("No internet connection, skipping job fetch");
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        return;
      }

      // Check for valid token
      const hasToken = await apiClient.hasValidToken();
      if (!hasToken) {
        console.log("No valid token available, skipping job fetch");
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
        return;
      }

      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log(`📡 Fetching jobs page ${page}...`);
      const response = await apiClient.getJobs(page);
      console.log("🚀 ~ fetchJobs ~ response:", response);

      if (response.success && response.data) {
        const { jobs: jobsData, pagination } = response.data;

        if (append && page > 1) {
          // Append new jobs for pagination
          setJobs((prevJobs) => [...prevJobs, ...jobsData]);
        } else {
          // Replace jobs for initial load or refresh
          setJobs(jobsData);
        }

        // Update pagination state
        setCurrentPage(pagination.currentPage);
        setHasNextPage(pagination.hasNextPage);
        setTotalItems(pagination.totalItems);

        console.log(
          `✅ Jobs loaded successfully: ${jobsData.length} jobs, page ${pagination.currentPage}`
        );
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.message || "Failed to load jobs",
        });
      }
    } catch (error) {
      console.error("❌ Error fetching jobs:", error);
      if (page === 1) {
        // Only show error toast on initial load
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load jobs",
        });
      }
    } finally {
      if (page === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
      setRefreshing(false);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  };

  // Filter jobs based on search query and show only active jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => job.status !== "completed")
      .filter((job) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          job.vessel?.label.toLowerCase().includes(query) ||
          job.type?.label.toLowerCase().includes(query) ||
          job.berth?.label.toLowerCase().includes(query) ||
          job.agent?.label.toLowerCase().includes(query) ||
          job.staffJobs?.some((sj) =>
            sj.staff.name.toLowerCase().includes(query)
          ) ||
          job.comments?.toLowerCase()?.includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      );
  }, [jobs, searchQuery]);

  // Get user's assigned jobs
  const userJobs = filteredJobs.filter(
    (job) =>
      currentUser &&
      job.staffJobs.some((sj) => sj.staffId === currentUser.user.id)
  );

  const otherJobs = filteredJobs.filter(
    (job) =>
      !currentUser ||
      !job.staffJobs.some((sj) => sj.staffId === currentUser.user.id)
  );

  const onRefresh = async () => {
    setRefreshing(true);
    console.log("🔄 Pull to refresh triggered");
    setCurrentPage(1);
    await fetchJobs(1); // Reset to first page
  };

  const loadMore = async () => {
    if (!loadingMore && hasNextPage) {
      console.log(`📄 Loading more jobs - page ${currentPage + 1}`);
      await fetchJobs(currentPage + 1, true);
    }
  };

  const handleDeleteJob = async (job: Job) => {
    const vesselName = job.vessel?.label || "this operation";
    
    Alert.alert(
      `Delete Job ${job.id}`,
      `Are you sure you want to delete the operation for "${vesselName}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingJobId(job.id.toString());
              
              const response = await apiClient.deleteJob(job.id.toString());
              
              if (response.success) {
                // Remove the job from the current jobs list
                setJobs((prevJobs) => 
                  prevJobs.filter((j) => j.id.toString() !== job.id.toString())
                );
                
                Toast.show({
                  type: "success",
                  text1: "Success",
                  text2: `Operation for "${vesselName}" deleted successfully`,
                });
              } else {
                throw new Error(response.message || "Failed to delete operation");
              }
            } catch (error: any) {
              console.error("Error deleting job:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Failed to delete operation",
              });
            } finally {
              setDeletingJobId(null);
            }
          },
        },
      ]
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading more jobs...
        </Text>
      </View>
    );
  };

  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    return (
      statusColorsRN[normalizedStatus as keyof typeof statusColorsRN] ||
      statusColorsRN.expected
    );
  };

  const renderJobCard = ({ item, index }: { item: Job; index: number }) => {
    const isUserJob =
      currentUser &&
      item.staffJobs.some((sj) => sj.staffId === currentUser.user.id);
    const isUnassigned = item.staffJobs.length === 0;
    const statusStyle = getStatusStyle(item.orderStatus.label);

    const baseCardStyle = [
      styles.jobCard,
      isUserJob
        ? styles.userJobCard
        : isUnassigned
        ? styles.unassignedJobCard
        : { ...styles.unassignedJobCard },
    ];

    // If it's a user job, show simple animated border
    if (isUserJob) {
      const colorInterpolate = rotationValue.interpolate({
        inputRange: [0, 0.33, 0.66, 1],
        outputRange: ["#45BBA5", "#3B82F6", "#8B5CF6", "#45BBA5"],
      });

      return (
        <View style={styles.glowCardWrapper}>
          <Animated.View
            style={[
              styles.animatedBorderContainer,
              {
                borderColor: colorInterpolate,
              },
            ]}
          >
            <TouchableOpacity
              style={[baseCardStyle, { borderWidth: 0, margin: 0 }]}
              onPress={() =>
                navigation.navigate("JobDetail", {
                  jobId: item.id,
                  currentUser: currentUser,
                })
              }
              activeOpacity={0.7}
            >
              {isUnassigned && (
                <View style={styles.unassignedIndicator}>
                  <Text style={styles.unassignedText}>UNASSIGNED</Text>
                </View>
              )}

              {/* Header */}
              <View style={styles.jobHeader}>
                <View style={styles.jobHeaderLeft}>
                  <Text
                    style={[styles.vesselName, isUserJob && styles.userJobText]}
                  >
                    {item.vessel.label}
                  </Text>
                  <Text style={styles.jobType}>{item.type.label}</Text>
                </View>
                <View style={styles.jobHeaderRight}>
                  <View style={[styles.statusBadge, statusStyle]}>
                    <Text
                      style={[styles.statusText, { color: statusStyle.color }]}
                    >
                      {item.orderStatus.label.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteJob(item);
                    }}
                    disabled={deletingJobId === item.id.toString()}
                  >
                    {deletingJobId === item.id.toString() ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Schedule */}
              <View style={styles.scheduleContainer}>
                <View style={[styles.scheduleRow, { marginBottom: 8 }]}>
                  <View style={styles.scheduleItem}>
                    <Text style={styles.scheduleLabel}>Date</Text>
                    <Text style={styles.scheduleValue}>
                      {formatDate(item.scheduledDate)}
                    </Text>
                  </View>
                  <View style={styles.scheduleItem}>
                    <Text style={styles.scheduleLabel}>Time</Text>
                    <Text style={styles.scheduleValue}>
                      {formatTime(item.scheduledDate)}
                    </Text>
                  </View>
                </View>
                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleItem}>
                    <Text style={styles.scheduleLabel}>Berth</Text>
                    <Text style={styles.scheduleValue}>{item.berth.label}</Text>
                  </View>
                  <View style={styles.scheduleItem}>
                    <Text style={styles.scheduleLabel}>Movement</Text>
                    <Text style={styles.scheduleValue}>
                      {item.movement.label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsContainer}>
                <Text style={styles.detailLabel}>
                  Agent:{" "}
                  <Text style={styles.detailValue}>{item.agent.label}</Text>
                </Text>
              </View>

              {/* Staff */}
              <View style={styles.staffContainer}>
                <Text style={styles.staffLabel}>Staff:</Text>
                {isUnassigned ? (
                  <View style={styles.noStaffContainer}>
                    <Text style={styles.noStaffText}>No staff assigned</Text>
                  </View>
                ) : (
                  <View style={styles.staffList}>
                    {item.staffJobs.map((staffJob, idx) => (
                      <Animated.View
                        key={staffJob.id}
                        style={[
                          styles.staffBadge,
                          currentUser &&
                          staffJob.staffId === currentUser.user.id
                            ? [
                                styles.currentUserBadge,
                                { backgroundColor: colorInterpolate },
                              ]
                            : {},
                        ]}
                      >
                        <Text
                          style={[
                            styles.staffName,
                            currentUser &&
                              staffJob.staffId === currentUser.user.id &&
                              styles.currentUserText,
                          ]}
                        >
                          {staffJob.staff.name}
                        </Text>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </View>

              {/* Comments */}
              {item.comments && item.comments != " " && (
                <View style={styles.commentsContainer}>
                  <Text style={styles.commentsLabel}>Comments:</Text>
                  <Text style={styles.commentsText}>
                    {item.comments.replace("_", " ")}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    } // Regular card without animation
    return (
      <TouchableOpacity
        style={baseCardStyle}
        onPress={() =>
          navigation.navigate("JobDetail", {
            jobId: item.id,
            currentUser: currentUser,
          })
        }
        activeOpacity={0.7}
      >
        {isUnassigned && (
          <View style={styles.unassignedIndicator}>
            <Text style={styles.unassignedText}>UNASSIGNED</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <Text style={[styles.vesselName, isUserJob && styles.userJobText]}>
              {item.vessel.label}
            </Text>
            <Text style={styles.jobType}>{item.type.label}</Text>
          </View>
          <View style={styles.jobHeaderRight}>
            <View style={[styles.statusBadge, statusStyle]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {item.orderStatus.label.replace("_", " ").toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteJob(item);
              }}
              disabled={deletingJobId === item.id.toString()}
            >
              {deletingJobId === item.id.toString() ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.scheduleContainer}>
          <View style={[styles.scheduleRow, { marginBottom: 8 }]}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Date</Text>
              <Text style={styles.scheduleValue}>
                {formatDate(item.scheduledDate)}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Time</Text>
              <Text style={styles.scheduleValue}>
                {formatTime(item.scheduledDate)}
              </Text>
            </View>
          </View>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Berth</Text>
              <Text style={styles.scheduleValue}>{item.berth.label}</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Movement</Text>
              <Text style={styles.scheduleValue}>{item.movement.label}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>
            Agent: <Text style={styles.detailValue}>{item.agent.label}</Text>
          </Text>
        </View>

        {/* Staff */}
        <View style={styles.staffContainer}>
          <Text style={styles.staffLabel}>Staff:</Text>
          {isUnassigned ? (
            <View style={styles.noStaffContainer}>
              <Text style={styles.noStaffText}>No staff assigned</Text>
            </View>
          ) : (
            <View style={styles.staffList}>
              {item.staffJobs.map((staffJob, idx) => (
                <View
                  key={staffJob.id}
                  style={[
                    styles.staffBadge,
                    currentUser &&
                      staffJob.staffId === currentUser.user.id &&
                      styles.currentUserBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.staffName,
                      currentUser &&
                        staffJob.staffId === currentUser.user.id &&
                        styles.currentUserText,
                    ]}
                  >
                    {staffJob.staff.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Comments */}
        {item.comments && item.comments !== " " && (
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsLabel}>Comments:</Text>
            <Text style={styles.commentsText}>
              {item.comments.replace("_", " ")}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header text={greeting} navigation={navigation} />
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          placeholder="Search jobs..."
          placeholderTextColor={theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          // show cross
        />
      </View>

      {/* Compact Stats */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {userJobs.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>
            My Jobs
          </Text>
        </View>

        <View
          style={[
            styles.statBox,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {filteredJobs.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>
            Total Jobs
          </Text>
        </View>
      </View>

      {/* Job List */}
      <FlatList
        data={[...userJobs, ...otherJobs]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderJobCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#45BBA5"
            colors={["#45BBA5"]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="small" color="#45BBA5" />
            ) : (
              <Text style={styles.emptyTitle}>No jobs found</Text>
            )}
          </View>
        )}
      />

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  userRole: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontStyle: "italic",
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#45BBA5",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  searchContainer: {
    marginBottom: 12,
    position: "relative",
    paddingHorizontal: 20,
    backgroundColor: "#F8FAFC",
    paddingTop: 16,
  },
  searchInput: {
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 45,
    fontSize: 15,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  clearButton: {
    position: "absolute",
    right: 16,
    top: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  clearText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#45BBA5",
  },
  userJobsCard: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  totalJobsCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#F8FAFC",
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    // marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  userJobCard: {
    borderWidth: 1.5,
    borderColor: "#45BBA5",
    backgroundColor: "#FAFFFE",
    shadowColor: "#45BBA5",
    shadowOpacity: 0.1,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  jobHeaderLeft: {
    flex: 1,
  },
  vesselName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  userJobText: {
    color: "#059669",
  },
  jobType: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scheduleContainer: {
    marginBottom: 16,
    marginHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scheduleItem: {
    flex: 1,
    alignItems: "flex-start",
    paddingRight: 8,
  },
  scheduleLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    flexWrap: "wrap",
  },
  detailsContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailValue: {
    color: "#1F2937",
    fontWeight: "500",
  },
  staffContainer: {
    marginBottom: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  staffLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  staffList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  staffBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  currentUserBadge: {
    backgroundColor: "#45BBA5",
  },
  staffName: {
    fontSize: 12,
    color: "#374151",
  },
  currentUserText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  commentsContainer: {
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  commentsLabel: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: "#92400E",
  },
  userJobIndicator: {
    position: "absolute",
    top: 6,
    right: 16,
  },
  userJobIndicatorText: {
    fontSize: 12,
    color: "#45BBA5",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  // Compact Stats Styles
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    backgroundColor: "#F8FAFC",
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Header Actions
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#374151",
  },

  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  logoutButtonText: {
    fontSize: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#6B7280",
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  themeToggle: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  themeToggleText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  logoutButtonModal: {
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutButtonModalText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#DC2626",
  },

  // New header styles

  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  appSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  jobCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  themeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  themeButtonText: {
    fontSize: 16,
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 10,
  },

  // Pagination styles
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },

  // Unassigned job styles - gray border design
  unassignedJobCard: {
    borderWidth: 2.5,
    borderColor: "#6B7280", // Gray border
    backgroundColor: "#F9FAFB", // Light gray background
    shadowColor: "#6B7280",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  unassignedIndicator: {
    backgroundColor: "#6B7280",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    margin:-1
  },
  unassignedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  noStaffContainer: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  noStaffText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },

  // Animated border styles for assigned jobs
  glowCardWrapper: {
    marginBottom: 12,
  },
  animatedBorderContainer: {
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#45BBA5", // Default color, will be animated
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  
  // Delete button styles
  jobHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeScreen;
