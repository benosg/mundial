import { fetchFifaGroupStageResults, type FifaSyncSummary } from "./fifa-results";
import { clearRankingCache } from "./ranking";
import { createServerClient } from "./supabase";

const DEFAULT_SYNC_INTERVAL_MS = 60_000;

type SyncSource = "fifa" | "cache";

export type ResultsSyncResponse = {
  ok: true;
  imported: number;
  updated: number;
  suspiciousGroups: string[];
  throttled: boolean;
  source: SyncSource;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
};

type SyncState = {
  lastErrorMessage: string | null;
  lastAttemptAt: number;
  lastSummary: ResultsSyncResponse | null;
  inFlight: Promise<ResultsSyncResponse> | null;
};

const syncState: SyncState = {
  lastErrorMessage: null,
  lastAttemptAt: 0,
  lastSummary: null,
  inFlight: null,
};

function toIso(timestamp: number | null) {
  return timestamp ? new Date(timestamp).toISOString() : null;
}

async function applyFifaUpdates(request: Request | undefined, syncSummary: FifaSyncSummary) {
  if (syncSummary.candidates.length === 0) {
    return 0;
  }

  const supabase = createServerClient(request, new Headers());
  const candidateIds = syncSummary.candidates.map((candidate) => candidate.id);

  const { data: existingMatches, error: existingError } = await supabase
    .from("matches")
    .select("id, home_result, away_result")
    .in("id", candidateIds);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingById = new Map((existingMatches ?? []).map((match) => [match.id, match]));
  const updates = syncSummary.candidates.filter((candidate) => {
    const existing = existingById.get(candidate.id);
    return existing?.home_result !== candidate.home_result || existing?.away_result !== candidate.away_result;
  });

  let updated = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from("matches")
      .update({
        home_result: update.home_result,
        away_result: update.away_result,
      })
      .eq("id", update.id);

    if (error) {
      throw new Error(`No se pudo actualizar ${update.id}: ${error.message}`);
    }

    updated += 1;
  }

  return updated;
}

async function runSync(request: Request | undefined, minIntervalMs: number): Promise<ResultsSyncResponse> {
  const syncSummary = await fetchFifaGroupStageResults();
  const updated = await applyFifaUpdates(request, syncSummary);
  if (updated > 0) {
    clearRankingCache();
  }
  const completedAt = Date.now();

  return {
    ok: true,
    imported: syncSummary.imported,
    updated,
    suspiciousGroups: syncSummary.suspiciousGroups,
    throttled: false,
    source: "fifa",
    lastSyncAt: toIso(completedAt),
    nextSyncAt: toIso(completedAt + minIntervalMs),
  };
}

export async function syncFifaResults(options?: {
  request?: Request;
  force?: boolean;
  minIntervalMs?: number;
}): Promise<ResultsSyncResponse> {
  const request = options?.request;
  const force = options?.force ?? false;
  const minIntervalMs = options?.minIntervalMs ?? DEFAULT_SYNC_INTERVAL_MS;
  const now = Date.now();

  if (syncState.inFlight) {
    return syncState.inFlight;
  }

  if (!force && now - syncState.lastAttemptAt < minIntervalMs) {
    if (syncState.lastSummary) {
      return {
        ...syncState.lastSummary,
        throttled: true,
        source: "cache",
        nextSyncAt: toIso(syncState.lastAttemptAt + minIntervalMs),
      };
    }

    if (syncState.lastErrorMessage) {
      throw new Error(syncState.lastErrorMessage);
    }
  }

  syncState.lastAttemptAt = now;
  syncState.inFlight = runSync(request, minIntervalMs)
    .then((summary) => {
      syncState.lastErrorMessage = null;
      syncState.lastSummary = summary;
      return summary;
    })
    .catch((error) => {
      syncState.lastErrorMessage = error instanceof Error ? error.message : "No se pudo sincronizar con FIFA";
      throw error;
    })
    .finally(() => {
      syncState.inFlight = null;
    });

  return syncState.inFlight;
}

export function getResultsSyncIntervalMs() {
  return DEFAULT_SYNC_INTERVAL_MS;
}
