import { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { AssetProfileContent } from '../../components/inventory/AssetProfileContent';
import { StateMessage } from '../../components/ui/StateMessage';
import { fetchAssetProfile } from '../../services/inventory';
import { toMessage } from '../../lib/errors';
import type { AssetProfile } from '../../types/inventory';

export default function AssetProfileScreen() {
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  return <Profile key={assetId} assetId={assetId} />;
}
function Profile({ assetId }: { assetId: string }) {
  const [profile, setProfile] = useState<AssetProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const load = useCallback(
    async (refresh = false) => {
      const request = ++version.current;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const data = await fetchAssetProfile(assetId);
        if (request === version.current) setProfile(data);
      } catch (cause) {
        if (request === version.current)
          setError(toMessage(cause, 'Could not load asset profile.'));
      } finally {
        if (request === version.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [assetId]
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        version.current++;
      };
    }, [load])
  );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.backgroundSubtle,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingVertical: 14,
          backgroundColor: Colors.card,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          disabled={busy}
          hitSlop={12}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace('/(dashboard)/inventory')
          }
        >
          <ArrowLeft size={22} color={Colors.primary} />
        </Pressable>
        <Text
          style={{
            fontFamily: 'NotoSans_700Bold',
            fontSize: 16,
            color: Colors.foreground,
          }}
        >
          Asset profile
        </Text>
      </View>
      {loading ? (
        <StateMessage type="loading" message="Loading asset profile..." />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator
          refreshControl={
            <RefreshControl
              enabled={!busy}
              refreshing={refreshing}
              onRefresh={() => {
                void load(true);
              }}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {error ? (
            <StateMessage
              type="error"
              message={error}
              onRetry={() => {
                void load(Boolean(profile));
              }}
            />
          ) : null}
          {profile ? (
            <AssetProfileContent
              key={profile.asset.updatedAt}
              profile={profile}
              onBusyChange={setBusy}
              onIssueReported={() => {
                void load(true);
              }}
            />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
