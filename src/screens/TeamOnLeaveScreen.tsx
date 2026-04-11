import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
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

type TabType = 'today' | 'upcoming7' | 'upcoming30' | 'upcoming90';

const TABS: { key: TabType; label: string; icon: string; days?: number }[] = [
  { key: 'today', label: 'Today', icon: 'sunny-outline' },
  { key: 'upcoming7', label: 'Next 7 Days', icon: 'today-outline', days: 7 },
  { key: 'upcoming30', label: 'Next 30 Days', icon: 'calendar-number-outline', days: 30 },
  { key: 'upcoming90', label: 'Next 90 Days', icon: 'calendar-outline', days: 90 },
];

function parseISODate(value: string): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

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
    upcoming90: [],
  });
  const [loadingMap, setLoadingMap] = useState<Record<TabType, boolean>>({
    today: false,
    upcoming7: false,
    upcoming30: false,
    upcoming90: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [rangeData, setRangeData] = useState<StaffLeave[]>([]);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const today = new Date();
  const [selStart, setSelStart] = useState<string>('');
  const [selEnd, setSelEnd] = useState<string>('');
  const [modalMonth, setModalMonth] = useState(today.getMonth() + 1);
  const [modalYear, setModalYear] = useState(today.getFullYear());

  useFocusEffect(
    useCallback(() => {
      fetchAllTabs();
    }, [])
  );

  const fetchAllTabs = async () => {
    await Promise.all([fetchTab('today'), fetchTab('upcoming7'), fetchTab('upcoming30'), fetchTab('upcoming90')]);
    setRefreshing(false);
  };

  const fetchRangeLeaves = async (startISO: string, endISO: string) => {
    setRangeLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = parseISODate(startISO);
      const end = parseISODate(endISO);

      if (end < start) {
        Toast.show({ type: 'error', text1: 'End date must be after start date' });
        setRangeData([]);
        return;
      }

      if (end < today) {
        setRangeData([]);
        return;
      }

      const totalDays = Math.max(1, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const [todayRes, upcomingRes] = await Promise.all([
        apiClient.getOnLeaveToday(),
        apiClient.getUpcomingLeaves(totalDays),
      ]);

      const merged = [
        ...((todayRes?.data as StaffLeave[]) || []),
        ...((upcomingRes?.data as StaffLeave[]) || []),
      ];
      const uniq = merged.filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx);
      const filtered = uniq.filter((leave) => {
        const ls = parseISODate(leave.startDate);
        const le = parseISODate(leave.endDate);
        return !(le < start || ls > end);
      });
      setRangeData(filtered);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load selected date range' });
      setRangeData([]);
    } finally {
      setRangeLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTab = async (tab: TabType) => {
    setLoadingMap((prev) => ({ ...prev, [tab]: true }));
    try {
      let res: any;
      if (tab === 'today') {
        res = await apiClient.getOnLeaveToday();
      } else {
        const days = tab === 'upcoming7' ? 7 : tab === 'upcoming30' ? 30 : 90;
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
  const isRangeMode = !!rangeStart;
  const visibleData = isRangeMode ? rangeData : currentData;
  const visibleLoading = isRangeMode ? rangeLoading : isLoading;

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
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '18' }]}>
                <Text style={[styles.avatarText, { color: theme.colors.primary, fontSize: 16, fontWeight: '800' }]}>
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
          <View style={[styles.infoRow, { marginTop: 10 }]}>
            <Text style={[styles.dateRange, { color: theme.colors.text, fontSize: 16, fontWeight: '700' }]}> 
              {new Date(item.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              {' → '}
              {new Date(item.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </Text>
          </View>

          {/* Footer */}
          <View style={[styles.rowBetween, { marginTop: 4, marginBottom: 2 }]}>
            <Text style={[styles.dayDiff, { color: theme.colors.placeholder, fontSize: 13, fontWeight: '500' }]}>
              <Ionicons name="time-outline" size={14} color={theme.colors.placeholder} /> {dayDiff}
            </Text>
            <Text style={[styles.durationText, { color: theme.colors.primary, fontSize: 14, fontWeight: '800' }]}>
              {duration} day{duration !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const tabInfo = TABS.find((t) => t.key === activeTab)!;
  const calDays = getCalendarDays(modalYear, modalMonth);
  const monthName = new Date(modalYear, modalMonth - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View
            style={[styles.container, { backgroundColor: theme.colors.background }]}
          >
      <Header text="Team on Leave" navigation={navigation} />

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && [styles.tabActive, { borderBottomColor: theme.colors.primary }],
              ]}
              onPress={() => {
                setActiveTab(tab.key);
                setRangeStart('');
                setRangeEnd('');
                setRangeData([]);
              }}
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
        </ScrollView>
      </View>

      <View style={styles.calendarIconRow}>
        <TouchableOpacity
          onPress={() => {
            setSelStart(rangeStart);
            setSelEnd(rangeEnd);
            setShowCalendarModal(true);
          }}
        >
          <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Count pill */}
      {!visibleLoading && (
        <View style={styles.countRow}>
          <View style={[styles.countPill, { backgroundColor: theme.colors.primary + '18' }]}>
            <Ionicons name="people-outline" size={14} color={theme.colors.primary} />
            <Text style={[styles.countText, { color: theme.colors.primary }]}>
              {visibleData.length} staff {isRangeMode ? `between ${rangeStart}${rangeEnd ? ` and ${rangeEnd}` : ''}` : tabInfo.key === 'today' ? 'on leave today' : `on leave in next ${tabInfo.days} days`}
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      {visibleLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={visibleData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLeaveItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                if (isRangeMode && rangeStart && rangeEnd) {
                  fetchRangeLeaves(rangeStart, rangeEnd);
                } else {
                  fetchAllTabs();
                }
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
                  : isRangeMode
                    ? 'No approved leaves in the selected date range.'
                    : `No upcoming approved leaves in the next ${tabInfo.days} days.`}
              </Text>
            </View>
          }
        />
      )}

      {showCalendarModal && (
        <Modal transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCalendarModal(false)}
          />
          <TouchableOpacity activeOpacity={1} style={[styles.modalContainer, { maxHeight: '75%' }]}>
            <View style={styles.calHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (modalMonth === 1) { setModalMonth(12); setModalYear((y) => y - 1); }
                  else setModalMonth((m) => m - 1);
                }}
              >
                <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calTitle, { color: theme.colors.text }]}>{monthName}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (modalMonth === 12) { setModalMonth(1); setModalYear((y) => y + 1); }
                  else setModalMonth((m) => m + 1);
                }}
              >
                <Ionicons name="chevron-forward" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.dayLabels}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Text key={d} style={[styles.dayLabel, { color: theme.colors.placeholder }]}>{d}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calDays.map((day, idx) => {
                if (!day) return <View key={idx} style={styles.dayCell} />;
                const cellDate = new Date(modalYear, modalMonth - 1, day);
                const iso = cellDate.toISOString().split('T')[0];
                let selected = false;
                if (selStart && selEnd) {
                  selected = new Date(iso) >= new Date(selStart) && new Date(iso) <= new Date(selEnd);
                } else if (selStart) {
                  selected = iso === selStart;
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dayCell, selected && { backgroundColor: theme.colors.primary + '20', borderRadius: 8 }]}
                    onPress={() => {
                      if (!selStart || (selStart && selEnd)) {
                        setSelStart(iso);
                        setSelEnd('');
                      } else {
                        if (new Date(iso) >= new Date(selStart)) setSelEnd(iso);
                        else setSelStart(iso);
                      }
                    }}
                  >
                    <Text style={[styles.dayNum, { color: selected ? theme.colors.primary : theme.colors.text }]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginHorizontal: 10 }}>
              <TouchableOpacity onPress={() => {
                setSelStart('');
                setSelEnd('');
                setRangeStart('');
                setRangeEnd('');
                setRangeData([]);
                setShowCalendarModal(false);
                fetchAllTabs();
              }}>
                <Text style={{ color: theme.colors.error }}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (selStart) {
                  const start = selStart;
                  const end = selEnd || selStart;
                  setRangeStart(start);
                  setRangeEnd(end);
                  fetchRangeLeaves(start, end);
                }
                setShowCalendarModal(false);
              }}>
                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
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
  calendarIconRow: {
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
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
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calTitle: { fontSize: 16, fontWeight: '700' },
  dayLabels: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayNum: { fontSize: 13 },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
