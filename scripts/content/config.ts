import { validateBeholdFeedUrl } from "./providers/behold.js";
import { validateApifyTaskId, validateApifyToken } from "./providers/tiktok.js";

export interface SyncConfiguration {
  apifyTaskId: string;
  apifyToken: string;
  beholdFeedUrl: string;
}

export function getSyncConfiguration(
  environment: NodeJS.ProcessEnv,
): SyncConfiguration {
  return {
    beholdFeedUrl: validateBeholdFeedUrl(environment.BEHOLD_FEED_URL),
    apifyToken: validateApifyToken(environment.APIFY_TOKEN),
    apifyTaskId: validateApifyTaskId(environment.APIFY_TASK_ID),
  };
}
