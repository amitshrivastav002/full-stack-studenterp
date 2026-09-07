import { useState } from 'react';
import type { FormEvent } from 'react';
import { fees as feesApi, students as studentsApi } from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useLookups } from '../../lib/useLookups';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, StatCard, Table, Td,
} from '../../components/ui';
import { openCheckout } from '../../lib/razorpay';
import { FEE_TYPES, PAYMENT_METHODS } from '../../api/types';
import type {
  FeePaymentResponse, FeeType, PaymentMethod, StudentFeeResponse,
  StudentResponse,
} from '../../api/types';
import { currentAcademicYear, dateTime, fullName, money, titleCase } from '../../lib/format';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * How a counter collection is filed once Razorpay confirms it.  CASH is left
 * out on purpose: money that moved through the gateway was never cash.
 */
const ONLINE_METHODS: PaymentMethod[] = ['ONLINE', 'UPI', 'CARD', 'NET_BANKING'];

export default function AdminFees() {
  const [tab, setTab] = useState<'structures' | 'students' | 'razorpay'>('structures');

  return (
    <>
      <PageHeader
        title="Fees"
        subtitle="Define fee structures, assign them to students, and record payments."
      />

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {([
          ['structures', 'Fee structures'],
          ['students', 'Student fees & payments'],
          ['razorpay', 'Online payments'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              tab === key
                ? 'border-b-2 border-brand-600 px-4 py-2 text-sm font-medium text-brand-700'
                : 'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800'
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'structures' ? <StructuresTab />
        : tab === 'students' ? <StudentFeesTab />
          : <RazorpayTab />}
    </>
  );
}

function StructuresTab() {
  const { courses } = useLookups();
  const list = useAsync(() => feesApi.structures(), []);

  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');

  return (
    <>
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <Card
        title="Fee structures"
        description={list.data ? `${list.data.length} structure(s)` : undefined}
        actions={
          <Button onClick={() => setOpen(true)} disabled={courses.length === 0}>
            Add structure
          </Button>
        }
      >
        {list.loading ? <Spinner /> : list.error ? (
          <Alert>{list.error}</Alert>
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState
            title="No fee structures"
            hint="Define a structure before assigning fees to students."
          />
        ) : (
          <Table head={['ID', 'Course', 'Semester', 'Type', 'Amount', 'Academic year', 'Status']}>
            {list.data!.map((row) => (
              <tr key={row.id}>
                <Td className="tabular-nums text-slate-400">{row.id}</Td>
                <Td className="font-medium text-slate-900">{row.courseName}</Td>
                <Td className="tabular-nums">{row.semester}</Td>
                <Td><Badge tone="blue">{titleCase(row.feeType)}</Badge></Td>
                <Td className="tabular-nums">{money(row.amount)}</Td>
                <Td>{row.academicYear}</Td>
                <Td>
                  <Badge tone={row.active ? 'green' : 'slate'}>
                    {row.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <StructureModal
        open={open}
        courses={courses}
        onClose={() => setOpen(false)}
        onSaved={() => { setNotice('Fee structure created.'); list.reload(); }}
      />
    </>
  );
}

function StructureModal({ open, courses, onClose, onSaved }: {
  open: boolean;
  courses: Array<{ id?: number; courseName: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [courseId, setCourseId] = useState(0);
  const [semester, setSemester] = useState(1);
  const [feeType, setFeeType] = useState<FeeType>('TUITION');
  const [amount, setAmount] = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await feesApi.createStructure({
        courseId, semester, feeType, amount: Number(amount), academicYear,
      });
      setAmount('');
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Add fee structure" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

        <Field label="Course" required>
          <Select value={courseId} onChange={(e) => setCourseId(Number(e.target.value))} required>
            <option value={0} disabled>Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.courseName}</option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Semester" required>
            <Select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              {SEMESTERS.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>

          <Field label="Fee type" required>
            <Select value={feeType} onChange={(e) => setFeeType(e.target.value as FeeType)}>
              {FEE_TYPES.map((type) => (
                <option key={type} value={type}>{titleCase(type)}</option>
              ))}
            </Select>
          </Field>

          <Field label="Amount" required>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="45000"
              required
            />
          </Field>

          <Field label="Academic year" required>
            <Input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              required
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || courseId === 0}>
            {busy ? 'Saving…' : 'Create structure'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function StudentFeesTab() {
  const [keyword, setKeyword] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const listed = useAsync(
    () => studentsApi.list({ page: 0, size: 50, sortBy: 'id', sortDir: 'asc' }),
    [],
    activeSearch === '',
  );
  const searched = useAsync(
    () => studentsApi.search(activeSearch),
    [activeSearch],
    activeSearch !== '',
  );

  const candidates = activeSearch ? (searched.data ?? []) : (listed.data?.content ?? []);

  const studentFees = useAsync(
    () => feesApi.studentFees(student!.id),
    [student?.id],
    student !== null,
  );

  const structures = useAsync(() => feesApi.structures(), []);
  const eligibleStructures = (structures.data ?? []).filter(
    (s) => s.courseId === student?.courseId && s.semester === student?.semester,
  );

  const [assigning, setAssigning] = useState(false);
  const [structureId, setStructureId] = useState(0);
  const [payFor, setPayFor] = useState<StudentFeeResponse | null>(null);
  const [collectFor, setCollectFor] = useState<StudentFeeResponse | null>(null);
  const [historyFor, setHistoryFor] = useState<StudentFeeResponse | null>(null);

  async function assign(event: FormEvent) {
    event.preventDefault();
    if (!student || structureId === 0) return;

    setAssigning(true);
    setError('');
    try {
      await feesApi.assign(student.id, structureId);
      setNotice('Fee assigned to student.');
      setStructureId(0);
      studentFees.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAssigning(false);
    }
  }

  return (
    <>
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

      <Card className="mb-6" title="Select a student">
        <form
          className="mb-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => { e.preventDefault(); setActiveSearch(keyword.trim()); }}
        >
          <div className="w-full sm:w-72">
            <Field label="Search">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Name, enrollment number or email"
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary">Search</Button>
          {activeSearch && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setKeyword(''); setActiveSearch(''); }}
            >
              Clear
            </Button>
          )}
        </form>

        <div className="max-w-lg">
          <Field label="Student">
            <Select
              value={student?.id ?? 0}
              onChange={(e) => {
                const id = Number(e.target.value);
                setStudent(candidates.find((s) => s.id === id) ?? null);
              }}
            >
              <option value={0} disabled>Select a student</option>
              {candidates.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.enrollmentNumber} — {fullName(s.firstName, s.lastName)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {student && (
        <>
          <Card
            className="mb-6"
            title={`Assign a fee to ${fullName(student.firstName, student.lastName)}`}
          >
            <form onSubmit={assign} className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-96">
                <Field label="Fee structure">
                  <Select
                    value={structureId}
                    onChange={(e) => setStructureId(Number(e.target.value))}
                    disabled={structures.loading}
                  >
                    <option value={0} disabled>Select a structure</option>
                    {eligibleStructures.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.courseName} · Sem {s.semester} · {titleCase(s.feeType)} ·{' '}
                        {money(s.amount)} · {s.academicYear}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Button type="submit" disabled={assigning || structureId === 0}>
                {assigning ? 'Assigning…' : 'Assign fee'}
              </Button>
            </form>
            {!structures.loading && eligibleStructures.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">
                No fee structure matches this student&apos;s course and semester.
              </p>
            )}
          </Card>

          <Card title="Assigned fees">
            {studentFees.loading ? <Spinner /> : studentFees.error ? (
              <Alert>{studentFees.error}</Alert>
            ) : (studentFees.data ?? []).length === 0 ? (
              <EmptyState title="No fees assigned to this student" />
            ) : (
              <Table head={[
                'Type', 'Academic year', 'Total', 'Paid', 'Due', 'Status', 'Actions',
              ]}>
                {studentFees.data!.map((fee) => (
                  <tr key={fee.id}>
                    <Td className="font-medium text-slate-900">{titleCase(fee.feeType)}</Td>
                    <Td>{fee.academicYear}</Td>
                    <Td className="tabular-nums">{money(fee.totalAmount)}</Td>
                    <Td className="tabular-nums text-emerald-600">{money(fee.paidAmount)}</Td>
                    <Td className="tabular-nums text-rose-600">{money(fee.dueAmount)}</Td>
                    <Td>
                      <Badge tone={
                        fee.status === 'PAID' ? 'green'
                          : fee.status === 'PARTIAL' ? 'amber'
                            : fee.status === 'FAILED' ? 'rose' : 'slate'
                      }>
                        {titleCase(fee.status)}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          disabled={Number(fee.dueAmount) <= 0}
                          onClick={() => setPayFor(fee)}
                        >
                          Record payment
                        </Button>
                        <Button
                          className="px-2 py-1 text-xs"
                          disabled={Number(fee.dueAmount) <= 0}
                          onClick={() => setCollectFor(fee)}
                        >
                          Collect online
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          onClick={() => setHistoryFor(fee)}
                        >
                          History
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </>
      )}

      {payFor && <PaymentModal
        fee={payFor}
        onClose={() => setPayFor(null)}
        onSaved={() => { setNotice('Payment recorded.'); studentFees.reload(); }}
      />}

      {collectFor && <RazorpayCollectModal
        fee={collectFor}
        onClose={() => setCollectFor(null)}
        onSettled={(payment) => {
          setNotice(
            `Razorpay payment of ${money(payment.amount)} captured `
            + `(${payment.transactionId}). Outstanding is now ${money(payment.dueAmount)}.`,
          );
          studentFees.reload();
        }}
      />}

      <HistoryModal fee={historyFor} onClose={() => setHistoryFor(null)} />
    </>
  );
}

function PaymentModal({ fee, onClose, onSaved }: {
  fee: StudentFeeResponse; onClose: () => void; onSaved: () => void;
}) {
  // Mounted fresh each time the modal opens, so plain initial state is enough.
  const [amount, setAmount] = useState(String(fee.dueAmount));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await feesApi.pay(fee.id, {
        amount: Number(amount),
        paymentMethod,
        remarks: remarks || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title="Record payment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <p className="font-medium text-slate-900">
              {fee.studentName} · {fee.enrollmentNumber}
            </p>
            <p className="mt-1 text-slate-500">
              {titleCase(fee.feeType)} · {fee.academicYear} · Due {money(fee.dueAmount)}
            </p>
          </div>

          <Field label="Amount" required hint={`Maximum ${money(fee.dueAmount)}.`}>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              max={Number(fee.dueAmount)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>

          <Field label="Payment method" required>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{titleCase(method)}</option>
              ))}
            </Select>
          </Field>

          <Field label="Remarks">
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional note"
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Recording…' : 'Record payment'}
            </Button>
          </div>
        </form>
    </Modal>
  );
}

function HistoryModal({ fee, onClose }: {
  fee: StudentFeeResponse | null; onClose: () => void;
}) {
  const { data, loading, error } = useAsync(
    () => feesApi.payments(fee!.id),
    [fee?.id],
    fee !== null,
  );

  const [downloadError, setDownloadError] = useState('');

  async function receipt(paymentId: number) {
    setDownloadError('');
    try {
      await feesApi.downloadReceipt(paymentId);
    } catch (err) {
      setDownloadError(errorMessage(err));
    }
  }

  return (
    <Modal
      open={fee !== null}
      wide
      title={fee ? `Payments — ${titleCase(fee.feeType)}` : 'Payments'}
      onClose={onClose}
    >
      {fee && (
        <div className="space-y-4">
          {downloadError && (
            <Alert onDismiss={() => setDownloadError('')}>{downloadError}</Alert>
          )}
          {error && <Alert>{error}</Alert>}

          {loading ? <Spinner /> : (data ?? []).length === 0 ? (
            <EmptyState title="No payments recorded for this fee" />
          ) : (
            <Table head={['Transaction', 'Date', 'Amount', 'Method', 'Status', 'Receipt']}>
              {data!.map((payment) => (
                <tr key={payment.id}>
                  <Td className="whitespace-nowrap font-mono text-xs">
                    {payment.transactionId}
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{dateTime(payment.paymentDate)}</Td>
                  <Td className="tabular-nums font-medium">{money(payment.amount)}</Td>
                  <Td>{titleCase(payment.paymentMethod)}</Td>
                  <Td>
                    <Badge tone={
                      payment.status === 'PAID' ? 'green'
                        : payment.status === 'PARTIAL' ? 'amber'
                          : payment.status === 'FAILED' ? 'rose' : 'slate'
                    }>
                      {titleCase(payment.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => receipt(payment.id)}
                    >
                      Download PDF
                    </Button>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
    </Modal>
  );
}

// ================================================================
// Online payments (Razorpay)
// ================================================================

/**
 * Reconciliation view for the gateway: whether it is live, what it has taken,
 * and every order the office may need to chase.  Read-only — an order is
 * settled by the payer's browser or by Razorpay's webhook, never from here.
 */
function RazorpayTab() {
  const status = useAsync(() => feesApi.razorpayStatus(), []);
  const orders = useAsync(() => feesApi.razorpayOrders(), []);

  function refresh() {
    status.reload();
    orders.reload();
  }

  return (
    <>
      {status.error && <Alert>{status.error}</Alert>}

      {status.loading ? <Spinner /> : status.data && (
        <>
          {!status.data.configured && (
            <Alert tone="info">
              Razorpay is not configured. Set RAZORPAY_KEY_ID and
              RAZORPAY_KEY_SECRET on the server to accept online payments.
              Offline payments can still be recorded from the
              &ldquo;Student fees &amp; payments&rdquo; tab.
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Collected online"
              value={money(status.data.collectedAmount)}
              tone="positive"
              hint={`${status.data.completedOrders} settled order(s)`}
            />
            <StatCard
              label="Awaiting settlement"
              value={money(status.data.pendingAmount)}
              tone={status.data.pendingOrders > 0 ? 'warning' : 'default'}
              hint={`${status.data.pendingOrders} open order(s)`}
            />
            <StatCard label="Total orders" value={status.data.totalOrders} />
            <StatCard
              label="Gateway"
              value={status.data.configured ? 'Live' : 'Not configured'}
              tone={status.data.configured ? 'positive' : 'danger'}
              hint={status.data.keyIdHint
                ? `Key ${status.data.keyIdHint}`
                : 'No API key on the server'}
            />
          </div>
        </>
      )}

      <Card
        className="mt-6"
        title="Razorpay orders"
        description={orders.data ? `${orders.data.length} order(s), newest first` : undefined}
        actions={
          <Button variant="secondary" onClick={refresh} disabled={orders.loading}>
            {orders.loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      >
        {orders.loading ? <Spinner /> : orders.error ? (
          <Alert>{orders.error}</Alert>
        ) : (orders.data ?? []).length === 0 ? (
          <EmptyState
            title="No online payments yet"
            hint="An order appears here as soon as a student, or this office, opens a Razorpay checkout."
          />
        ) : (
          <Table head={['Order ID', 'Student', 'Fee', 'Amount', 'Status', 'Opened']}>
            {orders.data!.map((order) => (
              <tr key={order.id}>
                <Td className="whitespace-nowrap font-mono text-xs">
                  {order.razorpayOrderId}
                </Td>
                <Td>
                  <span className="font-medium text-slate-900">{order.studentName}</span>
                  <span className="block text-xs text-slate-400">
                    {order.enrollmentNumber}
                  </span>
                </Td>
                <Td className="whitespace-nowrap text-xs">
                  {titleCase(order.feeType)} · {order.academicYear}
                </Td>
                <Td className="tabular-nums font-medium">{money(order.amount)}</Td>
                <Td>
                  <Badge tone={order.completed ? 'green' : 'amber'}>
                    {order.completed ? 'Settled' : 'Pending'}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-xs">{dateTime(order.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

/**
 * Opens a Razorpay checkout at the counter, for a student paying by card or UPI
 * in person.  The fee is credited only once the server has verified the
 * signature, so a dismissed or failed checkout leaves the record untouched.
 */
function RazorpayCollectModal({ fee, onClose, onSettled }: {
  fee: StudentFeeResponse;
  onClose: () => void;
  onSettled: (payment: FeePaymentResponse) => void;
}) {
  const due = Number(fee.dueAmount);
  // Mounted fresh each time the modal opens, so plain initial state is enough.
  const [amount, setAmount] = useState(String(due));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function collect(event: FormEvent) {
    event.preventDefault();

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (value > due) {
      setError(`The amount cannot be more than the outstanding ${money(due)}.`);
      return;
    }

    setBusy(true);
    setError('');
    try {
      const order = await feesApi.createOrder({ studentFeeId: fee.id, amount: value });

      const result = await openCheckout({
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Student ERP',
        description: `${titleCase(fee.feeType)} fee · ${fee.academicYear}`,
        prefill: { name: fee.studentName },
        theme: { color: '#4f46e5' },
      });

      // Closed without paying: the order stays open and nothing is credited.
      if (!result) {
        setBusy(false);
        return;
      }

      const payment = await feesApi.verifyPayment({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
        paymentMethod,
        remarks: remarks || undefined,
      });

      onSettled(payment);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title="Collect through Razorpay" onClose={onClose}>
      <form onSubmit={collect} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-900">
            {fee.studentName} · {fee.enrollmentNumber}
          </p>
          <p className="mt-1 text-slate-500">
            {titleCase(fee.feeType)} · {fee.academicYear} · Due {money(due)}
          </p>
        </div>

        <Field label="Amount" required hint={`Maximum ${money(due)}.`}>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            max={due}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>

        <Field label="Record as" required hint="How the payer settled it at the gateway.">
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            {ONLINE_METHODS.map((method) => (
              <option key={method} value={method}>{titleCase(method)}</option>
            ))}
          </Select>
        </Field>

        <Field label="Remarks">
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional note"
          />
        </Field>

        <p className="text-xs text-slate-500">
          The Razorpay checkout opens in this window. The fee is credited only
          after the server verifies the payment signature.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Opening checkout…' : 'Open checkout'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
