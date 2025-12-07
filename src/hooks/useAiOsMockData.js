import { aiOsMockData } from '../mock/aiOsMockData';

/**
 * Temporary helper that exposes the mocked AI OS data in a stable shape.
 * TODO: replace this hook with real API data once backend endpoints exist.
 */
export function useAiOsMockData() {
  return {
    overview: aiOsMockData.status,
    usage: aiOsMockData.usage,
    plan: aiOsMockData.plan,
    agents: aiOsMockData.agents,
    modes: aiOsMockData.modes,
    pipeline: aiOsMockData.pipeline,
    costs: aiOsMockData.costs,
    missions: aiOsMockData.missions,
    security: aiOsMockData.security,
    settings: aiOsMockData.settings,
    api: aiOsMockData.api,
  };
}
