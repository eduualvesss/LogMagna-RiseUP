export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001/api`
    : 'http://127.0.0.1:3001/api');
