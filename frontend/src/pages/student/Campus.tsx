import { studentCampus } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import {
  Alert, Badge, Card, EmptyState, PageHeader, Spinner, Table, Td,
} from '../../components/ui';
import { date, money, time, titleCase } from '../../lib/format';

/** Hostel and transport, the two campus services attached to a student. */
export default function StudentCampus() {
  const hostel = useAsync(() => studentCampus.hostel(), []);
  const transport = useAsync(() => studentCampus.transport(), []);

  const currentRoom = (hostel.data ?? []).find((row) => row.active);
  const currentRoute = (transport.data ?? []).find((row) => row.active);

  return (
    <>
      <PageHeader
        title="Hostel & transport"
        subtitle="Your accommodation and bus arrangements."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Hostel" description="Your current room.">
          {hostel.loading ? <Spinner /> : hostel.error ? (
            <Alert>{hostel.error}</Alert>
          ) : !currentRoom ? (
            <EmptyState
              title="No room allocated"
              hint="Contact the hostel office if you have applied for accommodation."
            />
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              {([
                ['Block', currentRoom.blockName],
                ['Room', currentRoom.roomNumber],
                ['Type', titleCase(currentRoom.roomType)],
                ['Fee per year', money(currentRoom.feePerYear)],
                ['Allocated on', date(currentRoom.allocatedOn)],
              ] as Array<[string, string]>).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <Card title="Transport" description="Your current route.">
          {transport.loading ? <Spinner /> : transport.error ? (
            <Alert>{transport.error}</Alert>
          ) : !currentRoute ? (
            <EmptyState
              title="No route assigned"
              hint="Contact the transport office if you need a bus pass."
            />
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              {([
                ['Route', `${currentRoute.routeCode} — ${currentRoute.routeName}`],
                ['Stop', currentRoute.stopName ?? 'Not set'],
                ['Pickup', time(currentRoute.pickupTime)],
                ['Vehicle', currentRoute.vehicleNumber ?? '—'],
                ['Driver', currentRoute.driverName ?? '—'],
                ['Driver mobile', currentRoute.driverMobile ?? '—'],
                ['Fare per year', money(currentRoute.farePerYear)],
                ['Assigned on', date(currentRoute.assignedOn)],
              ] as Array<[string, string]>).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>

      {(hostel.data ?? []).length > 1 && (
        <Card className="mt-6" title="Hostel history">
          <Table head={['Block', 'Room', 'Allocated', 'Vacated', 'Status']}>
            {hostel.data!.map((row) => (
              <tr key={row.id}>
                <Td>{row.blockName}</Td>
                <Td className="font-mono text-xs">{row.roomNumber}</Td>
                <Td className="whitespace-nowrap text-xs">{date(row.allocatedOn)}</Td>
                <Td className="whitespace-nowrap text-xs">
                  {row.vacatedOn ? date(row.vacatedOn) : '—'}
                </Td>
                <Td>
                  {row.active
                    ? <Badge tone="green">Current</Badge>
                    : <Badge tone="slate">Past</Badge>}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </>
  );
}
