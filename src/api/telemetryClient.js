export async function fetchAgentSummary(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/telemetry/summary/agents?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load agent summary');
  }
  const data = await response.json();
  return data.agents || [];
}

export async function fetchIncidents(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/telemetry/incidents?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load incidents');
  }
  const data = await response.json();
  return data.incidents || [];
}

export async function fetchMessageEvents(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/telemetry/message-events?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load message events');
  }
  const data = await response.json();
  return data.events || [];
}
