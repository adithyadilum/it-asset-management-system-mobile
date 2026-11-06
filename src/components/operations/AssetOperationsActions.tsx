import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { AssetProfile } from '../../types/inventory';
import { assignmentAction } from '../../services/operations';
import { toMessage } from '../../lib/errors';
import { Button } from '../ui/Button';
import { operationStyles as s } from './OperationLayout';
export function AssetOperationsActions({
  profile,
  onChanged,
  onBusyChange,
}: {
  profile: AssetProfile;
  onChanged: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false);
  if (profile.asset.isArchived || profile.model.category.pillar === 'Software')
    return null;
  const act = async (action: 'request-return' | 'remind') => {
    if (lock.current || !profile.assignment) return;
    lock.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError('');
    try {
      const result = await assignmentAction(profile.assignment.id, {
        action,
        assetId: profile.asset.id,
        expectedUpdatedAt: profile.asset.updatedAt,
      });
      Alert.alert('Recorded', result.message);
      onChanged();
    } catch (cause) {
      setError(
        toMessage(
          cause,
          'Could not complete the action. Refresh this asset before trying again.'
        )
      );
    } finally {
      lock.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  const handover = profile.asset.status === 'Available' && !profile.assignment,
    inspect = profile.asset.status === 'Returned',
    assigned = profile.asset.status === 'Assigned' && profile.assignment;
  if (!handover && !inspect && !assigned) return null;
  return (
    <View style={s.card}>
      <Text style={s.title}>Custody actions</Text>
      {handover ? (
        <Button
          onPress={() =>
            router.push({
              pathname: '/operations/handover',
              params: { assetId: profile.asset.id },
            })
          }
        >
          Hand over asset
        </Button>
      ) : inspect ? (
        <Button
          onPress={() =>
            router.push({
              pathname: '/operations/return',
              params: { assetId: profile.asset.id },
            })
          }
        >
          Complete condition check
        </Button>
      ) : profile.assignment?.state === 'pending approval' ? (
        <>
          <Text style={s.note}>Awaiting employee acceptance in My Assets.</Text>
          <Button
            variant="outline"
            disabled={busy}
            onPress={() => {
              void act('remind');
            }}
          >
            {busy ? 'Sending reminder...' : 'Remind employee'}
          </Button>
        </>
      ) : (
        <>
          <Button
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: '/operations/return',
                params: { assetId: profile.asset.id },
              })
            }
          >
            Receive return
          </Button>
          {profile.assignment?.assignedToUser &&
          profile.assignment.state !== 'requested' ? (
            <Button
              variant="outline"
              disabled={busy}
              onPress={() =>
                Alert.alert(
                  'Request asset return?',
                  `Ask the custodian to return ${profile.asset.assetTag}.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Request return',
                      onPress: () => {
                        void act('request-return');
                      },
                    },
                  ]
                )
              }
            >
              Request return
            </Button>
          ) : null}
        </>
      )}
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
