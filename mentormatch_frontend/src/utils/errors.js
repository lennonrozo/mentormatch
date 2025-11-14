export function formatApiError(error) {
  try {
    if (error?.response) {
      const { status, statusText, data } = error.response;
      if (typeof data === 'string') return data;
      if (Array.isArray(data)) return data.join('\n');
      if (data && typeof data === 'object') {
        const lines = [];
        for (const [key, val] of Object.entries(data)) {
          if (val == null) continue;
          if (Array.isArray(val)) {
            lines.push(`${key}: ${val.join(', ')}`);
          } else if (typeof val === 'object') {
            lines.push(`${key}: ${JSON.stringify(val)}`);
          } else {
            lines.push(`${key}: ${String(val)}`);
          }
        }
        if (lines.length) return lines.join('\n');
      }
      return `${status} ${statusText || ''}`.trim();
    }
    if (error?.request) {
      return 'No response from server. Check your network or server status.';
    }
    return error?.message || 'Unknown error';
  } catch (e) {
    return 'Unexpected error formatting failure';
  }
}

export function logApiError(context, error) {
  const msg = formatApiError(error);
  console.error(`${context}:`, msg, error);
  return msg;
}

export function extractFieldErrors(error) {
  const out = {};
  const data = error?.response?.data;
  if (!data) {
    if (error?.message) out.non_field_errors = [error.message];
    return out;
  }
  if (typeof data === 'string') {
    out.non_field_errors = [data];
    return out;
  }
  if (Array.isArray(data)) {
    out.non_field_errors = data;
    return out;
  }
  if (typeof data === 'object') {
    for (const [k, v] of Object.entries(data)) {
      if (v == null) continue;
      if (Array.isArray(v)) out[k] = v.map(String);
      else if (typeof v === 'object') out[k] = [JSON.stringify(v)];
      else out[k] = [String(v)];
    }
    
    if (data.detail && !out.non_field_errors) out.non_field_errors = [String(data.detail)];
    return out;
  }
  return out;
}
