import { useState } from 'react';
import { studentPortal } from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Spinner, StatCard, Table, Td,
} from '../../components/ui';
import { dateTime, money, titleCase } from '../../lib/format';
import { openCheckout } from '../../lib/razorpay';
import type {
  FeePaymentResponse, StudentFeeDashboardResponse, StudentFeeResponse,
} from '../../api/types';

export default function StudentFees() {
  const { data, loading, error, reload } = useAsync(() => studentPortal.feeDashboard(), []);
  const [paying, setPaying] = useState<StudentFeeResponse | null>(null);
  const [receiptsFor, setReceiptsFor] = useState<StudentFeeResponse | null>(null);
  const [settled, setSettled] = useState<FeePaymentResponse | null>(null);
  const [downloadError, setDownloadError] = useState('');

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Fees"
        subtitle={data ? `${data.studentName} · ${data.enrollmentNumber}` : undefined}
      />

      {error && <Alert>{error}</Alert>}
      {downloadError && (
        <Alert onDismiss={() => setDownloadError('')}>{downloadError}</Alert>
      )}

      {settled && (
        <Alert tone="success" onDismiss={() => setSettled(null)}>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span>
              Paid {money(settled.amount)} · transaction {settled.transactionId}.
              Outstanding on this item is now {money(settled.dueAmount)}.
            </span>
            <ReceiptButton
              paymentId={settled.id}
              onError={setDownloadError}
              variant="secondary"
            />
          </span>
        </Alert>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total fee" value={money(data.totalFee)} />
            <StatCard label="Paid" value={money(data.paidAmount)} tone="positive" />
            <StatCard
              label="Outstanding"
              value={money(data.dueAmount)}
              tone={Number(data.dueAmount) > 0 ? 'danger' : 'positive'}
            />
            <StatCard
              label="Fee items"
              value={data.fees.length}
              hint={`${data.paidFeeCount} paid · ${data.partialFeeCount} partial · ${data.pendingFeeCount} pending`}
            />
          </div>

          <Card className="mt-6" title="Fee items">
            {data.fees.length === 0 ? (
              <EmptyState
                title="No fees assigned"
                hint="Fee structures are assigned by the administration office."
              />
            ) : (
              <Table head={['Type', 'Academic year', 'Total', 'Paid', 'Due', 'Status', '']}>
                {data.fees.map((fee) => (
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
                    <Td className="text-right">
                      <span className="flex justify-end gap-2">
                        {Number(fee.paidAmount) > 0 && (
                          <Button variant="secondary" onClick={() => setReceiptsFor(fee)}>
                            Receipts
                          </Button>
                        )}
                        {Number(fee.dueAmount) > 0 && (
                          <Button onClick={() => { setSettled(null); setPaying(fee); }}>
                            Pay now
                          </Button>
                        )}
                      </span>
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <PayModal
            fee={paying}
            student={data}
            onClose={() => setPaying(null)}
            onPaid={(payment) => { setPaying(null); setSettled(payment); reload(); }}
          />

          <ReceiptsModal fee={receiptsFor} onClose={() => setReceiptsFor(null)} />
        </>
      )}
    </>
  );
}

/** Pulls the receipt PDF through the API client so the auth header is sent. */
function ReceiptButton({ paymentId, onError, variant = 'secondary' }: {
  paymentId: number;
  onError: (message: string) => void;
  variant?: 'primary' | 'secondary';
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    onError('');
    try {
      await studentPortal.downloadFeeReceipt(paymentId);
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant={variant} onClick={download} disabled={busy}>
      {busy ? 'Preparing…' : 'Receipt'}
    </Button>
  );
}

function ReceiptsModal({ fee, onClose }: {
  fee: StudentFeeResponse | null; onClose: () => void;
}) {
  const { data, loading, error } = useAsync(
    () => studentPortal.feePayments(fee!.id),
    [fee?.id],
    fee !== null,
  );
  const [downloadError, setDownloadError] = useState('');

  if (!fee) return null;

  return (
    <Modal open title={`${titleCase(fee.feeType)} receipts`} onClose={onClose} wide>
      {error && <Alert>{error}</Alert>}
      {downloadError && (
        <Alert onDismiss={() => setDownloadError('')}>{downloadError}</Alert>
      )}

      {loading ? <Spinner /> : !data || data.length === 0 ? (
        <EmptyState
          title="No payments yet"
          hint="A receipt appears here as soon as a payment goes through."
        />
      ) : (
        <Table head={['Paid on', 'Amount', 'Method', 'Transaction', '']}>
          {data.map((payment) => (
            <tr key={payment.id}>
              <Td>{dateTime(payment.paymentDate)}</Td>
              <Td className="tabular-nums font-medium text-slate-900">
                {money(payment.amount)}
              </Td>
              <Td>{titleCase(payment.paymentMethod)}</Td>
              <Td className="font-mono text-xs">{payment.transactionId}</Td>
              <Td className="text-right">
                <ReceiptButton paymentId={payment.id} onError={setDownloadError} />
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Modal>
  );
}

function PayModal({ fee, student, onClose, onPaid }: {
  fee: StudentFeeResponse | null;
  student: StudentFeeDashboardResponse;
  onClose: () => void;
  onPaid: (payment: FeePaymentResponse) => void;
}) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!fee) return null;

  const due = Number(fee.dueAmount);
  // Blank means "the whole outstanding amount", so the common case needs no typing.
  const value = amount === '' ? due : Number(amount);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    if (!fee) return;

    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (value > due) {
      setError(`You cannot pay more than the outstanding ${money(due)}.`);
      return;
    }

    setBusy(true);
    setError('');
    try {
      const order = await studentPortal.createFeeOrder({
        studentFeeId: fee.id,
        amount: value,
      });

      const result = await openCheckout({
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Student ERP',
        description: `${titleCase(fee.feeType)} fee · ${fee.academicYear}`,
        prefill: { name: student.studentName },
        theme: { color: '#4f46e5' },
      });

      // The student closed the checkout without paying: leave the order unused.
      if (!result) {
        setBusy(false);
        return;
      }

      const payment = await studentPortal.verifyFeePayment({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });

      setAmount('');
      onPaid(payment);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title={`Pay ${titleCase(fee.feeType)} fee`} onClose={onClose}>
      <form onSubmit={pay} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

        <dl className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between py-1">
            <dt className="text-slate-500">Academic year</dt>
            <dd className="font-medium text-slate-900">{fee.academicYear}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-slate-500">Total</dt>
            <dd className="tabular-nums text-slate-900">{money(fee.totalAmount)}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-slate-500">Outstanding</dt>
            <dd className="tabular-nums font-semibold text-rose-600">{money(due)}</dd>
          </div>
        </dl>

        <Field label="Amount to pay" hint={`Leave blank to pay the full ${money(due)}.`}>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={due}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(due)}
          />
        </Field>

        <p className="text-xs text-slate-500">
          You will be redirected to Razorpay to complete the payment. Your fee
          record updates, and your receipt becomes available, only after Razorpay
          confirms it.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Opening checkout…' : `Pay ${money(value || due)}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
