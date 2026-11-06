import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useOperationProfile } from '../../hooks/useOperationProfile';
import {
  OperationLayout,
  OperationAsset,
} from '../../components/operations/OperationLayout';
import { ReturnForm } from '../../components/operations/ReturnForm';
import { StateMessage } from '../../components/ui/StateMessage';
export default function ReturnScreen() {
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  return <AssetReturn key={assetId} assetId={assetId} />;
}
function AssetReturn({ assetId }: { assetId: string }) {
  const [busy, setBusy] = useState(false);
  const { profile, loading, error, refresh } = useOperationProfile(assetId);
  return (
    <OperationLayout
      title={
        profile?.asset.status === 'Returned'
          ? 'Inspect returned asset'
          : 'Receive returned asset'
      }
      busy={busy}
    >
      {!profile && loading ? <StateMessage type="loading" /> : null}
      {error ? (
        <StateMessage type="error" message={error} onRetry={refresh} />
      ) : null}
      {profile ? (
        <>
          <OperationAsset profile={profile} />
          <ReturnForm
            profile={profile}
            onBusyChange={setBusy}
            onRefresh={refresh}
          />
        </>
      ) : null}
    </OperationLayout>
  );
}
