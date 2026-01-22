type RequestOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;

let authToken: string | undefined;

export const setAuthToken = (token?: string) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = undefined;
};

export const getApiBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) throw new Error('EXPO_PUBLIC_API_URL is not set.');
  return baseUrl;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES, ...rest } = options;
  const url = `${getApiBaseUrl()}${path}`;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...rest,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(rest.headers || {}),
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        const message = contentType.includes('application/json')
          ? ((await res.json()) as { message?: string }).message
          : await res.text();

        if (res.status >= 500 && attempt < retries) {
          await sleep(300 * (attempt + 1));
          continue;
        }

        throw new Error(message || `API error ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      const isNetwork = error instanceof TypeError || isAbort;
      if (isNetwork && attempt < retries) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      if (isAbort) throw new Error('Request timed out. Please try again.');
      throw error instanceof Error ? error : new Error('Network error.');
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('Network error.');
};
