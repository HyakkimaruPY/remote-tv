# remote-tv

Remote application/runtime layer for the modified Philco TV firmware.

The firmware keeps a small local bootstrap plus the last known-good Player 1. Every time the player opens, the bootstrap uses the existing local Go bridge (`127.0.0.1:8765/fetch`) to check `manifest.json` on this repository.

## Cache-safe startup

Bootstrap v3 uses three persistent slots in the TV WebKit storage: `remote-tv.active.v2`, `remote-tv.previous.v2` and `remote-tv.staging.v2`.

1. A verified active release starts immediately from local storage.
2. GitHub is checked on every Player launch.
3. If the manifest release is unchanged, the Player keeps using the local copy and does not redownload the modules.
4. If a newer release exists, every required module is downloaded and SHA-256 verified.
5. The complete bundle is written to staging and read back/verified before the active copy is replaced.
6. The former active release is retained as `previous` for rollback.
7. After a successful promotion the Player reloads once and starts from the new local copy.

Release 0.41 keeps optional code out of that critical path: the obsolete `rawm3u.remote5.js` implementation is covered directly by tests but is no longer booted before the active Xtream UI, and YouTube 3 is integrity-checked and injected only after its menu button is selected. The active M3U catalog requests one `category_id` at a time and normalizes only the visible page.

Release 0.42 preserves the M3U channel-list container while changing pages, keeps an in-flight logo request alive during navigation and retains a bounded set of 128 completed logo URLs for immediate redraw. VOD seek is transactional for movies and episodes: arrows and transport keys update only the pending target, OK commits, and Up/Back cancels without moving the main player.

If GitHub or the network is unavailable, the verified active cache remains usable. If the active copy is invalid, the bootstrap tries the previous verified release; if neither cache is valid, it falls back to the Player embedded in the firmware. This keeps an interrupted download or a power loss from replacing the known-good active release with a partial update.

## Layout

- `manifest.json` — current release number, minimum bootstrap, module order and SHA-256 values.
- `manifest.remote3.json`, `manifest.remote4.json` — archived manifests for rollback/audit.
- `apps/player1/` — remotely replaceable Player 1 shell, CSS, raw-M3U module and app logic.
- `apps/player2/` — reserved for Player 2 / MAC.
- `system/policy.json` — feature, network and UI policy.
- `system/runtime.js` — bridge-facing compatibility runtime.
- `system/hooks.js` — post-load behavior hooks.
- `system/injections/` — ordered JS patches for deeper browser/player fixes.
- `system/actions.json` — optional startup native actions already exposed by the local firmware bridge.

## M3U bruto diagnostics

`remote.4` adds a `Log` button to **M3U bruto beta**. The log persists in `rawnetlog.v1` and records the network flow needed to distinguish upstream failures from local bridge failures: configuration fetch, bridge/direct requests, HTTP status, duration, response size, retry, direct fallback, M3U parse result, catalog counts and current RemoteTV release/mode/error. Credentials, passwords, tokens and common signed URL secrets are redacted before being stored or displayed.

## Boot / rollback

A cached valid release starts immediately. In parallel the TV checks GitHub for a newer manifest. A new release becomes active only after every required module matches its declared SHA-256 and the staged bundle validates. The previous complete release is retained for rollback. If the active remote app does not call `RemoteTV.ready(...)` within the watchdog window, the bootstrap falls back to the previous verified release and finally to the Player 1 embedded in the firmware.

## Native boundary

Remote modules can change HTML/CSS/JS, playlist/Xtream/MAC adapters, feature policy, browser-side bridge shims and use native capabilities that the firmware already exposes. `system/actions.json` is intentionally disabled by default; actions require `features.native_actions=true` in policy and still pass through the bootstrap's destructive-command guard. Kernel, drivers, decoder ABI, partition layout, updater logic and any new native capability not already exposed still require a firmware update.

The GitHub repository is therefore part of the TV's trusted runtime. Keep `manifest.json` and module hashes in sync and do not point the bootstrap at untrusted repositories.
