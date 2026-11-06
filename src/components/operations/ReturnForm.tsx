import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { AssetProfile } from '../../types/inventory';
import { assignmentAction, inspectReturn } from '../../services/operations';
import {
  returnOutcomes,
  type ReturnCondition,
  type PhysicalCondition,
} from '../../types/operations';
import { toMessage } from '../../lib/errors';
import { Button } from '../ui/Button';
import { StateMessage } from '../ui/StateMessage';
import {
  Choice,
  Field,
  OperationSuccess,
  operationStyles as s,
} from './OperationLayout';
export function ReturnForm({
  profile,
  onBusyChange,
  onRefresh,
}: {
  profile: AssetProfile;
  onBusyChange: (busy: boolean) => void;
  onRefresh: () => Promise<void>;
}) {
  const [condition, setCondition] = useState<ReturnCondition | null>(null),
    [physical, setPhysical] = useState<PhysicalCondition | null>(null),
    [notes, setNotes] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [received, setReceived] = useState(false),
    [complete, setComplete] = useState('');
  const inFlight = useRef(false);
  const receive = async () => {
    if (inFlight.current || !profile.assignment) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError('');
    try {
      await assignmentAction(profile.assignment.id, {
        action: 'receive',
        assetId: profile.asset.id,
        expectedUpdatedAt: profile.asset.updatedAt,
      });
      setReceived(true);
      await onRefresh();
    } catch (cause) {
      setError(
        toMessage(
          cause,
          'Could not record receipt. Refresh the asset before trying again.'
        )
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  };
  const inspect = async () => {
    if (inFlight.current || !condition || !physical) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError('');
    try {
      await inspectReturn({
        assetId: profile.asset.id,
        expectedUpdatedAt: profile.asset.updatedAt,
        condition,
        physicalCondition: physical,
        notes: notes.trim() || undefined,
      });
      setComplete(
        `Condition check recorded. The asset is now ${returnOutcomes[condition].status}.`
      );
    } catch (cause) {
      setError(
        toMessage(
          cause,
          'Could not record the inspection. Refresh the asset before trying again.'
        )
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  };
  if (complete)
    return <OperationSuccess assetId={profile.asset.id} message={complete} />;
  if (profile.asset.isArchived || profile.model.category.pillar === 'Software')
    return (
      <StateMessage
        type="empty"
        message="This asset does not use the equipment return workflow."
      />
    );
  if (received && profile.asset.status !== 'Returned')
    return (
      <View style={s.card}>
        <Text style={s.title}>Return received</Text>
        <Text style={s.note}>
          Custody has ended. Refresh the asset to continue the condition check.
        </Text>
        <Button onPress={onRefresh} disabled={busy}>
          Continue to inspection
        </Button>
      </View>
    );
  if (profile.asset.status === 'Returned')
    return (
      <View style={s.card}>
        <Text style={s.title}>Inspect returned equipment</Text>
        <Text style={s.note}>
          Record what you found during the physical inspection.
        </Text>
        <Text style={s.label}>Working condition</Text>
        <View style={s.row}>
          {(Object.keys(returnOutcomes) as ReturnCondition[]).map((value) => (
            <Choice
              key={value}
              label={value}
              selected={condition === value}
              disabled={busy}
              onPress={() => setCondition(value)}
            />
          ))}
        </View>
        <Text style={s.label}>Physical condition</Text>
        <View style={s.row}>
          {(
            [
              'New',
              'Excellent',
              'Fair',
              'Poor',
              'Damaged',
            ] as PhysicalCondition[]
          ).map((value) => (
            <Choice
              key={value}
              label={value}
              selected={physical === value}
              disabled={busy}
              onPress={() => setPhysical(value)}
            />
          ))}
        </View>
        <Field
          label="Inspection notes (optional)"
          multiline
          value={notes}
          onChangeText={setNotes}
          editable={!busy}
          maxLength={2000}
        />
        {condition ? (
          <View style={{ gap: 6 }}>
            <Text style={s.label}>
              Next status: {returnOutcomes[condition].status}
            </Text>
            <Text style={s.note}>{returnOutcomes[condition].description}</Text>
          </View>
        ) : null}
        {error ? (
          <>
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
            <Button variant="outline" onPress={onRefresh} disabled={busy}>
              Refresh asset status
            </Button>
          </>
        ) : null}
        <Button
          disabled={busy || !condition || !physical}
          onPress={() => {
            void inspect();
          }}
        >
          {busy ? 'Saving inspection...' : 'Confirm inspection'}
        </Button>
      </View>
    );
  if (
    profile.asset.status !== 'Assigned' ||
    !profile.assignment ||
    profile.assignment.state === 'pending approval'
  )
    return (
      <StateMessage
        type="empty"
        message="There is no accepted custody record to receive. Employee handovers must first be accepted in My Assets."
      />
    );
  return (
    <View style={s.card}>
      <Text style={s.title}>Confirm physical receipt</Text>
      <Text style={s.note}>
        Current custodian:{' '}
        {profile.assignment.assignedToUser?.name ||
          profile.assignment.assignedToLocation?.name ||
          'Not recorded'}
      </Text>
      <Text style={s.note}>
        Only confirm after you have the equipment. This ends custody and moves
        the asset to Returned, awaiting a condition check.
      </Text>
      {error ? (
        <>
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
          <Button variant="outline" disabled={busy} onPress={onRefresh}>
            Refresh asset status
          </Button>
        </>
      ) : null}
      <Button
        disabled={busy}
        onPress={() =>
          Alert.alert(
            'Receive this asset?',
            `Confirm that ${profile.asset.assetTag} is physically back with IT.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Receive asset',
                onPress: () => {
                  void receive();
                },
              },
            ]
          )
        }
      >
        {busy ? 'Recording receipt...' : 'Receive asset'}
      </Button>
    </View>
  );
}
