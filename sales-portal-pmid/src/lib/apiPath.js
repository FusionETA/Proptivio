export function apiPath(path) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${base}${path}`;
}
