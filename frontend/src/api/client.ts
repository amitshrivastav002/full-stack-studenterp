const TOKEN_KEY = 'erp.token';

export class ApiError extends Error {
  status: number;
  /** Field-level messages from GlobalExceptionHandler on a 400. */
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function getToken(): string | null {
  // sessionStorage first: it only holds a token when "remember me" was off.
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
}

/**
 * `persist: false` keeps the token in this tab only, so closing the browser
 * signs the user out. Both stores are cleared first so the two can never
 * disagree about which token is current.
 */
export function setToken(token: string | null, persist = true) {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (token) (persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

/** Broadcast so the auth context can drop the session on a 401. */
function signalUnauthorized() {
  window.dispatchEvent(new CustomEvent('erp:unauthorized'));
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  let fieldErrors: Record<string, string> = {};

  const body = await res.text();
  if (body) {
    try {
      // GlobalExceptionHandler answers with
      // {timestamp, status, error, message, path, fieldErrors?}.
      const parsed = JSON.parse(body) as {
        message?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (parsed.fieldErrors) fieldErrors = parsed.fieldErrors;

      // Prefer the field-level text: it names what the user has to fix.
      const firstFieldError = Object.values(fieldErrors)[0];
      message = firstFieldError ?? parsed.message ?? parsed.error ?? message;
    } catch {
      message = body;
    }
  } else if (res.status === 403) {
    message = 'You do not have permission to perform this action.';
  } else if (res.status === 401) {
    message = 'Your session has expired. Please sign in again.';
  }

  return new ApiError(res.status, message, fieldErrors);
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) signalUnauthorized();
    throw await toApiError(res);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  // Several endpoints return a bare string ("Student deleted successfully").
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export const api = {
  get<T>(path: string, query?: Query): Promise<T> {
    return fetch(withQuery(path, query), { headers: authHeaders() }).then(handle<T>);
  },

  post<T>(path: string, body?: unknown, query?: Query): Promise<T> {
    return fetch(withQuery(path, query), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(handle<T>);
  },

  put<T>(path: string, body?: unknown, query?: Query): Promise<T> {
    return fetch(withQuery(path, query), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(handle<T>);
  },

  delete<T>(path: string, query?: Query): Promise<T> {
    return fetch(withQuery(path, query), {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handle<T>);
  },

  upload<T>(path: string, form: FormData, query?: Query): Promise<T> {
    // No Content-Type: the browser sets the multipart boundary itself.
    return fetch(withQuery(path, query), {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    }).then(handle<T>);
  },

  /**
   * Fetches an authenticated image and returns a blob URL an <img> can use,
   * since an <img src> cannot carry the bearer token itself. Returns null when
   * nothing has been uploaded, which is a 404 rather than a failure.
   * The caller owns the URL and must revoke it.
   */
  async objectUrl(path: string): Promise<string | null> {
    const res = await fetch(path, { headers: authHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) {
      if (res.status === 401) signalUnauthorized();
      throw await toApiError(res);
    }
    return URL.createObjectURL(await res.blob());
  },

  /** Fetches a binary response and hands it to the browser as a download. */
  async download(path: string, fallbackName: string): Promise<void> {
    const res = await fetch(path, { headers: authHeaders() });
    if (!res.ok) {
      if (res.status === 401) signalUnauthorized();
      throw await toApiError(res);
    }

    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const name = match ? match[1] : fallbackName;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
