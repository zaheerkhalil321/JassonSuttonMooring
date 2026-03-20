import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import { apiClient } from '../services/ApiClient';
import {
  StaffLeave,
  LEAVE_STATUS_COLORS,
} from '../types';

interface Props {
  navigation: any;
  route: any;
}

type TabType = 'today' | 'upcoming7' | 'upcoming30';

const TABS: { key: TabType; label: string; icon: string; days?: number }[] = [
  { key: 'today', label: 'Today', icon: 'sunny-outline' },
  { key: 'upcoming7', label: 'Next 7 Days', icon: 'today-outline', days: 7 },
  { key: 'upcoming30', label: 'Next 30 Days', icon: 'calendar-outline', days: 30 },
];

function getDayDiff(startDate: string): string {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Starting today';
  if (diff === 1) return 'Starting tomorrow';
  if (diff < 0) return 'Ongoing';
  return `Starts in ${diff} days`;
}

function getLeaveDuration(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

const TeamOnLeaveScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [dataMap, setDataMap] = useState<Record<TabType, StaffLeave[]>>({
    today: [],
    upcoming7: [],
    upcoming30: [],
  });
  const [loadingMap, setLoadingMap] = useState<Record<TabType, boolean>>({
    today: false,
    upcoming7: false,
    upcoming30: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAllTabs();
    }, [])
  );

  const fetchAllTabs = async () => {
    await Promise.all([fetchTab('today'), fetchTab('upcoming7'), fetchTab('upcoming30')]);
    setRefreshing(false);
  };

  const fetchTab = async (tab: TabType) => {
    setLoadingMap((prev) => ({ ...prev, [tab]: true }));
    try {
      let res: any;
      if (tab === 'today') {
        res = await apiClient.getOnLeaveToday();
      } else {
        const days = tab === 'upcoming7' ? 7 : 30;
        res = await apiClient.getUpcomingLeaves(days);
      }
      if (res?.success) {
        setDataMap((prev) => ({ ...prev, [tab]: res.data as StaffLeave[] }));
      }
    } catch {
      Toast.show({ type: 'error', text1: `Failed to load ${tab} data` });
    } finally {
      setLoadingMap((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const currentData = dataMap[activeTab];
  const isLoading = loadingMap[activeTab];

  const renderLeaveItem = ({ item }: { item: StaffLeave }) => {
    const sc = LEAVE_STATUS_COLORS[item.status] ?? { bg: '#F3F4F6', text: '#374151' };
    const duration = getLeaveDuration(item.startDate, item.endDate);
    const dayDiff = getDayDiff(item.startDate);
    const staffName = (item.staff as any)?.name ?? 'Unknown Staff';
    const staffRole = (item.staff as any)?.role ?? '';

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 

        <View style={{ flex: 1, paddingLeft: 12 }}>
          {/* Staff info row */}
          <View style={styles.rowBetween}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: sc.bg + '25' }]}>
                <Text style={[styles.avatarText, { color: sc.bg }]}>
                  {staffName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.staffName, { color: theme.colors.text }]}>{staffName}</Text>
                {staffRole ? (
                  <Text style={[styles.staffRole, { color: theme.colors.placeholder }]}>
                    {staffRole.replace('_', ' ')}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.infoRow}>
            <Text style={[styles.dateRange, { color: theme.colors.placeholder }]}> 
              {new Date(item.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              {' → '}
              {new Date(item.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.rowBetween}>
            <Text style={[styles.dayDiff, { color: theme.colors.placeholder }]}>
              <Ionicons name="time-outline" size={12} color={theme.colors.placeholder} /> {dayDiff}
            </Text>
            <Text style={[styles.durationText, { color: theme.colors.placeholder }]}>
              {duration} day{duration !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const tabInfo = TABS.find((t) => t.key === activeTab)!;

  return (
    <View
            style={[styles.container, { backgroundColor: theme.colors.background }]}
          >
      <Header text="Team on Leave" navigation={navigation} />

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.tabActive, { borderBottomColor: theme.colors.primary }],
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={15}
              color={activeTab === tab.key ? theme.colors.primary : theme.colors.placeholder}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? theme.colors.primary : theme.colors.placeholder },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count pill */}
      {!isLoading && (
        <View style={styles.countRow}>
          <View style={[styles.countPill, { backgroundColor: theme.colors.primary + '18' }]}>
            <Ionicons name="people-outline" size={14} color={theme.colors.primary} />
            <Text style={[styles.countText, { color: theme.colors.primary }]}>
              {currentData.length} staff {tabInfo.key === 'today' ? 'on leave today' : `on leave in next ${tabInfo.days} days`}
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLeaveItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAllTabs();
              }}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="checkmark-circle-outline" size={50} color="#10B981" />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Everyone's at work!</Text>
              <Text style={[styles.emptyDesc, { color: theme.colors.placeholder }]}>
                {tabInfo.key === 'today'
                  ? 'No staff members are on leave today.'
                  : `No upcoming approved leaves in the next ${tabInfo.days} days.`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: { fontSize: 11, fontWeight: '600' },
  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  countText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 12,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  avatarContainer: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  staffName: { fontSize: 14, fontWeight: '700' },
  staffRole: { fontSize: 11, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  dateRange: { fontSize: 12 },
  dayDiff: { fontSize: 11 },
  durationText: { fontSize: 11 },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default TeamOnLeaveScreen;
