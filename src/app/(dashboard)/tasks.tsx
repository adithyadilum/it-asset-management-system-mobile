import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { TaskRow } from '../../components/operations/TaskRow';
import { StateMessage } from '../../components/ui/StateMessage';
import { useTasks } from '../../hooks/useTasks';
import type { ListRenderItemInfo } from 'react-native';
import {
  taskKinds,
  taskLabels,
  type OperationTask,
  type TaskKind,
} from '../../types/operations';
const taskKey = (task: OperationTask) => task.id;
const renderTask = ({ item }: ListRenderItemInfo<OperationTask>) => (
  <TaskRow task={item} />
);
const EMPTY_TASKS: OperationTask[] = [];

export default function TasksScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const initial = taskKinds.includes(params.kind as TaskKind)
    ? (params.kind as TaskKind)
    : undefined;
  return <TasksView key={initial ?? 'all'} initial={initial} />;
}
function TasksView({ initial }: { initial?: TaskKind }) {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<TaskKind | undefined>(initial),
    [query, setQuery] = useState(''),
    [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const {
    result,
    loading,
    refreshing,
    loadingMore,
    error,
    refresh,
    retry,
    loadMore,
  } = useTasks({ kind, query: search });
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: Colors.backgroundSubtle,
      }}
    >
      <View
        style={{
          padding: 20,
          paddingBottom: 14,
          gap: 10,
          backgroundColor: Colors.card,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: 'NotoSans_700Bold',
            fontSize: 28,
            color: Colors.foreground,
          }}
        >
          Tasks
        </Text>
        <Text style={{ fontSize: 12, color: Colors.mutedForeground }}>
          The operational work queue for your team
        </Text>
        <TextInput
          accessibilityLabel="Search tasks"
          value={query}
          onChangeText={setQuery}
          placeholder="Search asset or custodian"
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 10,
            minHeight: 44,
            padding: 12,
            fontSize: 13,
            color: Colors.foreground,
          }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {[undefined, ...taskKinds].map((value) => (
            <Pressable
              key={value ?? 'all'}
              accessibilityRole="button"
              accessibilityState={{ selected: kind === value }}
              onPress={() => setKind(value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 11,
                borderRadius: 10,
                backgroundColor:
                  kind === value ? Colors.primary : Colors.backgroundSubtle,
              }}
            >
              <Text
                style={{
                  fontFamily: 'NotoSans_600SemiBold',
                  fontSize: 11,
                  color:
                    kind === value
                      ? Colors.primaryForeground
                      : Colors.mutedForeground,
                }}
              >
                {value ? taskLabels[value] : 'All'}
                {result
                  ? ` (${value ? result.counts[value] : Object.values(result.counts).reduce((sum, n) => sum + n, 0)})`
                  : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {loading ? (
        <StateMessage type="loading" message="Loading tasks..." />
      ) : (
        <FlatList
          data={result?.data ?? EMPTY_TASKS}
          keyExtractor={taskKey}
          initialNumToRender={10}
          maxToRenderPerBatch={6}
          windowSize={7}
          renderItem={renderTask}
          contentContainerStyle={{
            padding: 18,
            gap: 10,
            paddingBottom: 30,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !error ? (
              <StateMessage
                type="empty"
                message="All caught up for this view. Try another queue or clear the search."
              />
            ) : null
          }
          ListFooterComponent={
            error ? (
              <StateMessage type="error" message={error} onRetry={retry} />
            ) : loadingMore ? (
              <ActivityIndicator
                color={Colors.primary}
                style={{ padding: 18 }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}
