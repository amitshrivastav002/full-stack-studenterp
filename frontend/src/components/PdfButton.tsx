import { useState } from 'react';
import { Button } from './ui';
import { errorMessage } from '../lib/useAsync';
import { downloadTablePdf } from '../lib/pdf';
import type { TablePdfOptions } from '../lib/pdf';

/**
 * Exports a table to PDF in the browser.  The options are built lazily, on the
 * click, so the button does not rebuild the document on every render of the
 * page it sits on.
 */
export function PdfButton({ options, onError, disabled, label = 'Download PDF' }: {
  options: () => TablePdfOptions;
  onError: (message: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    onError('');
    try {
      await downloadTablePdf(options());
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={run}
      disabled={disabled || busy}
    >
      {busy ? 'Preparing…' : label}
    </Button>
  );
}
