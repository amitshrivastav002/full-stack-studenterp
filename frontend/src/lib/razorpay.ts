/**
 * Thin wrapper around Razorpay's hosted checkout.  The script is not bundled:
 * Razorpay requires it to be served from their domain, so it is injected on
 * first use and reused afterwards.
 */

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export interface CheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (result: CheckoutResult) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (payload: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => RazorpayInstance;
  }
}

let loader: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  // Cached so two quick clicks do not inject the tag twice.
  if (!loader) {
    loader = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loader = null;
        reject(new Error('Could not reach Razorpay. Check your internet connection.'));
      };
      document.body.appendChild(script);
    });
  }
  return loader;
}

/**
 * Opens the checkout and settles once the user finishes or closes it.
 * Resolves with the signed result, or `null` when the user dismissed it.
 */
export async function openCheckout(
  options: Omit<CheckoutOptions, 'handler' | 'modal'>,
): Promise<CheckoutResult | null> {
  await loadScript();
  if (!window.Razorpay) throw new Error('Razorpay checkout is unavailable.');

  return new Promise<CheckoutResult | null>((resolve, reject) => {
    const checkout = new window.Razorpay!({
      ...options,
      handler: (result) => resolve(result),
      modal: { ondismiss: () => resolve(null) },
    });

    checkout.on('payment.failed', (payload) => {
      reject(new Error(payload.error?.description ?? 'The payment failed.'));
    });

    checkout.open();
  });
}
