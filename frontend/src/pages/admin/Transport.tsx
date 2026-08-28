import { useState } from 'react';
import type { FormEvent } from 'react';
import { transport } from '../../api/endpoints';
import type {
  TransportAssignmentRequest, TransportRouteRequest, TransportRouteResponse,
  TransportStopRequest,
} from '../../api/types';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useStudentOptions } from '../../lib/useStudentOptions';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, StatCard, Table, Td,
} from '../../components/ui';
import { date, money, time } from '../../lib/format';

const EMPTY_ROUTE: TransportRouteRequest = {
  routeCode: '',
  routeName: '',
  vehicleNumber: '',
  driverName: '',
  driverMobile: '',
  capacity: 40,
  farePerYear: null,
};

export default function AdminTransport() {
  const routes = useAsync(() => transport.routes(), []);
  const [showReleased, setShowReleased] = useState(false);
  const assignments = useAsync(() => transport.assignments(!showReleased), [showReleased]);
  const studentOptions = useStudentOptions();

  const [routeOpen, setRouteOpen] = useState(false);
  const [editing, setEditing] = useState<TransportRouteResponse | null>(null);
  const [routeForm, setRouteForm] = useState<TransportRouteRequest>(EMPTY_ROUTE);

  const [stopFor, setStopFor] = useState<TransportRouteResponse | null>(null);
  const [stopForm, setStopForm] = useState<TransportStopRequest>({
    stopName: '', pickupTime: '', dropTime: '',
  });

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState<TransportAssignmentRequest>({
    studentId: 0, routeId: 0, stopId: null,
  });

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const seats = (routes.data ?? []).reduce((sum, route) => sum + route.capacity, 0);
  const taken = (routes.data ?? []).reduce((sum, route) => sum + route.occupied, 0);
  const selectedRoute = (routes.data ?? []).find((route) => route.id === assignForm.routeId);

  function startCreateRoute() {
    setEditing(null);
    setRouteForm(EMPTY_ROUTE);
    setError('');
    setRouteOpen(true);
  }

  function startEditRoute(route: TransportRouteResponse) {
    setEditing(route);
    setRouteForm({
      routeCode: route.routeCode,
      routeName: route.routeName,
      vehicleNumber: route.vehicleNumber ?? '',
      driverName: route.driverName ?? '',
      driverMobile: route.driverMobile ?? '',
      capacity: route.capacity,
      farePerYear: route.farePerYear ?? null,
    });
    setError('');
    setRouteOpen(true);
  }

  async function saveRoute(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (editing) {
        await transport.updateRoute(editing.id, routeForm);
        setNotice('Route updated.');
      } else {
        await transport.createRoute(routeForm);
        setNotice('Route added.');
      }
      setRouteOpen(false);
      routes.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeRoute(route: TransportRouteResponse) {
    if (!window.confirm(`Remove route ${route.routeCode}?`)) return;
    try {
      const result = await transport.removeRoute(route.id);
      setNotice(result.message);
      routes.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function saveStop(event: FormEvent) {
    event.preventDefault();
    if (!stopFor) return;
    setError('');
    setBusy(true);
    try {
      await transport.addStop(stopFor.id, {
        ...stopForm,
        pickupTime: stopForm.pickupTime || null,
        dropTime: stopForm.dropTime || null,
      });
      setNotice('Stop added.');
      setStopFor(null);
      routes.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeStop(stopId: number) {
    try {
      await transport.removeStop(stopId);
      setNotice('Stop removed.');
      routes.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function assign(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await transport.assign({ ...assignForm, stopId: assignForm.stopId || null });
      setNotice('Student assigned to the route.');
      setAssignOpen(false);
      routes.reload();
      assignments.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function release(assignmentId: number) {
    if (!window.confirm('Release this student from the route?')) return;
    try {
      await transport.release(assignmentId);
      setNotice('Assignment released.');
      routes.reload();
      assignments.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Transport"
        subtitle="Routes, stops and student assignments."
        actions={
          <>
            <Button variant="secondary" onClick={() => {
              setAssignForm({ studentId: 0, routeId: 0, stopId: null });
              setError('');
              setAssignOpen(true);
            }}>
              Assign student
            </Button>
            <Button onClick={startCreateRoute}>Add route</Button>
          </>
        }
      />

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Routes" value={routes.data?.length ?? '—'} />
        <StatCard label="Seats" value={seats} />
        <StatCard label="Riders" value={taken} />
        <StatCard
          label="Seats free"
          value={seats - taken}
          tone={seats - taken > 0 ? 'positive' : 'warning'}
        />
      </div>

      <div className="mt-6 space-y-4">
        {routes.loading ? <Spinner /> : routes.error ? (
          <Alert>{routes.error}</Alert>
        ) : (routes.data ?? []).length === 0 ? (
          <EmptyState title="No routes yet" hint="Add your first transport route." />
        ) : (
          routes.data!.map((route) => (
            <Card
              key={route.id}
              title={`${route.routeCode} · ${route.routeName}`}
              description={[
                route.vehicleNumber,
                route.driverName && `${route.driverName}${route.driverMobile ? ` (${route.driverMobile})` : ''}`,
                `${route.occupied}/${route.capacity} seats taken`,
                route.farePerYear ? `${money(route.farePerYear)} per year` : null,
              ].filter(Boolean).join(' · ')}
              actions={
                <>
                  <Button variant="ghost" onClick={() => {
                    setStopFor(route);
                    setStopForm({ stopName: '', pickupTime: '', dropTime: '' });
                    setError('');
                  }}>
                    Add stop
                  </Button>
                  <Button variant="ghost" onClick={() => startEditRoute(route)}>Edit</Button>
                  <Button variant="ghost" onClick={() => removeRoute(route)}>Remove</Button>
                </>
              }
            >
              {route.stops.length === 0 ? (
                <EmptyState title="No stops on this route yet" />
              ) : (
                <Table head={['Stop', 'Pickup', 'Drop', '']}>
                  {route.stops.map((stop) => (
                    <tr key={stop.id}>
                      <Td className="font-medium text-slate-900">{stop.stopName}</Td>
                      <Td className="tabular-nums">{time(stop.pickupTime)}</Td>
                      <Td className="tabular-nums">{time(stop.dropTime)}</Td>
                      <Td className="text-right">
                        <Button variant="ghost" onClick={() => removeStop(stop.id)}>
                          Remove
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          ))
        )}
      </div>

      <Card
        className="mt-6"
        title="Student assignments"
        actions={
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showReleased}
              onChange={(e) => setShowReleased(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Include released
          </label>
        }
      >
        {assignments.loading ? <Spinner /> : assignments.error ? (
          <Alert>{assignments.error}</Alert>
        ) : (assignments.data ?? []).length === 0 ? (
          <EmptyState title="No students assigned" />
        ) : (
          <Table head={['Student', 'Route', 'Stop', 'Pickup', 'Assigned', 'Status', '']}>
            {assignments.data!.map((row) => (
              <tr key={row.id}>
                <Td>
                  <span className="font-medium text-slate-900">{row.studentName}</span>
                  <span className="block text-xs text-slate-400">{row.enrollmentNumber}</span>
                </Td>
                <Td className="whitespace-nowrap">{row.routeCode}</Td>
                <Td>{row.stopName ?? '—'}</Td>
                <Td className="tabular-nums">{time(row.pickupTime)}</Td>
                <Td className="whitespace-nowrap text-xs">{date(row.assignedOn)}</Td>
                <Td>
                  {row.active
                    ? <Badge tone="green">Active</Badge>
                    : <Badge tone="slate">Released</Badge>}
                </Td>
                <Td className="text-right">
                  {row.active && (
                    <Button variant="ghost" onClick={() => release(row.id)}>Release</Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={routeOpen}
        title={editing ? 'Edit route' : 'Add route'}
        onClose={() => setRouteOpen(false)}
      >
        <form onSubmit={saveRoute} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Route code" required>
              <Input
                value={routeForm.routeCode}
                onChange={(e) => setRouteForm({ ...routeForm, routeCode: e.target.value })}
                placeholder="R-01"
                required
              />
            </Field>
            <Field label="Route name" required>
              <Input
                value={routeForm.routeName}
                onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                placeholder="City centre — campus"
                required
              />
            </Field>
            <Field label="Vehicle number">
              <Input
                value={routeForm.vehicleNumber ?? ''}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, vehicleNumber: e.target.value })}
              />
            </Field>
            <Field label="Driver name">
              <Input
                value={routeForm.driverName ?? ''}
                onChange={(e) => setRouteForm({ ...routeForm, driverName: e.target.value })}
              />
            </Field>
            <Field label="Driver mobile" hint="10 digits.">
              <Input
                value={routeForm.driverMobile ?? ''}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, driverMobile: e.target.value })}
              />
            </Field>
            <Field label="Capacity" required>
              <Input
                type="number"
                min={1}
                value={routeForm.capacity}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, capacity: Number(e.target.value) })}
                required
              />
            </Field>
          </div>

          <Field label="Fare per year">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={routeForm.farePerYear ?? ''}
              onChange={(e) => setRouteForm({
                ...routeForm,
                farePerYear: e.target.value === '' ? null : Number(e.target.value),
              })}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setRouteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add route'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={stopFor !== null}
        title={stopFor ? `Add a stop to ${stopFor.routeCode}` : 'Add stop'}
        onClose={() => setStopFor(null)}
      >
        <form onSubmit={saveStop} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <Field label="Stop name" required>
            <Input
              value={stopForm.stopName}
              onChange={(e) => setStopForm({ ...stopForm, stopName: e.target.value })}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pickup time">
              <Input
                type="time"
                value={stopForm.pickupTime ?? ''}
                onChange={(e) => setStopForm({ ...stopForm, pickupTime: e.target.value })}
              />
            </Field>
            <Field label="Drop time">
              <Input
                type="time"
                value={stopForm.dropTime ?? ''}
                onChange={(e) => setStopForm({ ...stopForm, dropTime: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setStopFor(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Add stop'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={assignOpen} title="Assign a student" onClose={() => setAssignOpen(false)}>
        <form onSubmit={assign} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <Field label="Student" required error={studentOptions.error || undefined}>
            <Select
              value={assignForm.studentId || ''}
              onChange={(e) =>
                setAssignForm({ ...assignForm, studentId: Number(e.target.value) })}
              required
            >
              <option value="">Select a student…</option>
              {studentOptions.options.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Route" required>
            <Select
              value={assignForm.routeId || ''}
              onChange={(e) => setAssignForm({
                ...assignForm, routeId: Number(e.target.value), stopId: null,
              })}
              required
            >
              <option value="">Select a route…</option>
              {(routes.data ?? [])
                .filter((route) => route.available > 0)
                .map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.routeCode} — {route.routeName} ({route.available} seat(s) free)
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Stop" hint="Optional, but it tells the student where to wait.">
            <Select
              value={assignForm.stopId ?? ''}
              onChange={(e) => setAssignForm({
                ...assignForm,
                stopId: e.target.value === '' ? null : Number(e.target.value),
              })}
              disabled={!selectedRoute}
            >
              <option value="">No specific stop</option>
              {(selectedRoute?.stops ?? []).map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.stopName}{stop.pickupTime ? ` · ${time(stop.pickupTime)}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
