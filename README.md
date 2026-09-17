# remote-tv

Remote application/runtime layer for the modified Philco TV firmware.

The firmware keeps a small local bootstrap plus the last known-good Player 1. Every time the player opens, the bootstrap uses the existing local Go bridge (`127.0.0.1:8765/fetch`) to check `manifest.json` on this repository. Required modules are downloaded, SHA-256 verified and cached as one atomic release.

## Layout

- `manifest.json` — release number, module order and SHA-256 values.
- `apps/player1/` — remotely replaceable Player 1 shell, CSS, raw-M3U module and app logic.
- `apps/player2/` — reserved for Player 2 / MAC.
- `system/policy.json` — feature, network and UI policy.
- `system/runtime.js` — bridge-facing compatibility runtime.
- `system/hooks.js` — post-load behavior hooks.
- `system/injections/` — ordered JS patches for deeper browser/player fixes.
- `system/actions.json` — optional startup native actions already exposed by the local firmware bridge.

## Boot / rollback

A cached valid release starts immediately. In parallel the TV checks GitHub for a newer manifest. A new release becomes active only after every required module matches its declared SHA-256. The previous complete release is retained for rollback. If the active remote app does not call `RemoteTV.ready(...)` within the watchdog window, the bootstrap falls back to the previous verified release and finally to the Player 1 embedded in the firmware.

## Native boundary

Remote modules can change HTML/CSS/JS, playlist/Xtream/MAC adapters, feature policy, browser-side bridge shims and use native capabilities that the firmware already exposes. `system/actions.json` is intentionally disabled by default; actions require `features.native_actions=true` in policy and still pass through the bootstrap's destructive-command guard. Kernel, drivers, decoder ABI, partition layout, updater logic and any new native capability not already exposed still require a firmware update.

The GitHub repository is therefore part of the TV's trusted runtime. Keep `manifest.json` and module hashes in sync and do not point the bootstrap at untrusted repositories.
