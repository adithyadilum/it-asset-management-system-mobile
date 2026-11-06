import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScanLine, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useInventory } from '../../hooks/useInventory';
import {
  OperationLayout,
  Field,
  operationStyles,
} from '../../components/operations/OperationLayout';
import { StateMessage } from '../../components/ui/StateMessage';
import { Button } from '../../components/ui/Button';
export default function SelectOperationAsset() {
  const params = useLocalSearchParams<{ operation?: string }>();
  return (
    <Picker
      key={params.operation}
      operation={params.operation === 'return' ? 'return' : 'handover'}
    />
  );
}
function Picker({ operation }: { operation: 'handover' | 'return' }) {
  const router = useRouter(),
    [query, setQuery] = useState(''),
    [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const { result, loading, error, loadingMore, loadMore, retry } = useInventory(
    { query: search, operation }
  );
  return (
    <OperationLayout
      title={
        operation === 'handover' ? 'Hand over an asset' : 'Receive an asset'
      }
    >
      <Text style={operationStyles.note}>
        {operation === 'handover'
          ? 'Choose available equipment to hand over to a person or location.'
          : 'Choose equipment currently in custody. Pending employee acceptance cannot be received as a return.'}
      </Text>
      <Button
        variant="outline"
        icon={<ScanLine size={18} color={Colors.primary} />}
        onPress={() =>
          router.push({
            pathname: '/(dashboard)/scanner',
            params: { operation },
          })
        }
      >
        Scan asset code
      </Button>
      <Field
        label="Search assets"
        placeholder="Asset tag, serial, brand or model"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />
      {loading ? (
        <StateMessage type="loading" />
      ) : error ? (
        <StateMessage type="error" message={error} onRetry={retry} />
      ) : !result?.data.length ? (
        <StateMessage
          type="empty"
          message="No eligible assets found. Try a different search."
        />
      ) : (
        result.data.map((asset) => (
          <Pressable
            key={asset.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname:
                  operation === 'handover'
                    ? '/operations/handover'
                    : '/operations/return',
                params: { assetId: asset.id },
              })
            }
            style={[
              operationStyles.card,
              { flexDirection: 'row', alignItems: 'center' },
            ]}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Text style={operationStyles.label}>{asset.assetTag}</Text>
              <Text style={operationStyles.title}>
                {asset.name || asset.model}
              </Text>
              <Text style={operationStyles.note}>
                {asset.assignedTo || asset.location || asset.category}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.mutedForeground} />
          </Pressable>
        ))
      )}
      {result && result.meta.page < result.meta.totalPages ? (
        <Button
          variant="outline"
          disabled={loadingMore}
          onPress={() => {
            void loadMore();
          }}
        >
          {loadingMore ? 'Loading...' : 'Load more assets'}
        </Button>
      ) : null}
    </OperationLayout>
  );
}
