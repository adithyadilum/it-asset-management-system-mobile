import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { AssetImage } from '../inventory/AssetImage';
import { taskLabels, type OperationTask } from '../../types/operations';
import { formatProfileDate } from '../../lib/asset-profile';
export const TaskRow = memo(function TaskRow({
  task,
}: {
  task: OperationTask;
}) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${taskLabels[task.kind]}: ${task.assetTag}`}
      onPress={() => {
        if (task.kind === 'returns' || task.kind === 'inspections')
          router.push({
            pathname: '/operations/return',
            params: { assetId: task.assetId },
          });
        else
          router.push({
            pathname: '/asset/[assetId]',
            params: { assetId: task.assetId },
          });
      }}
      android_ripple={{ color: Colors.muted }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 15,
        backgroundColor: Colors.card,
        borderColor: Colors.border,
        borderWidth: 1,
        borderRadius: 14,
      }}
    >
      <AssetImage uri={task.imageUrl} />
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'NotoSans_600SemiBold',
            fontSize: 10,
            color: Colors.primary,
          }}
        >
          {taskLabels[task.kind]}
          {' \u00b7 '}
          {task.assetTag}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'NotoSans_600SemiBold',
            fontSize: 14,
            color: Colors.foreground,
          }}
        >
          {task.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            lineHeight: 17,
            color: Colors.mutedForeground,
          }}
        >
          {task.custodian || task.detail}
        </Text>
        {task.dueDate ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 10,
              color:
                task.kind === 'returns' &&
                task.detail.toLowerCase().includes('overdue')
                  ? Colors.destructive
                  : Colors.primary,
            }}
          >
            Due {formatProfileDate(task.dueDate)}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={16} color={Colors.tabInactive} />
    </Pressable>
  );
});
