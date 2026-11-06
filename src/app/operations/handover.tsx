import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useOperationProfile } from '../../hooks/useOperationProfile';
import {
  OperationLayout,
  OperationAsset,
} from '../../components/operations/OperationLayout';
import { HandoverForm } from '../../components/operations/HandoverForm';
import { StateMessage } from '../../components/ui/StateMessage';
export default function HandoverScreen() {
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  return <Handover key={assetId} assetId={assetId} />;
}
function Handover({ assetId }: { assetId: string }) {
  const [busy, setBusy] = useState(false);
  const { profile, loading, error, refresh } = useOperationProfile(assetId);
  return (
    <OperationLayout title="Hand over asset" busy={busy}>
      {!profile && loading ? <StateMessage type="loading" /> : null}
      {error ? (
        <StateMessage type="error" message={error} onRetry={refresh} />
      ) : null}
      {profile ? (
        <>
          <OperationAsset profile={profile} />
          <HandoverForm
            profile={profile}
            onBusyChange={setBusy}
            onRefresh={refresh}
          />
        </>
      ) : null}
    </OperationLayout>
  );
}
