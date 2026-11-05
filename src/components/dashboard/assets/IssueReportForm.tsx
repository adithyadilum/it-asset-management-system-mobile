import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { reportAssetIssue } from '../../../services/issues';
import { toMessage } from '../../../lib/errors';
import { Colors } from '../../../constants/colors';
import { Button } from '../../ui/Button';

export function IssueReportForm({
  assetId,
  assetTag,
  onSubmitted,
  onCancel,
  onBusyChange,
}: {
  assetId: string;
  assetTag: string;
  onSubmitted: () => void;
  onCancel: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [note, setNote] = useState(''),
    [pending, setPending] = useState(false),
    [error, setError] = useState('');
  const inFlight = useRef(false);
  const submit = async () => {
    if (inFlight.current || !note.trim()) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    onBusyChange?.(true);
    try {
      const result = await reportAssetIssue(assetId, note.trim());
      Alert.alert(
        'Issue reported',
        result.ticketId
          ? `Ticket #${result.ticketId} has been sent to IT for review.`
          : 'Your issue has been sent to IT for review.'
      );
      onBusyChange?.(false);
      onSubmitted();
    } catch (cause) {
      setError(toMessage(cause, 'Could not submit the issue. Try again.'));
    } finally {
      inFlight.current = false;
      setPending(false);
      onBusyChange?.(false);
    }
  };
  return (
    <View style={{ gap: 12, marginTop: 16 }}>
      <Text
        style={{
          fontFamily: 'NotoSans_700Bold',
          fontSize: 16,
          color: Colors.foreground,
        }}
      >
        Report an issue
      </Text>
      <Text style={{ fontSize: 13, color: Colors.mutedForeground }}>
        {assetTag} · IT will review this report. The equipment will enter the
        repair workflow.
      </Text>
      <TextInput
        accessibilityLabel="Issue description"
        value={note}
        onChangeText={setNote}
        editable={!pending}
        maxLength={1000}
        multiline
        textAlignVertical="top"
        placeholder="Describe the fault or damage..."
        style={{
          minHeight: 120,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 10,
          padding: 12,
          color: Colors.foreground,
        }}
      />
      {error ? (
        <Text accessibilityRole="alert" style={{ color: Colors.destructive }}>
          {error}
        </Text>
      ) : null}
      <Button onPress={() => void submit()} disabled={pending || !note.trim()}>
        {pending ? 'Submitting...' : 'Submit report'}
      </Button>
      <Button variant="outline" onPress={onCancel} disabled={pending}>
        Cancel
      </Button>
    </View>
  );
}
