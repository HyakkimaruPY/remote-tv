# remote-tv

Remote application/runtime layer for the modified Philco TV firmware.

The firmware contains only a small bootstrap plus the last known-good local Player 1. On Player launch, the bootstrap asks the local Go bridge (`127.0.0.1:8765/fetch`) for `manifest.json`, verifies each listed module by SHA-256, and stores a complete release in localStorage.

## Layout

- `manifest.json` — atomic release and module order.
- `apps/player1/` — remotely replaceable Player 1 shell, CSS, raw-M3U module and app logic.
- `apps/player2/` — reserved for Player 2 / MAC work.
- `system/policy.json` — feature/network/UI policy editable without firmware reinstall.
- `system/runtime.js` — remote compatibility/bridge-facing runtime.
- `system/hooks.js` — post-load behavior hooks.
- `system/injections/` — complex JS patches loaded by the manifest.

## Safety model

A new release is cached only after every required module matches its SHA-256. The loader keeps the embedded local player as fallback. A remote app must call `RemoteTV.ready(...)`; otherwise the bootstrap restores the local shell and starts the embedded `ui.js`.

The bootstrap only downloads from this repository's pinned raw GitHub base. Native kernel/driver/ABI changes still require firmware, but player/UI/network policy and browser-side bridge shims can be changed here.
