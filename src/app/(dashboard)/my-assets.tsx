import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Package, AlertCircle } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import {
  fetchMyAssets,
  acknowledgeAssignment,
  type AssetEntry,
  type PendingAssignment,
} from '../../services/assets';
import { AssetRow } from '../../components/dashboard/assets/AssetRow';
import { PendingAssignmentBanner } from '../../components/dashboard/assets/PendingAssignmentBanner';
import { AcknowledgmentSheet } from '../../components/dashboard/assets/AcknowledgmentSheet';
import { AssetDetailsSheet } from '../../components/dashboard/assets/AssetDetailsSheet';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const AnimatedAssetRow = React.memo(({ asset, index, onPress }: { asset: AssetEntry, index: number, onPress: (asset: AssetEntry) => void }) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
      <AssetRow asset={asset} onPress={() => onPress(asset)} />
    </Animated.View>
  );
});

/**
 * My Assets screen — shows all assets currently assigned to the logged-in user.
 *
 * Features:
 * - Real data from /api/v1/assets/my-assets (authenticated via mobile JWT)
 * - Pending acknowledgment banner driven by state = 'pending approval' assignments
 * - AcknowledgmentSheet bottom sheet with real assignment data + PATCH confirm endpoint
 * - Pull-to-refresh, loading, error, and empty states
 * - Uses shared Button and Card UI components
 */
export default function MyAssetsScreen() {
  const insets = useSafeAreaInsets();

  // Asset lists
  const [activeAssets, setActiveAssets] = useState<AssetEntry[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<
    PendingAssignment[]
  >([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sheet state — which pending assignment is being reviewed
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeAssignment, setActiveAssignment] =
    useState<PendingAssignment | null>(null);

  // Details sheet state
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetEntry | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setError(null);
    const { activeAssets: a, pendingAssignments: p } = await fetchMyAssets();
    setActiveAssets(a);
    setPendingAssignments(p);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      await loadData();
    } catch (err: any) {
      setError(err.message ?? 'Failed to load assets.');
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
    } catch (err: any) {
      setError(err.message ?? 'Failed to load assets.');
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Sheet handlers ─────────────────────────────────────────────────────────

  const openSheet = useCallback(() => {
    if (pendingAssignments.length === 0) return;
    // Always show the first pending assignment
    setActiveAssignment(pendingAssignments[0]);
    setSheetVisible(true);
  }, [pendingAssignments]);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const openDetails = useCallback((asset: AssetEntry) => {
    setSelectedAsset(asset);
    setDetailsVisible(true);
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsVisible(false);
  }, []);

  /**
   * Called when the user confirms receipt in the sheet.
   * The sheet calls the backend, then we remove the acknowledged item
   * from pendingAssignments and add it to activeAssets locally.
   */
  const handleConfirm = useCallback(
    async (assignmentId: number) => {
      await acknowledgeAssignment(assignmentId);

      // Optimistically update local state
      if (activeAssignment && activeAssignment.assignmentId === assignmentId) {
        setPendingAssignments((prev) =>
          prev.filter((p) => p.assignmentId !== assignmentId)
        );
        setActiveAssets((prev) => [
          { ...activeAssignment, state: 'assigned', status: 'assigned' },
          ...prev,
        ]);
        setActiveAssignment(null);
      }
    },
    [activeAssignment]
  );

  // ── Derived values ────────────────────────────────────────────────────────

  const hasNoAssets =
    activeAssets.length === 0 && pendingAssignments.length === 0;
  const totalCount = activeAssets.length + pendingAssignments.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* ── Section Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Package size={16} color={Colors.foreground} strokeWidth={2} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>My Assets</Text>
        </View>
      </View>

      <Text style={styles.headerSub}>Assets currently assigned to you</Text>

      {/* ── Loading State ── */}
      {loading && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.centeredState}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Loading your assets…</Text>
        </Animated.View>
      )}

      {/* ── Error State ── */}
      {!loading && error && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.centeredState}>
          <Card variant="outlined" style={styles.errorCard}>
            <View style={styles.errorIconRow}>
              <View style={styles.errorIconCircle}>
                <AlertCircle size={28} color={Colors.destructive} strokeWidth={1.75} />
              </View>
            </View>
            <Text style={styles.errorTitle}>Couldn't Load Assets</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Button
              variant="outline"
              size="sm"
              onPress={load}
              style={styles.retryButtonWrapper}
            >
              Try Again
            </Button>
          </Card>
        </Animated.View>
      )}

      {/* ── Empty State ── */}
      {!loading && !error && hasNoAssets && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.centeredState}>
          <View style={styles.emptyIconCircle}>
            <Package size={36} color={Colors.info} strokeWidth={1.75} />
          </View>
          <Text style={styles.emptyTitle}>No Assets Assigned</Text>
          <Text style={styles.stateText}>
            You don't have any assets assigned to you at the moment.
          </Text>
        </Animated.View>
      )}

      {/* ── Data: Banner + List ── */}
      {!loading && !error && !hasNoAssets && (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Pending acknowledgment banner — driven by real API data */}
          {pendingAssignments.length > 0 && (
            <PendingAssignmentBanner
              count={pendingAssignments.length}
              onPress={openSheet}
            />
          )}

          {/* Active asset cards */}
          {activeAssets.map((asset, index) => (
            <AnimatedAssetRow
              key={`${asset.id}-${asset.assignmentId}`}
              asset={asset}
              index={index}
              onPress={openDetails}
            />
          ))}

          <Text style={styles.footerText}>
            {totalCount} asset{totalCount !== 1 ? 's' : ''} assigned to you
          </Text>
        </ScrollView>
      )}

      {/* ── Acknowledgment Bottom Sheet ── */}
      <AcknowledgmentSheet
        visible={sheetVisible}
        assignment={activeAssignment}
        onClose={closeSheet}
        onConfirm={handleConfirm}
      />

      {/* ── Asset Details Bottom Sheet ── */}
      <AssetDetailsSheet
        visible={detailsVisible}
        asset={selectedAsset}
        onClose={closeDetails}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    gap: 12,
  },
  // Error card
  errorCard: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  errorIconRow: {
    marginBottom: 4,
  },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  retryButtonWrapper: {
    marginTop: 8,
    alignSelf: 'center',
  },
  // Empty state
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});
