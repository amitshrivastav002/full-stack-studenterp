import { useState } from 'react';
import type { FormEvent } from 'react';
import { hostel } from '../../api/endpoints';
import { ROOM_TYPES } from '../../api/types';
import type {
  HostelAllocationRequest, HostelRoomRequest, HostelRoomResponse, RoomType,
} from '../../api/types';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useStudentOptions } from '../../lib/useStudentOptions';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, StatCard, Table, Td, Textarea,
} from '../../components/ui';
import { date, money, titleCase } from '../../lib/format';

const EMPTY_ROOM: HostelRoomRequest = {
  blockName: '',
  roomNumber: '',
  roomType: 'DOUBLE',
  capacity: 2,
  feePerYear: null,
};

export default function AdminHostel() {
  const rooms = useAsync(() => hostel.rooms(), []);
  const [showVacated, setShowVacated] = useState(false);
  const allocations = useAsync(() => hostel.allocations(!showVacated), [showVacated]);
  const studentOptions = useStudentOptions();

  const [roomOpen, setRoomOpen] = useState(false);
  const [editing, setEditing] = useState<HostelRoomResponse | null>(null);
  const [roomForm, setRoomForm] = useState<HostelRoomRequest>(EMPTY_ROOM);

  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateForm, setAllocateForm] = useState<HostelAllocationRequest>({
    studentId: 0, roomId: 0, remarks: '',
  });

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const beds = (rooms.data ?? []).reduce((sum, room) => sum + room.capacity, 0);
  const filled = (rooms.data ?? []).reduce((sum, room) => sum + room.occupied, 0);

  function startCreateRoom() {
    setEditing(null);
    setRoomForm(EMPTY_ROOM);
    setError('');
    setRoomOpen(true);
  }

  function startEditRoom(room: HostelRoomResponse) {
    setEditing(room);
    setRoomForm({
      blockName: room.blockName,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      capacity: room.capacity,
      feePerYear: room.feePerYear ?? null,
    });
    setError('');
    setRoomOpen(true);
  }

  async function saveRoom(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (editing) {
        await hostel.updateRoom(editing.id, roomForm);
        setNotice('Room updated.');
      } else {
        await hostel.createRoom(roomForm);
        setNotice('Room added.');
      }
      setRoomOpen(false);
      rooms.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeRoom(room: HostelRoomResponse) {
    if (!window.confirm(`Remove room ${room.blockName} ${room.roomNumber}?`)) return;
    try {
      const result = await hostel.removeRoom(room.id);
      setNotice(result.message);
      rooms.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function allocate(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await hostel.allocate(allocateForm);
      setNotice('Room allocated.');
      setAllocateOpen(false);
      rooms.reload();
      allocations.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function vacate(allocationId: number) {
    if (!window.confirm('Mark this room as vacated?')) return;
    try {
      await hostel.vacate(allocationId);
      setNotice('Room vacated.');
      rooms.reload();
      allocations.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Hostel"
        subtitle="Rooms and room allocation."
        actions={
          <>
            <Button variant="secondary" onClick={() => {
              setAllocateForm({ studentId: 0, roomId: 0, remarks: '' });
              setError('');
              setAllocateOpen(true);
            }}>
              Allocate room
            </Button>
            <Button onClick={startCreateRoom}>Add room</Button>
          </>
        }
      />

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rooms" value={rooms.data?.length ?? '—'} />
        <StatCard label="Beds" value={beds} />
        <StatCard label="Residents" value={filled} />
        <StatCard
          label="Beds free"
          value={beds - filled}
          tone={beds - filled > 0 ? 'positive' : 'warning'}
        />
      </div>

      <Card className="mt-6" title="Rooms">
        {rooms.loading ? <Spinner /> : rooms.error ? (
          <Alert>{rooms.error}</Alert>
        ) : (rooms.data ?? []).length === 0 ? (
          <EmptyState title="No rooms yet" hint="Add the first hostel room." />
        ) : (
          <Table head={['Block', 'Room', 'Type', 'Occupancy', 'Fee / year', '']}>
            {rooms.data!.map((room) => (
              <tr key={room.id}>
                <Td className="font-medium text-slate-900">{room.blockName}</Td>
                <Td className="font-mono text-xs">{room.roomNumber}</Td>
                <Td><Badge tone="blue">{titleCase(room.roomType)}</Badge></Td>
                <Td className="tabular-nums">
                  <Badge tone={room.available > 0 ? 'green' : 'amber'}>
                    {room.occupied} / {room.capacity}
                  </Badge>
                </Td>
                <Td className="tabular-nums">{money(room.feePerYear)}</Td>
                <Td className="whitespace-nowrap text-right">
                  <Button variant="ghost" onClick={() => startEditRoom(room)}>Edit</Button>
                  <Button variant="ghost" onClick={() => removeRoom(room)}>Remove</Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card
        className="mt-6"
        title="Allocations"
        actions={
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showVacated}
              onChange={(e) => setShowVacated(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Include vacated
          </label>
        }
      >
        {allocations.loading ? <Spinner /> : allocations.error ? (
          <Alert>{allocations.error}</Alert>
        ) : (allocations.data ?? []).length === 0 ? (
          <EmptyState title="No allocations" />
        ) : (
          <Table head={['Student', 'Room', 'Allocated', 'Vacated', 'Status', '']}>
            {allocations.data!.map((row) => (
              <tr key={row.id}>
                <Td>
                  <span className="font-medium text-slate-900">{row.studentName}</span>
                  <span className="block text-xs text-slate-400">{row.enrollmentNumber}</span>
                </Td>
                <Td className="whitespace-nowrap">
                  {row.blockName} · {row.roomNumber}
                </Td>
                <Td className="whitespace-nowrap text-xs">{date(row.allocatedOn)}</Td>
                <Td className="whitespace-nowrap text-xs">
                  {row.vacatedOn ? date(row.vacatedOn) : '—'}
                </Td>
                <Td>
                  {row.active
                    ? <Badge tone="green">Resident</Badge>
                    : <Badge tone="slate">Vacated</Badge>}
                </Td>
                <Td className="text-right">
                  {row.active && (
                    <Button variant="ghost" onClick={() => vacate(row.id)}>Vacate</Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={roomOpen}
        title={editing ? 'Edit room' : 'Add room'}
        onClose={() => setRoomOpen(false)}
      >
        <form onSubmit={saveRoom} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Block" required>
              <Input
                value={roomForm.blockName}
                onChange={(e) => setRoomForm({ ...roomForm, blockName: e.target.value })}
                placeholder="A Block"
                required
              />
            </Field>
            <Field label="Room number" required>
              <Input
                value={roomForm.roomNumber}
                onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                placeholder="101"
                required
              />
            </Field>
            <Field label="Room type" required>
              <Select
                value={roomForm.roomType}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, roomType: e.target.value as RoomType })}
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>{titleCase(type)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Capacity" required>
              <Input
                type="number"
                min={1}
                value={roomForm.capacity}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                required
              />
            </Field>
          </div>

          <Field label="Fee per year">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={roomForm.feePerYear ?? ''}
              onChange={(e) => setRoomForm({
                ...roomForm,
                feePerYear: e.target.value === '' ? null : Number(e.target.value),
              })}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setRoomOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add room'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={allocateOpen} title="Allocate a room" onClose={() => setAllocateOpen(false)}>
        <form onSubmit={allocate} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <Field label="Student" required error={studentOptions.error || undefined}>
            <Select
              value={allocateForm.studentId || ''}
              onChange={(e) =>
                setAllocateForm({ ...allocateForm, studentId: Number(e.target.value) })}
              required
            >
              <option value="">Select a student…</option>
              {studentOptions.options.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Room" required>
            <Select
              value={allocateForm.roomId || ''}
              onChange={(e) =>
                setAllocateForm({ ...allocateForm, roomId: Number(e.target.value) })}
              required
            >
              <option value="">Select a room…</option>
              {(rooms.data ?? [])
                .filter((room) => room.available > 0)
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.blockName} · {room.roomNumber} ({room.available} bed(s) free)
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Remarks">
            <Textarea
              rows={2}
              value={allocateForm.remarks ?? ''}
              onChange={(e) =>
                setAllocateForm({ ...allocateForm, remarks: e.target.value })}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAllocateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Allocating…' : 'Allocate'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
