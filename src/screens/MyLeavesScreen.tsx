import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
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
  LeaveStatus,
  LEAVE_STATUS_COLORS,
} from '../types';

interface Props {
  navigation: any;
  route: any;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function isDateInLeave(date: Date, leave: StaffLeave) {
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

const MyLeavesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const currentUser = route?.params?.currentUser;

  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<{ totalAllocated: number; usedDays: number; remainingDays: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'ALL'>('ALL');
  const [cancelling, setCancelling] = useState<number | null>(null);

  // filtering by calendar range
  const today = new Date();
  const [filterStart, setFilterStart] = useState<string>('');
  const [filterEnd, setFilterEnd] = useState<string>('');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selStart, setSelStart] = useState<string>('');
  const [selEnd, setSelEnd] = useState<string>('');
  const [modalMonth, setModalMonth] = useState(today.getMonth() + 1);
  const [modalYear, setModalYear] = useState(today.getFullYear());

  useFocusEffect(
    useCallback(() => {
      fetchMyLeaves();
    }, [])
  );

  const fetchMyLeaves = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const [res, balanceRes] = await Promise.all([
        apiClient.getMyLeaves(currentUser.id),
        apiClient.getLeaveBalance(currentUser.id)
      ]);
      
      if (res.success) {
        setLeaves(res.data as StaffLeave[]);
      }
      if (balanceRes.success) {
        setBalanceInfo(balanceRes.data);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load your leaves' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancel = (leave: StaffLeave) => {
    Alert.alert(
      'Cancel Leave',
      `Are you sure you want to cancel this leave request (${new Date(leave.startDate).toLocaleDateString()} → ${new Date(leave.endDate).toLocaleDateString()})?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(leave.id);
              const res = await apiClient.cancelLeave(leave.id);
              console.log("🚀 ~ handleCancel ~ res:", res)
              if (res.success) {
                setLeaves((prev) =>
                  prev.map((l) =>
                    l.id === leave.id ? { ...l, status: 'CANCELLED' } : l
                  )
                );
                Toast.show({ type: 'success', text1: 'Leave cancelled' });
              } else {
                Toast.show({ type: 'error', text1: res.message || 'Failed to cancel' });
              }
            } finally {
              setCancelling(null);
            }
          },
        },
      ]
    );
  };

  const filteredLeaves =
    statusFilter === 'ALL' ? leaves : leaves.filter((l) => l.status === statusFilter);

  const displayedLeaves = useMemo(() => {
    if (!filterStart) return filteredLeaves;
    const start = new Date(filterStart);
    const end = filterEnd ? new Date(filterEnd) : start;
    return filteredLeaves.filter((l) => {
      const ls = new Date(l.startDate);
      const le = new Date(l.endDate);
      return !(le < start || ls > end);
    });
  }, [filteredLeaves, filterStart, filterEnd]);

  const renderLeaveCard = ({ item }: { item: StaffLeave }) => {
    const statusColors = LEAVE_STATUS_COLORS[item.status] ?? { bg: '#F3F4F6', text: '#374151' };
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}> 
            <Text style={[styles.dateRange, { color: theme.colors.text }]}> 
              {start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' → '}
              {end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
            <Text style={[styles.duration, { color: theme.colors.placeholder }]}> 
              {days} day{days !== 1 ? 's' : ''}
            </Text>
          </View>
           <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}> 
             <Text style={[styles.statusText, { color: statusColors.text }]}>{item.status}</Text>
           </View>
         </View>

         {/* Reason */}
         {item.reason ? (
           <Text style={[styles.reason, { color: theme.colors.placeholder }]} numberOfLines={2}>
             {item.reason}
           </Text>
         ) : null}

         {/* Admin note */}
         {item.adminNote ? (
           <View style={[styles.adminNoteBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B30' }]}> 
             <Ionicons name="chatbubble-ellipses-outline" size={13} color="#92400E" />
             <Text style={styles.adminNoteText}>{item.adminNote}</Text>
           </View>
         ) : null}

         {/* Cancel button for pending leaves */}
         {item.status === 'PENDING' && (
           <TouchableOpacity
             style={[styles.cancelBtn, { borderColor: theme.colors.error }]}
             onPress={() => handleCancel(item)}
             disabled={cancelling === item.id}
           >
             {cancelling === item.id ? (
               <ActivityIndicator size="small" color={theme.colors.error} />
             ) : (
               <>
                 <Ionicons name="close-circle-outline" size={15} color={theme.colors.error} />
                 <Text style={[styles.cancelText, { color: theme.colors.error }]}>Cancel Request</Text>
               </>
             )}
           </TouchableOpacity>
         )}
      </View>
    );
  };

  // Calendar
  const calDays = getCalendarDays(modalYear, modalMonth);
  const monthName = new Date(modalYear, modalMonth - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View
            style={[styles.container, { backgroundColor: theme.colors.background }]}
          >
      <Header text="My Leaves" navigation={navigation} />

      {/* status chips horizontal list */}
      <View style={{ paddingVertical: 8 }}>
        <FlatList
          data={(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as (LeaveStatus | 'ALL')[])}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => s}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item: s }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                { marginRight: 8 },
                {
                  backgroundColor: statusFilter === s ? theme.colors.primary : theme.colors.card,
                  borderColor: statusFilter === s ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.filterChipText, { color: statusFilter === s ? '#fff' : theme.colors.text }]}> {s} </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Leave Balance Section */}
      {balanceInfo && (
        <View style={{ marginHorizontal: 16, marginBottom: 8, padding: 14, backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border + '80', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 13, color: theme.colors.placeholder, fontWeight: '600', marginBottom: 4 }}>Annual Leave Balance</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: theme.colors.text }}>{balanceInfo.remainingDays} <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.placeholder }}>days left</Text></Text>
          </View>
          <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
             <Text style={{ fontSize: 12, color: theme.colors.placeholder, fontWeight: '500' }}>Taken: <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{balanceInfo.usedDays}d</Text></Text>
             <Text style={{ fontSize: 12, color: theme.colors.placeholder, fontWeight: '500', marginTop: 2 }}>Allowance: <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{balanceInfo.totalAllocated}d</Text></Text>
          </View>
        </View>
      )}
      {/* calendar icon below chips */}
      <View style={{ paddingHorizontal: 16, alignItems: 'flex-end', paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => setShowCalendarModal(true)}>
          <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {filterStart ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ color: theme.colors.placeholder, fontSize: 12 }}>
            Showing leaves from {filterStart}{filterEnd ? ` to ${filterEnd}` : ''}
          </Text>
        </View>
      ) : null}

      {/* LIST VIEW */}
      <>
        {/* Status filter chips */}
        {/* already rendered above */}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
        ) : (
          <FlatList
              data={displayedLeaves}
               keyExtractor={(item) => String(item.id)}
               renderItem={renderLeaveCard}
               contentContainerStyle={styles.listContent}
               refreshControl={
                 <RefreshControl
                   refreshing={refreshing}
                   onRefresh={() => { setRefreshing(true); fetchMyLeaves(); }}
                   tintColor={theme.colors.primary}
                 />
               }
               ListEmptyComponent={
                 <View style={styles.emptyBox}>
                   <Ionicons name="calendar-outline" size={48} color={theme.colors.border} />
                   <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No leaves found</Text>
                   <Text style={[styles.emptyDesc, { color: theme.colors.placeholder }]}> 
                     You haven't applied for any {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} leaves yet.
                   </Text>
                   <TouchableOpacity
                     style={[styles.applyNowBtn, { backgroundColor: theme.colors.primary }]}
                     onPress={() => navigation.navigate('ApplyLeave', { currentUser })}
                   >
                     <Text style={styles.applyNowText}>Apply for Leave</Text>
                   </TouchableOpacity>
                 </View>
               }
             />
        )}
      </>

      {/* calendar filter modal */}
      {showCalendarModal && (
        <Modal transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCalendarModal(false)}
          />
          <TouchableOpacity activeOpacity={1} style={[styles.modalContainer, { maxHeight: '75%' }]}> 
            {/* month nav */}
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
            {/* day labels */}
            <View style={styles.dayLabels}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d)=>(
                <Text key={d} style={[styles.dayLabel,{color:theme.colors.placeholder}]}>{d}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {calDays.map((day,idx)=>{
                if(!day) return <View key={idx} style={styles.dayCell}/>;
                const cellDate=new Date(modalYear,modalMonth-1,day);
                const iso=cellDate.toISOString().split('T')[0];
                const cellTime = cellDate.getTime();
                
                let isTaken = false;
                for (const l of leaves) {
                  if (l.status === 'APPROVED' || l.status === 'PENDING') {
                    const ls = new Date(l.startDate); ls.setHours(0,0,0,0);
                    const le = new Date(l.endDate); le.setHours(23,59,59,999);
                    if (cellTime >= ls.getTime() && cellTime <= le.getTime()) {
                      isTaken = true;
                      break;
                    }
                  }
                }

                let selected=false;
                if(selStart && selEnd){
                  selected = new Date(iso) >= new Date(selStart) && new Date(iso) <= new Date(selEnd);
                } else if(selStart){
                  selected = iso===selStart;
                }
                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={isTaken}
                     style={[
                       styles.dayCell, 
                       selected && {backgroundColor: theme.colors.primary + '20', borderRadius:8},
                       isTaken && {backgroundColor: '#FEE2E2', borderRadius:8}
                     ]}
                    onPress={()=>{
                      if(!selStart || (selStart && selEnd)){
                        setSelStart(iso); setSelEnd('');
                      } else {
                        if(new Date(iso) >= new Date(selStart)) setSelEnd(iso);
                        else setSelStart(iso);
                      }
                    }}
                  >
                     <Text style={[styles.dayNum, {
                       color: isTaken ? '#B91C1C' : (selected ? theme.colors.primary : theme.colors.text),
                       fontWeight: isTaken ? '700' : '500',
                       textDecorationLine: 'none'
                     }]}>{day}</Text>
                   </TouchableOpacity>
                 );
               })}
            </View>
            <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:20,marginHorizontal:10}}>
              <TouchableOpacity onPress={()=>{
                setSelStart('');
                setSelEnd('');
                setFilterStart('');
                setFilterEnd('');
                setShowCalendarModal(false);
                fetchMyLeaves();
              }}>
                <Text style={{color:theme.colors.error}}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>{
                  if(selStart){
                    setFilterStart(selStart);
                    setFilterEnd(selEnd||selStart);
                  }
                  setShowCalendarModal(false);
                }}>
                <Text style={{color:theme.colors.primary, fontWeight:'600'}}>Apply</Text>
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
  dateRange: { fontSize: 14, fontWeight: '600' },
  duration: { fontSize: 12, marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  reason: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  adminNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  adminNoteText: { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 16 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
    gap: 6,
  },
  cancelText: { fontSize: 13, fontWeight: '600' },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 16 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  applyNowBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyNowText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  // Calendar
  calContainer: { padding: 16 },
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
  leaveDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 1 },
  calLeaveList: { marginTop: 16 },
  calListTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  calLeaveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    padding: 12,
  },
  calLeaveBar: { width: 4, height: '100%', borderRadius: 2, alignSelf: 'stretch' },
  calLeaveRange: { fontSize: 13, fontWeight: '600' },
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
});

export default MyLeavesScreen;
