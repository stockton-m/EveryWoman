import { validateBeholdFeedUrl } from "./providers/behold.js";

export interface SyncConfiguration {
  beholdFeedUrl: string;
}

export function getSyncConfiguration(
  environment: NodeJS.ProcessEnv,
): SyncConfiguration {
  return {
    beholdFeedUrl: validateBeholdFeedUrl(environment.BEHOLD_FEED_URL),
  };
}
