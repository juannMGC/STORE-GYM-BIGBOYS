import { createHash } from 'crypto';

type WompiEventBody = {
  event?: string;
  data?: Record<string, unknown>;
  timestamp?: number;
  signature?: {
    properties?: string[];
    checksum?: string;
  };
};

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function verifyWompiEventChecksum(
  body: WompiEventBody,
  eventsSecret: string,
): boolean {
  const props = body.signature?.properties;
  const expected = body.signature?.checksum?.trim().toUpperCase();
  const ts = body.timestamp;
  const data = body.data;
  if (!props?.length || !expected || ts === undefined || !data || typeof data !== 'object') {
    return false;
  }
  let concat = '';
  for (const path of props) {
    const v = getByPath(data as Record<string, unknown>, path);
    concat += v === undefined || v === null ? '' : String(v);
  }
  concat += String(ts);
  concat += eventsSecret;
  const hash = createHash('sha256').update(concat, 'utf8').digest('hex').toUpperCase();
  return hash === expected;
}
