import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  pickupPointApi,
  type PickupPointRequestDetailDto,
} from '@/lib/parent/pickupPoint.api';
import { formatDateTime } from '@/utils/date.utils';

interface SemesterGroup {
  code: string;
  name: string;
  academicYear: string;
}

function formatCurrencyVnd(value: number): string {
  if (!Number.isFinite(value)) return '-';
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString('vi-VN')} đ`;
  }
}

export default function RegisterHistoryScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<PickupPointRequestDetailDto[]>([]);
  const [selectedSemesterCode, setSelectedSemesterCode] = useState<string>('');

  const semesterGroups: SemesterGroup[] = useMemo(() => {
    const map = new Map<string, SemesterGroup>();
    for (const r of requests) {
      if (!r.semesterCode) continue;
      if (!map.has(r.semesterCode)) {
        map.set(r.semesterCode, {
          code: r.semesterCode,
          name: r.semesterName || r.semesterCode,
          academicYear: r.academicYear || '',
        });
      }
    }
    const list = Array.from(map.values());
    list.sort((a, b) => {
      const yearA = parseInt(a.academicYear.slice(0, 4), 10) || 0;
      const yearB = parseInt(b.academicYear.slice(0, 4), 10) || 0;
      if (yearA !== yearB) return yearB - yearA;
      return a.name < b.name ? 1 : a.name > b.name ? -1 : 0;
    });
    return list;
  }, [requests]);

  const visibleRequests = useMemo(() => {
    if (!selectedSemesterCode) return requests;
    return requests.filter((r) => r.semesterCode === selectedSemesterCode);
  }, [requests, selectedSemesterCode]);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await pickupPointApi.getParentRequests();
      setRequests(data);

      if (data.length === 0) {
        setSelectedSemesterCode('');
        return;
      }

      if (!selectedSemesterCode) {
        const groups = new Map<string, SemesterGroup>();
        for (const r of data) {
          if (!r.semesterCode) continue;
          if (!groups.has(r.semesterCode)) {
            groups.set(r.semesterCode, {
              code: r.semesterCode,
              name: r.semesterName || r.semesterCode,
              academicYear: r.academicYear || '',
            });
          }
        }
        const sorted = Array.from(groups.values()).sort((a, b) => {
          const yearA = parseInt(a.academicYear.slice(0, 4), 10) || 0;
          const yearB = parseInt(b.academicYear.slice(0, 4), 10) || 0;
          if (yearA !== yearB) return yearB - yearA;
          return a.name < b.name ? 1 : a.name > b.name ? -1 : 0;
        });
        if (sorted[0]) {
          setSelectedSemesterCode(sorted[0].code);
        }
      }
    } catch (err: any) {
      console.error('Failed to load register history', err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to load registration history. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterCode]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const renderStatus = (status: string) => {
    const normalized = status?.toLowerCase() ?? '';
    let bgColor = '#FFF9C4';
    let textColor = '#8D6E63';
    let label = status || 'Unknown';

    if (normalized === 'pending') {
      bgColor = '#FFF3E0';
      textColor = '#EF6C00';
      label = 'Pending';
    } else if (normalized === 'approved') {
      bgColor = '#E8F5E9';
      textColor = '#2E7D32';
      label = 'Approved';
    } else if (normalized === 'rejected') {
      bgColor = '#FFEBEE';
      textColor = '#C62828';
      label = 'Rejected';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register History</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Semester chips */}
      {semesterGroups.length > 0 && (
        <View style={styles.chipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
          >
            {semesterGroups.map((s) => {
              const isActive = s.code === selectedSemesterCode;
              const labelParts =
                s.name && s.academicYear
                  ? `${s.name} ${s.academicYear}`
                  : s.name || s.code;
              return (
                <TouchableOpacity
                  key={s.code}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setSelectedSemesterCode(s.code)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {labelParts}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#FDC700" />
            <Text style={styles.centerText}>Loading registration history...</Text>
          </View>
        )}

        {!loading && error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={24} color="#C62828" />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Unable to load history</Text>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          </View>
        ) : null}

        {!loading && !error && visibleRequests.length === 0 && (
          <View style={styles.centerBox}>
            <Ionicons name="file-tray-outline" size={40} color="#B0BEC5" />
            <Text style={styles.centerTitle}>No registrations yet</Text>
            <Text style={styles.centerSubText}>
              Your registration history will appear here after you submit a request.
            </Text>
          </View>
        )}

        {!loading &&
          !error &&
          visibleRequests.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {r.semesterName || 'Semester'}{' '}
                    {r.academicYear ? `(${r.academicYear})` : ''}
                  </Text>
                  <Text style={styles.cardSubTitle}>{formatDateTime(r.createdAt)}</Text>
                </View>
                {renderStatus(r.status)}
              </View>

              <View style={styles.cardRow}>
                <Ionicons name="location" size={18} color="#757575" />
                <Text style={styles.cardRowText}>{r.addressText || 'No address'}</Text>
              </View>

              {r.students?.length > 0 && (
                <View style={styles.cardRow}>
                  <Ionicons name="people" size={18} color="#757575" />
                  <Text style={styles.cardRowText}>
                    {r.students
                      .map((s) => `${s.firstName} ${s.lastName}`.trim())
                      .join(', ')}
                  </Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.footerLabel}>Estimated fee</Text>
                  <Text style={styles.footerValue}>{formatCurrencyVnd(r.totalFee)}</Text>
                </View>
                <View>
                  <Text style={styles.footerLabel}>Distance</Text>
                  <Text style={styles.footerValue}>{r.distanceKm.toFixed(2)} km</Text>
                </View>
              </View>

              {r.adminNotes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Admin notes</Text>
                  <Text style={styles.notesText}>{r.adminNotes}</Text>
                </View>
              )}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const sharedShadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: {
    elevation: 3,
    shadowColor: '#000000',
  },
  default: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FEFCE8',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 20,
    color: '#000000',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  chipsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: '#FDC700',
    borderColor: '#F59E0B',
  },
  chipText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 13,
    color: '#78350F',
  },
  chipTextActive: {
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  centerText: {
    marginTop: 12,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#4B5563',
  },
  centerTitle: {
    marginTop: 12,
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#111827',
  },
  centerSubText: {
    marginTop: 4,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  errorTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#B91C1C',
    marginBottom: 2,
  },
  errorMessage: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#7F1D1D',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...sharedShadow,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 16,
    color: '#111827',
  },
  cardSubTitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  cardRowText: {
    flex: 1,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#374151',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  footerLabel: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  footerValue: {
    fontFamily: 'RobotoSlab-Bold',
    fontSize: 14,
    color: '#111827',
    marginTop: 2,
  },
  notesBox: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    padding: 10,
  },
  notesLabel: {
    fontFamily: 'RobotoSlab-Medium',
    fontSize: 12,
    color: '#1D4ED8',
    marginBottom: 2,
  },
  notesText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#1E3A8A',
  },
});


