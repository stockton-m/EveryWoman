# Content archive pipeline

How [`src/data/content-archive.json`](../src/data/content-archive.json) is built, and how that build reaches the Netlify site.

Behold refreshes an Instagram feed of the **latest 6 posts once per day**. The Apify actor task scrapes TikTok **once every 2 days**. Those schedules live in Behold and Apify. This repo only reads their latest results. Substack posts come from Substack's [RSS feed](https://everywomanhealth.substack.com/feed) and don't have a separate service to collate content updates. The synchronizer is [`scripts/content/`](../scripts/content/).

## Pipeline

```mermaid
flowchart TD
  igAccount["Instagram everywoman.io"] --> beholdFeed["Behold feed URL, refreshed once per day, latest 6 posts"]
  ttAccount["TikTok @everywomanhealth"] --> apifyTask["Apify actor task everywoman~everywoman-tiktok, scrape every 2 days, latest 50 posts"]
  substackFeed["Substack RSS everywomanhealth.substack.com/feed"]

  cron["GitHub Actions cron 11:23 UTC daily, or workflow_dispatch"] --> checkout["Checkout the default branch"]
  checkout --> syncCmd["pnpm content:sync with BEHOLD_FEED_URL, APIFY_TOKEN, APIFY_TASK_ID"]

  syncCmd --> validateEnv["Validate the three secrets before any request"]
  validateEnv --> readArchive["Read src/data/content-archive.json"]
  readArchive --> fetchParallel["Fetch Behold, the Apify dataset, and Substack in parallel"]

  beholdFeed --> fetchParallel
  substackFeed --> fetchParallel

  apifyTask --> lastRun["GET the latest SUCCEEDED run, then that run dataset"]
  lastRun --> datasetAge{"Dataset available, and how old?"}
  datasetAge -->|"3 days old or newer"| fetchParallel
  datasetAge -->|"older than 3 days, up to 7 days"| warnStale["Log a warning that a scheduled scrape may have been missed"]
  datasetAge -->|"missing, failed, empty, or older than 7 days"| failTikTok["Fail the TikTok fetch"]
  warnStale --> fetchParallel
  failTikTok --> abortSync["Stop before reconcile or write. Nothing is committed."]

  fetchParallel --> anyFailed{"Did any provider fail?"}
  anyFailed -->|yes| abortSync
  anyFailed -->|no| reconcile["Reconcile in memory. See the merge diagram below."]

  reconcile --> dryRun{"Dry run?"}
  dryRun -->|yes| dryReport["Print added, updated, and missing-thumbnail counts. Skip writes and downloads."]
  dryRun -->|no| writeIfChanged{"Did the serialized archive change?"}
  writeIfChanged -->|yes| atomicWrite["Atomically write src/data/content-archive.json"]
  writeIfChanged -->|no| thumbCheck{"Any TikTok post missing metadata.thumbnailPath?"}
  atomicWrite --> thumbCheck

  thumbCheck -->|yes| oembed["GET www.tiktok.com/oembed, then download thumbnail_url"]
  thumbCheck -->|no| noThumbWork["Leave saved thumbnails in place, including when TikTok rotates the signed URL"]

  oembed -->|"JPEG, PNG, or WebP, at most 8 MB"| saveThumb["Save public/tiktok/sourceId.ext, set thumbnailPath, and rewrite the archive"]
  oembed -->|"request, type, or size failure"| thumbFail["Warn, leave that post without thumbnailPath, and continue"]

  saveThumb --> stageFiles["Stage src/data/content-archive.json and public/tiktok"]
  noThumbWork --> stageFiles
  thumbFail --> stageFiles
  thumbFail --> logoFallback["getPostThumbnail serves src/imports/logo-full.png until a later sync saves a file"]

  stageFiles --> hasDiff{"Staged diff empty?"}
  hasDiff -->|yes| noCommit["No commit and no push. Netlify stays on the current deploy."]
  hasDiff -->|no| commitPush["Commit chore(content): sync external posts and push the default branch"]

  commitPush --> netlify["Netlify production build, started by the push to the default branch"]
  netlify --> viteBuild["pnpm build imports the archive. public/tiktok is copied into dist."]
```

The GitHub Action is [`.github/workflows/sync-content.yml`](../.github/workflows/sync-content.yml). It commits with `github-actions[bot]` only when the archive JSON or `public/tiktok/` changed. The workflow has no Netlify deploy hook. A push to the default branch, including this bot commit or a manual one, is what starts the production build. A sync that exits early, a dry run, or a run with an empty diff leaves the live site as it is.

## Merge into the archive

Reconciliation in [`scripts/content/reconcile.ts`](../scripts/content/reconcile.ts) matches on `id`, which is `source:sourceId`. The archive is append-only: posts that fall out of a feed stay until someone deletes them by hand.

```mermaid
flowchart TD
  incoming["Incoming post"] --> duplicate{"Already seen this id in this fetch?"}
  duplicate -->|"identical duplicate"| ignoreDup["Ignore it and count a duplicate"]
  duplicate -->|"conflicting duplicate"| conflict["Fail the sync before writing"]
  duplicate -->|first time| exists{"Archive already has this id?"}

  exists -->|no| sourceKind{"Which source?"}
  sourceKind -->|substack| slugFree{"Is the slug already used by another post?"}
  slugFree -->|yes| suffix["Insert with a hash suffix on the slug"]
  slugFree -->|no| insertSubstack["Insert the post and claim the slug"]
  sourceKind -->|"instagram or tiktok"| insertOther["Insert the post"]

  exists -->|yes| mergeFields["Copy defined incoming fields onto the archived post. Keep the archived value when incoming is missing or null. Substack keeps its archived slug."]
  mergeFields --> compare{"Merged post equals the archived post?"}
  compare -->|yes| unchanged["Leave it and count unchanged"]
  compare -->|no| updated["Replace it and count updated"]

  dropped["Post absent from this fetch"] --> kept["Stays in content-archive.json. Deletion is manual."]
```

After reconcile, posts are sorted by `publishedAt` descending, then by `id`. The archive file is rewritten only when that serialized JSON differs from the file on disk.
