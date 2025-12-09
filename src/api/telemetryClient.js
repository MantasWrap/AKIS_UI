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

export async function fetchReliabilityScores(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/telemetry/reliability/agents?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load reliability scores');
  }
  const data = await response.json();
  return data.agents || [];
}

export async function fetchIncidentSpikes(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/telemetry/incidents/spikes?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load incident spikes');
  }
  const data = await response.json();
  return data.spikes || [];
}

export async function fetchTelemetryOverview(params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/telemetry/analytics/overview?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load telemetry overview');
  }
  return response.json();
}
