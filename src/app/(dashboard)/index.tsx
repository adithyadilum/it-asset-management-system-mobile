import {
  Pressable,
  RefreshControl,
  ScrollView,
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
  ScanLine,
  Timer,
  Wrench,
} from 'lucide-react-native';
import { Header } from '../../components/dashboard/Header';
import { StateMessage } from '../../components/ui/StateMessage';
import { TaskRow } from '../../components/operations/TaskRow';
import { Colors } from '../../constants/colors';
import { useTasks } from '../../hooks/useTasks';
import type { TaskKind } from '../../types/operations';
export default function DashboardScreen() {
  const router = useRouter();
  const { result, loading, refreshing, error, refresh } = useTasks({
    pageSize: 5,
  });
  const metrics = [
    {
      kind: 'handovers' as TaskKind,
      label: 'Pending handovers',
      icon: PackagePlus,
    },
    { kind: 'returns' as TaskKind, label: 'Returns due', icon: Timer },
    {
      kind: 'inspections' as TaskKind,
      label: 'Condition checks',
      icon: ClipboardCheck,
    },
    {
      kind: 'maintenance' as TaskKind,
      label: 'Open maintenance',
      icon: Wrench,
    },
  ];
  const quick = [
    {
      label: 'Scan',
      icon: ScanLine,
      press: () =>
        router.push({
          pathname: '/(dashboard)/scanner',
          params: { operation: '' },
        }),
    },
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
    <View style={{ flex: 1, backgroundColor: Colors.backgroundSubtle }}>
      <Header />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 32 }}
      >
        <View style={{ gap: 7 }}>
          <Text
            style={{
              fontFamily: 'NotoSans_700Bold',
              fontSize: 26,
              color: Colors.foreground,
            }}
          >
            Operations at a glance
          </Text>
          <Text
            style={{
              fontFamily: 'NotoSans_400Regular',
              fontSize: 13,
              lineHeight: 20,
              color: Colors.mutedForeground,
            }}
          >
            {result
              ? `${Object.values(result.counts).reduce((sum, n) => sum + n, 0)} tasks need your team's attention.`
              : 'Your assets, handovers and returns in one place.'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {quick.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.press}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                gap: 8,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 14,
                backgroundColor: pressed ? Colors.muted : Colors.card,
              })}
            >
              <action.icon size={22} color={Colors.primary} />
              <Text
                style={{
                  fontFamily: 'NotoSans_600SemiBold',
                  fontSize: 11,
                  color: Colors.primary,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {error ? (
          <StateMessage type="error" message={error} onRetry={refresh} />
        ) : null}
        {loading && !result ? (
          <StateMessage type="loading" message="Loading your work queue..." />
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {metrics.map((metric) => (
            <Pressable
              key={metric.kind}
              accessibilityRole="button"
              accessibilityLabel={`Open ${metric.label}`}
              onPress={() =>
                router.push({
                  pathname: '/(dashboard)/tasks',
                  params: { kind: metric.kind },
                })
              }
              style={({ pressed }) => ({
                width: '48%',
                flexGrow: 1,
                minHeight: 130,
                gap: 10,
                padding: 16,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 16,
                backgroundColor: pressed ? Colors.muted : Colors.card,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <metric.icon size={21} color={Colors.primary} />
                <Text
                  style={{
                    fontFamily: 'NotoSans_700Bold',
                    fontSize: 28,
                    color: Colors.foreground,
                  }}
                >
                  {result ? result.counts[metric.kind] : '\u2014'}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'NotoSans_500Medium',
                  fontSize: 12,
                  color: Colors.mutedForeground,
                }}
              >
                {metric.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ gap: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontFamily: 'NotoSans_700Bold',
                fontSize: 17,
                color: Colors.foreground,
              }}
            >
              Needs attention
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/(dashboard)/tasks',
                  params: { kind: 'all' },
                })
              }
              style={{ paddingVertical: 10, paddingLeft: 12 }}
            >
              <Text
                style={{
                  fontFamily: 'NotoSans_600SemiBold',
                  fontSize: 12,
                  color: Colors.primary,
                }}
              >
                View all tasks
              </Text>
            </Pressable>
          </View>
          {result?.data.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          {result && !result.data.length ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 16,
                backgroundColor: Colors.card,
                padding: 24,
                alignItems: 'center',
                gap: 10,
              }}
            >
              <ClipboardList size={28} color={Colors.success} />
              <Text
                style={{
                  fontFamily: 'NotoSans_600SemiBold',
                  color: Colors.foreground,
                }}
              >
                All caught up
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.mutedForeground,
                  textAlign: 'center',
                }}
              >
                New handovers, returns and maintenance work will appear here.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
