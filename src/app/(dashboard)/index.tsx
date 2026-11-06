import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowDownToLine,
  ClipboardCheck,
  ClipboardList,
  PackagePlus,
  Search,
  Timer,
  Wrench,
} from 'lucide-react-native';
import { Header } from '../../components/dashboard/Header';
import { ScannerCard } from '../../components/dashboard/ScannerCard';
import { StateMessage } from '../../components/ui/StateMessage';
import { TaskRow } from '../../components/operations/TaskRow';
import { Colors } from '../../constants/colors';
import { useTasks } from '../../hooks/useTasks';
import type { TaskKind } from '../../types/operations';

const metrics = [
  {
    kind: 'handovers',
    label: 'Pending handovers',
    icon: PackagePlus,
    color: '#2563EB',
    tint: '#EFF6FF',
  },
  {
    kind: 'returns',
    label: 'Returns due',
    icon: Timer,
    color: '#D97706',
    tint: '#FFFBEB',
  },
  {
    kind: 'inspections',
    label: 'Condition checks',
    icon: ClipboardCheck,
    color: '#7C3AED',
    tint: '#F5F3FF',
  },
  {
    kind: 'maintenance',
    label: 'Open maintenance',
    icon: Wrench,
    color: '#059669',
    tint: '#ECFDF5',
  },
] satisfies {
  kind: TaskKind;
  label: string;
  icon: typeof Timer;
  color: string;
  tint: string;
}[];

export default function DashboardScreen() {
  const router = useRouter();
  const { result, loading, refreshing, error, refresh } = useTasks({
    pageSize: 3,
  });
  const quick = [
    {
      label: 'Find asset',
      icon: Search,
      press: () => router.push('/(dashboard)/inventory'),
    },
    {
      label: 'Hand over',
      icon: PackagePlus,
      press: () =>
        router.push({
          pathname: '/operations/select-asset',
          params: { operation: 'handover' },
        }),
    },
    {
      label: 'Receive',
      icon: ArrowDownToLine,
      press: () =>
        router.push({
          pathname: '/operations/select-asset',
          params: { operation: 'return' },
        }),
    },
  ];
  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
          />
        }
      >
        <ScannerCard />
        <View style={styles.quickRow}>
          {quick.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.press}
              style={styles.quick}
              android_ripple={{ color: Colors.muted }}
            >
              <action.icon size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.heading}>
          <Text style={styles.sectionTitle}>Operations at a glance</Text>
          <Text style={styles.subtitle}>
            {result
              ? `${Object.values(result.counts).reduce((sum, n) => sum + n, 0)} tasks need your team's attention`
              : 'Your daily work, in one place'}
          </Text>
        </View>
        {error ? (
          <StateMessage type="error" message={error} onRetry={refresh} />
        ) : null}
        {loading && !result ? (
          <StateMessage type="loading" message="Loading your work queue..." />
        ) : null}
        <View style={styles.grid}>
          {metrics.map((metric) => (
            <View key={metric.kind} style={styles.metricCell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${metric.label}`}
                style={styles.metric}
                android_ripple={{ color: Colors.muted }}
                onPress={() =>
                  router.push({
                    pathname: '/(dashboard)/tasks',
                    params: { kind: metric.kind },
                  })
                }
              >
                <View
                  style={[styles.metricIcon, { backgroundColor: metric.tint }]}
                >
                  <metric.icon size={22} color={metric.color} />
                </View>
                <Text style={styles.value}>
                  {result ? result.counts[metric.kind] : '\u2014'}
                </Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.attention}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Needs attention</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all tasks"
              hitSlop={8}
              style={styles.viewAll}
              onPress={() =>
                router.push({
                  pathname: '/(dashboard)/tasks',
                  params: { kind: 'all' },
                })
              }
            >
              <Text style={styles.link}>View all tasks</Text>
            </Pressable>
          </View>
          {result?.data.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          {result && !result.data.length ? (
            <View style={styles.empty}>
              <ClipboardList size={28} color={Colors.success} />
              <Text style={styles.sectionTitle}>All caught up</Text>
              <Text style={styles.subtitle}>
                New work will appear here when it needs your attention.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.backgroundSubtle },
  content: { padding: 20, gap: 20, paddingBottom: 32 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quick: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  quickLabel: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: Colors.primary,
  },
  heading: { gap: 5 },
  sectionTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 17,
    color: Colors.foreground,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    lineHeight: 19,
    color: Colors.mutedForeground,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -6 },
  metricCell: { width: '50%', padding: 6 },
  metric: {
    flex: 1,
    minHeight: 150,
    gap: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  value: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: Colors.foreground,
  },
  metricLabel: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  attention: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  viewAll: { minHeight: 44, justifyContent: 'center' },
  link: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: Colors.primary,
  },
  empty: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.card,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
});
