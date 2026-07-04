/**
 * api.js — Centralised HTTP client for QuizCraft AI.
 *
 * WHY this exists:
 *   Keeping all fetch() calls in one module means:
 *   - The base URL is configured in exactly one place.
 *   - Error classification (network vs HTTP vs JSON-parse) is done once.
 *   - QuizContext stays free of raw fetch/Headers boilerplate.
 *   - Swapping the transport layer (e.g. to axios) only changes this file.
 *
 * All API calls use relative paths (/api/…) so the Vite dev-server proxy
 * forwards them to Flask on port 5000 without CORS issues.
 */

const BASE = ''; // relative → goes through Vite proxy in dev, same origin in prod

/**
 * Classify a caught error into a user-friendly message.
 * Covers:
 *   Chrome  — "Failed to fetch"
 *   Firefox — "NetworkError when attempting to fetch resource"
 *   Safari  — "Load failed"
 *   Edge    — various; also catches TypeError (fetch throws this on net failure)
 */
function friendlyError(err) {
  const msg = (err?.message ?? '').toLowerCase();
  const isNetworkError =
    err?.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed') ||
    msg.includes('err_connection_refused');

  if (isNetworkError) {
    return (
      'Cannot connect to the backend. ' +
      'Make sure the Flask server is running on port 5000 ' +
      '(run: python app.py inside the backend folder).'
    );
  }
  return err?.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Parse the response body as JSON.
 * Throws a descriptive error when the server returns HTML (e.g. a 404 page
 * instead of the Flask API), which prevents a confusing "Unexpected token"
 * message from bubbling up to the UI.
 */
async function parseJSON(res) {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const preview = (await res.text()).slice(0, 150);
    throw new Error(
      `Server returned a non-JSON response (${res.status}). ` +
        `Flask may not be running. Preview: ${preview}`
    );
  }
  return res.json();
}

/**
 * Internal wrapper: fetch → parse JSON → throw on HTTP error.
 */
async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, options);
    const data = await parseJSON(res);
    if (!res.ok) {
      throw new Error(data.error || `Request failed (HTTP ${res.status})`);
    }
    return data;
  } catch (err) {
    // Re-throw with a user-friendly message; preserve the class so callers
    // can still catch Error instances.
    throw new Error(friendlyError(err));
  }
}

// ---------------------------------------------------------------------------
// Public API surface
// ---------------------------------------------------------------------------

/**
 * Upload a PPT/PPTX file.
 * @param {File} file
 * @returns {Promise<{session_id, filename, slide_count, total_words, slides[]}>}
 */
export async function uploadFile(file) {
  const body = new FormData();
  body.append('file', file);
  // Do NOT set Content-Type manually — the browser sets multipart/form-data
  // with the correct boundary automatically when the body is FormData.
  return request('/api/upload', { method: 'POST', body });
}

/**
 * Generate quiz questions for an existing session.
 * @param {string} sessionId
 * @param {number} questionCount
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {Promise<{session_id, questions[], total_questions, difficulty}>}
 */
export async function generateQuiz(sessionId, questionCount, difficulty) {
  return request('/api/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question_count: questionCount,
      difficulty,
    }),
  });
}

/**
 * Submit answers and retrieve scored results.
 * @param {string} sessionId
 * @param {Object.<string, number>} answers  — { "0": 2, "1": 0, … }
 * @returns {Promise<{score, total_questions, percentage, passed, results[]}>}
 */
export async function submitQuiz(sessionId, answers) {
  return request('/api/submit-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, answers }),
  });
}

/**
 * Fetch quiz history.
 * @returns {Promise<{history[]}>}
 */
export async function fetchHistory() {
  return request('/api/history');
}

/**
 * Health-check — useful during development to confirm the backend is reachable.
 * @returns {Promise<{status, message, timestamp, api_key_configured}>}
 */
export async function healthCheck() {
  return request('/api/health');
}
