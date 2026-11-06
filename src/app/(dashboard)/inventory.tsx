import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { AssetImage } from '../../components/inventory/AssetImage';
import { AssetStatus } from '../../components/inventory/AssetStatus';
import { InventoryFiltersSheet } from '../../components/inventory/InventoryFiltersSheet';
import { StateMessage } from '../../components/ui/StateMessage';
import { useInventory } from '../../hooks/useInventory';
import type { InventoryFilters } from '../../types/inventory';

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
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
  } = useInventory({ ...filters, query: search });
  const router = useRouter();
  const count = Object.values(filters).filter(
    (value) => value !== undefined
  ).length;
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ASSET REGISTRY</Text>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>
          Find equipment, software and the people using them.
        </Text>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Search size={18} color={Colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search tags, serials, models..."
              placeholderTextColor={Colors.mutedForeground}
              accessibilityLabel="Search inventory"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={120}
              returnKeyType="search"
              style={styles.input}
              onSubmitEditing={() => setSearch(query.trim())}
            />
            {query ? (
              <Pressable
                onPress={() => {
                  setQuery('');
                  setSearch('');
                }}
                hitSlop={10}
                accessibilityLabel="Clear search"
              >
                <X size={17} color={Colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel={
              count ? `Filter inventory, ${count} active` : 'Filter inventory'
            }
            onPress={() => setShowFilters(true)}
            style={[
              styles.filter,
              count > 0 && { backgroundColor: Colors.primary },
            ]}
          >
            <SlidersHorizontal
              size={19}
              color={count ? Colors.primaryForeground : Colors.primary}
            />
            {count ? (
              <Text style={{ color: Colors.primaryForeground, fontSize: 11 }}>
                {count}
              </Text>
            ) : null}
          </Pressable>
        </View>
        {count > 0 && (
          <Pressable
            onPress={() => setFilters({})}
            accessibilityLabel="Clear all filters"
            style={{ alignSelf: 'flex-start', paddingVertical: 8 }}
          >
            <Text
              style={{
                color: Colors.primary,
                fontSize: 12,
                fontFamily: 'NotoSans_600SemiBold',
              }}
            >
              Clear {count} {count === 1 ? 'filter' : 'filters'}
            </Text>
          </Pressable>
        )}
      </View>
      {loading ? (
        <StateMessage type="loading" message="Loading inventory..." />
      ) : (
        <FlatList
          data={result?.data ?? []}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primary}
            />
          }
          onEndReached={() => {
            void loadMore();
          }}
          onEndReachedThreshold={0.35}
          ListHeaderComponent={
            result ? (
              <Text style={styles.results}>
                {result.meta.total.toLocaleString()}{' '}
                {result.meta.total === 1 ? 'asset' : 'assets'}
                {search ? ` matching "${search}"` : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !error ? (
              <View style={styles.empty}>
                <Search size={32} color={Colors.mutedForeground} />
                <Text style={styles.emptyTitle}>No assets found</Text>
                <Text style={styles.subtitle}>
                  Try a different search or clear the filters.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            error ? (
              <StateMessage
                type="error"
                message={error}
                onRetry={
                  result && result.meta.page >= result.meta.totalPages
                    ? refresh
                    : retry
                }
              />
            ) : loadingMore ? (
              <ActivityIndicator
                style={{ padding: 20 }}
                color={Colors.primary}
              />
            ) : result && result.data.length > 0 ? (
              <Text style={styles.footer}>
                {result.data.length} of {result.meta.total} assets
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${item.assetTag}, ${item.name || item.model}`}
              onPress={() =>
                router.push({
                  pathname: '/asset/[assetId]',
                  params: { assetId: item.id },
                })
              }
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: Colors.muted },
              ]}
            >
              <AssetImage uri={item.imageUrl} />
              <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <Text
                    style={[styles.tag, { flexShrink: 1 }]}
                    numberOfLines={1}
                  >
                    {item.assetTag}
                  </Text>
                  <AssetStatus status={item.status} />
                </View>
                <Text style={styles.assetName} numberOfLines={1}>
                  {item.name || `${item.brand} ${item.model}`}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.category}
                  {item.assignedTo ? ` \u00b7 ${item.assignedTo}` : ''}
                </Text>
                {item.location ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 4,
                      alignItems: 'center',
                    }}
                  >
                    <MapPin size={11} color={Colors.mutedForeground} />
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}
              </View>
              <ChevronRight size={16} color={Colors.tabInactive} />
            </Pressable>
          )}
        />
      )}
      <InventoryFiltersSheet
        visible={showFilters}
        filters={filters}
        options={
          result?.filters ?? { categories: [], locations: [], statuses: [] }
        }
        onChange={setFilters}
        onClose={() => setShowFilters(false)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.backgroundSubtle },
  header: {
    backgroundColor: Colors.card,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  eyebrow: {
    fontFamily: 'NotoSans_700Bold',
    color: Colors.mutedForeground,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 28,
    color: Colors.foreground,
  },
  subtitle: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    lineHeight: 19,
    color: Colors.mutedForeground,
  },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  search: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    flex: 1,
    minHeight: 46,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: Colors.foreground,
    paddingVertical: 11,
  },
  filter: {
    borderRadius: 12,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  list: { padding: 18, gap: 10, paddingBottom: 24, flexGrow: 1 },
  results: {
    color: Colors.mutedForeground,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
  },
  tag: { fontFamily: 'NotoSans_700Bold', color: Colors.primary, fontSize: 11 },
  assetName: {
    fontFamily: 'NotoSans_600SemiBold',
    color: Colors.foreground,
    fontSize: 14,
  },
  meta: {
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    fontSize: 11,
    flexShrink: 1,
  },
  empty: { alignItems: 'center', padding: 32, gap: 10 },
  emptyTitle: {
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
    fontSize: 17,
  },
  footer: {
    textAlign: 'center',
    padding: 16,
    fontSize: 11,
    color: Colors.mutedForeground,
  },
});
