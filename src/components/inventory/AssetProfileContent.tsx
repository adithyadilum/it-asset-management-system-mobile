import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Clock3,
  MapPin,
  ShieldCheck,
  UserRound,
  Wrench,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import type { AssetProfile } from '../../types/inventory';
import {
  formatProfileDate,
  formatSpecification,
  formatSpecificationLabel,
} from '../../lib/asset-profile';
import { AssetImage } from './AssetImage';
import { AssetStatus } from './AssetStatus';
import { Button } from '../ui/Button';
import { IssueReportForm } from '../dashboard/assets/IssueReportForm';

type Tab = 'Overview' | 'Specifications' | 'History';
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>
        {value || 'Not recorded'}
      </Text>
    </View>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
export function AssetProfileContent({
  profile,
  onIssueReported,
  onBusyChange,
}: {
  profile: AssetProfile;
  onIssueReported: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>('Overview');
  const [reporting, setReporting] = useState(false);
  const { asset, model, assignment, softwareLicense } = profile;
  const custodian =
    assignment?.assignedToUser?.name || assignment?.assignedToLocation?.name;
  const canReport =
    model.category.pillar !== 'Software' &&
    !['Disposed', 'In Repair'].includes(asset.status) &&
    !profile.maintenance.some((ticket) => ticket.status === 'ACTIVE');
  const specs = Object.entries(profile.specifications).filter(
    ([, value]) => value != null && value !== ''
  );
  return (
    <>
      <View style={styles.hero}>
        <AssetImage uri={model.imageUrl} large />
        <Text style={styles.tag}>{asset.assetTag}</Text>
        <Text style={styles.title}>{asset.name || model.name}</Text>
        <Text style={styles.subtitle}>
          {model.brand.name} ? {model.category.name}
        </Text>
        <AssetStatus status={asset.status} />
        <View style={styles.context}>
          <View style={styles.contextRow}>
            <MapPin size={14} color={Colors.mutedForeground} />
            <Text style={styles.contextText}>
              {profile.location?.name || 'Location not recorded'}
            </Text>
          </View>
          <View style={styles.contextRow}>
            <UserRound size={14} color={Colors.mutedForeground} />
            <Text style={styles.contextText}>
              {custodian || 'No current custodian'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {(['Overview', 'Specifications', 'History'] as Tab[]).map((name) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === name }}
            onPress={() => setTab(name)}
            style={[styles.tab, tab === name && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                tab === name && { color: Colors.primary },
              ]}
            >
              {name}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.body}>
        {tab === 'Overview' && (
          <>
            <Section title="Asset information">
              <DetailRow label="Model" value={model.name} />
              <DetailRow label="Serial number" value={asset.serialNumber} />
              <DetailRow label="Asset type" value={model.category.pillar} />
              <DetailRow label="Condition" value={asset.condition} />
              <DetailRow label="Owner" value={profile.owner?.companyName} />
              <DetailRow
                label="Last updated"
                value={formatProfileDate(asset.updatedAt)}
              />
            </Section>
            <Section title="Custody & assignment">
              {assignment ? (
                <>
                  <DetailRow label="Custodian" value={custodian} />
                  {assignment.assignedToUser?.email ? (
                    <DetailRow
                      label="Email"
                      value={assignment.assignedToUser.email}
                    />
                  ) : null}
                  <DetailRow label="State" value={assignment.state} />
                  <DetailRow
                    label="Assigned"
                    value={formatProfileDate(assignment.assignedDate)}
                  />
                  <DetailRow
                    label="Expected return"
                    value={
                      assignment.expectedReturnDate
                        ? formatProfileDate(assignment.expectedReturnDate)
                        : 'Open-ended'
                    }
                  />
                </>
              ) : (
                <Text style={styles.note}>
                  {softwareLicense
                    ? 'Software seats are allocated individually. See licence usage below.'
                    : 'No open assignment for this asset.'}
                </Text>
              )}
            </Section>
            {softwareLicense ? (
              <Section title="Software licence">
                <DetailRow
                  label="Licence type"
                  value={softwareLicense.licenseType}
                />
                <View style={styles.seats}>
                  <View>
                    <Text style={styles.seatValue}>
                      {softwareLicense.totalSeats -
                        softwareLicense.availableSeats}
                    </Text>
                    <Text style={styles.note}>Allocated</Text>
                  </View>
                  <View>
                    <Text style={styles.seatValue}>
                      {softwareLicense.availableSeats}
                    </Text>
                    <Text style={styles.note}>Unused</Text>
                  </View>
                  <View>
                    <Text style={styles.seatValue}>
                      {softwareLicense.totalSeats}
                    </Text>
                    <Text style={styles.note}>Purchased</Text>
                  </View>
                </View>
                <DetailRow
                  label="Starts"
                  value={formatProfileDate(softwareLicense.startDate)}
                />
                <DetailRow
                  label="Expires"
                  value={
                    softwareLicense.expiryDate
                      ? formatProfileDate(softwareLicense.expiryDate)
                      : 'No expiry recorded'
                  }
                />
              </Section>
            ) : (
              <Section title="Warranty">
                <View style={styles.contextRow}>
                  <ShieldCheck size={18} color={Colors.primary} />
                  <Text style={styles.note}>
                    {profile.warrantyExpiry
                      ? `Warranty expires ${formatProfileDate(profile.warrantyExpiry)}`
                      : 'No warranty information recorded'}
                  </Text>
                </View>
              </Section>
            )}
            <Section title="Recent maintenance">
              {profile.maintenance.length ? (
                profile.maintenance.map((ticket) => (
                  <View key={ticket.id} style={styles.event}>
                    <Wrench size={16} color={Colors.status.repair} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.eventTitle}>
                        Ticket #{ticket.id} ? {ticket.status.toLowerCase()}
                      </Text>
                      <Text style={styles.note}>{ticket.reportedIssue}</Text>
                      <Text style={styles.note}>
                        {ticket.vendorName || 'Internal support'} ?{' '}
                        {formatProfileDate(ticket.createdAt)}
                      </Text>
                      {ticket.estimatedReturnDate &&
                      !ticket.actualCompletionDate ? (
                        <Text style={styles.note}>
                          Expected return{' '}
                          {formatProfileDate(ticket.estimatedReturnDate)}
                        </Text>
                      ) : null}
                      {ticket.actualCompletionDate ? (
                        <Text style={styles.note}>
                          Completed{' '}
                          {formatProfileDate(ticket.actualCompletionDate)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.note}>
                  No maintenance tickets recorded.
                </Text>
              )}
              {profile.maintenance.length === 5 && (
                <Text style={styles.note}>Showing the latest 5 tickets.</Text>
              )}
            </Section>
          </>
        )}
        {tab === 'Specifications' && (
          <Section title="Product specifications">
            {specs.length ? (
              specs.map(([key, value]) => (
                <DetailRow
                  key={key}
                  label={formatSpecificationLabel(key)}
                  value={formatSpecification(value)}
                />
              ))
            ) : (
              <Text style={styles.note}>
                No product specifications recorded.
              </Text>
            )}
          </Section>
        )}
        {tab === 'History' && (
          <Section title="Recent activity">
            {profile.history.length ? (
              profile.history.map((event) => (
                <View key={event.id} style={styles.event}>
                  <Clock3 size={16} color={Colors.primary} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.eventTitle}>{event.eventType}</Text>
                    <Text style={styles.note}>{event.description}</Text>
                    {event.details ? (
                      <Text style={styles.note}>{event.details}</Text>
                    ) : null}
                    <Text style={styles.note}>{event.actor}</Text>
                    <Text style={styles.note}>{event.timestamp}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.note}>
                No activity recorded for this asset.
              </Text>
            )}
            {profile.history.length === 20 && (
              <Text style={styles.note}>Showing the latest 20 events.</Text>
            )}
          </Section>
        )}
        {canReport && (
          <View style={styles.section}>
            {reporting ? (
              <IssueReportForm
                assetId={asset.id}
                assetTag={asset.assetTag}
                onBusyChange={onBusyChange}
                onCancel={() => setReporting(false)}
                onSubmitted={() => {
                  setReporting(false);
                  onIssueReported();
                }}
              />
            ) : (
              <Button
                variant="outline"
                onPress={() => setReporting(true)}
                icon={<Wrench size={16} color={Colors.primary} />}
              >
                Report an issue
              </Button>
            )}
          </View>
        )}
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 24,
    gap: 9,
  },
  tag: {
    color: Colors.primary,
    fontFamily: 'NotoSans_700Bold',
    letterSpacing: 1,
    fontSize: 11,
    marginTop: 6,
  },
  title: {
    color: Colors.foreground,
    fontFamily: 'NotoSans_700Bold',
    fontSize: 23,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.mutedForeground,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  context: { gap: 9, paddingTop: 12, width: '100%' },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contextText: {
    color: Colors.foreground,
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: Colors.primary },
  tabText: {
    color: Colors.mutedForeground,
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
  },
  body: { padding: 18, gap: 14 },
  section: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.card,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    color: Colors.foreground,
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
    marginBottom: 4,
  },
  detail: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  label: {
    flex: 0.45,
    color: Colors.mutedForeground,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    lineHeight: 19,
  },
  value: {
    flex: 0.55,
    color: Colors.foreground,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    lineHeight: 19,
  },
  note: {
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    fontSize: 12,
    lineHeight: 19,
    flexShrink: 1,
  },
  seats: {
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  seatValue: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 22,
    color: Colors.primary,
    textAlign: 'center',
  },
  event: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  eventTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: Colors.foreground,
    textTransform: 'capitalize',
  },
});
