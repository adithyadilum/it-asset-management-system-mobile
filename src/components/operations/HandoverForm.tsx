import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AssetProfile } from '../../types/inventory';
import type { Recipient } from '../../types/operations';
import { createHandover, searchRecipients } from '../../services/operations';
import { toMessage } from '../../lib/errors';
import { Button } from '../ui/Button';
import { StateMessage } from '../ui/StateMessage';
import {
  Choice,
  Field,
  OperationSuccess,
  operationStyles as s,
} from './OperationLayout';
import { Colors } from '../../constants/colors';
function futureDay(days: number) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() + days * 86400000));
}
export function HandoverForm({
  profile,
  onBusyChange,
  onRefresh,
}: {
  profile: AssetProfile;
  onBusyChange: (busy: boolean) => void;
  onRefresh: () => void;
}) {
  const [type, setType] = useState<'user' | 'location'>('user'),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState<Recipient | null>(null),
    [recipients, setRecipients] = useState<Recipient[]>([]),
    [searching, setSearching] = useState(false),
    [searchError, setSearchError] = useState(''),
    [hasMore, setHasMore] = useState(false),
    [date, setDate] = useState(''),
    [notes, setNotes] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (type === 'user' && query.trim().length < 2) return;
      setSearching(true);
      setSearchError('');
      try {
        const result = await searchRecipients(type, query.trim());
        if (active) {
          setRecipients(result.data);
          setHasMore(result.hasMore);
        }
      } catch (cause) {
        if (active)
          setSearchError(toMessage(cause, 'Could not search recipients.'));
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [type, query]);
  const submit = async () => {
    if (inFlight.current || !selected) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError('');
    try {
      const result = await createHandover({
        assetId: profile.asset.id,
        expectedUpdatedAt: profile.asset.updatedAt,
        assignmentType: type,
        targetId: selected.id,
        expectedReturnDate: date || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(result.message);
    } catch (cause) {
      setError(
        toMessage(
          cause,
          'Could not create this handover. Refresh the asset before trying again.'
        )
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  };
  if (success)
    return <OperationSuccess assetId={profile.asset.id} message={success} />;
  if (
    profile.asset.isArchived ||
    profile.asset.status !== 'Available' ||
    profile.model.category.pillar === 'Software' ||
    profile.assignment
  )
    return (
      <StateMessage
        type="error"
        message="This asset is not available for a new handover. Refresh it to see its latest status."
        onRetry={onRefresh}
      />
    );
  return (
    <View style={s.card}>
      <Text style={s.title}>Who is receiving this asset?</Text>
      <View style={s.row}>
        {(['user', 'location'] as const).map((value) => (
          <Choice
            key={value}
            label={value === 'user' ? 'Employee' : 'Location'}
            selected={type === value}
            disabled={busy}
            onPress={() => {
              setType(value);
              setSelected(null);
              setQuery('');
              setRecipients([]);
            }}
          />
        ))}
      </View>
      {selected ? (
        <View
          style={{
            gap: 5,
            padding: 12,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 10,
          }}
        >
          <Text style={s.title}>{selected.name}</Text>
          <Text style={s.note}>{selected.detail}</Text>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onPress={() => setSelected(null)}
          >
            Change recipient
          </Button>
        </View>
      ) : (
        <>
          <Field
            label={type === 'user' ? 'Search employees' : 'Search locations'}
            value={query}
            editable={!busy}
            onChangeText={(value) => {
              setQuery(value);
              setRecipients([]);
            }}
            autoCapitalize="none"
            placeholder={
              type === 'user'
                ? 'Name or email (at least 2 characters)'
                : 'Location name'
            }
          />
          {searching ? (
            <StateMessage type="loading" message="Searching..." />
          ) : searchError ? (
            <Text accessibilityRole="alert" style={s.error}>
              {searchError}
            </Text>
          ) : (
            recipients.map((person) => (
              <Pressable
                key={person.id}
                accessibilityRole="button"
                accessibilityLabel={`Select ${person.name}`}
                disabled={busy}
                onPress={() => setSelected(person)}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.border,
                  gap: 4,
                }}
              >
                <Text style={s.label}>{person.name}</Text>
                <Text style={s.note}>{person.detail}</Text>
              </Pressable>
            ))
          )}
          {!searching &&
          !searchError &&
          !recipients.length &&
          (type === 'location' || query.trim().length >= 2) ? (
            <Text style={s.note}>No active recipients found.</Text>
          ) : null}
          {hasMore ? (
            <Text style={s.note}>
              Showing the first 20 matches. Refine your search to find someone
              else.
            </Text>
          ) : null}
        </>
      )}
      <Text style={s.label}>Expected return</Text>
      <View style={s.row}>
        <Choice
          label="Open-ended"
          selected={!date}
          disabled={busy}
          onPress={() => setDate('')}
        />
        <Choice
          label="In 7 days"
          selected={date === futureDay(7)}
          disabled={busy}
          onPress={() => setDate(futureDay(7))}
        />
        <Choice
          label="In 30 days"
          selected={date === futureDay(30)}
          disabled={busy}
          onPress={() => setDate(futureDay(30))}
        />
      </View>
      <Field
        label="Return date (optional)"
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        editable={!busy}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <Field
        label="Handover notes (optional)"
        value={notes}
        onChangeText={setNotes}
        editable={!busy}
        maxLength={2000}
        multiline
      />
      <Text style={s.note}>
        {type === 'user'
          ? 'The employee will accept or decline this handover in My Assets. Creating it does not confirm their acceptance.'
          : 'Location custody takes effect as soon as this handover is recorded.'}
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
        disabled={busy || !selected}
        onPress={() => {
          void submit();
        }}
      >
        {busy ? 'Recording handover...' : 'Create handover'}
      </Button>
    </View>
  );
}
