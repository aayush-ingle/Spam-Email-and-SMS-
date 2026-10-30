const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Cannot reach the model API. Check that the FastAPI server is running.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof payload.detail === 'string' ? payload.detail : 'The request could not be completed.'
    throw new Error(message)
  }
  return payload
}

export function getHealth() {
  return request('/health')
}

export function analyzeMessage(message, messageType) {
  return request('/predict', {
    method: 'POST',
    body: JSON.stringify({ message, message_type: messageType }),
  })
}

export function getMetrics() {
  return request('/metrics')
}

export const apiBaseUrl = API_BASE
export const apiDocsUrl = `${API_BASE.replace(/\/api$/, '')}/docs`