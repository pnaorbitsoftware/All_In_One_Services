# PERFORMANCE_METRICS.md

## Important — read this first

I do not have an Android/iOS device or emulator in this environment, so I cannot run the app and measure real cold-start time, FPS, memory, or CPU. **I'm not going to put made-up numbers in this document** — a table of invented milliseconds would look authoritative but would be fiction, and could give you false confidence about production readiness. What I can honestly give you:

1. The **target table** from the original brief, for reference.
2. **Qualitative, reasoned expectations** of where each change should help, based on what the code was doing before vs. after (e.g. "this endpoint no longer transfers a base64 image field it never used" is a real, code-verifiable claim; "this makes it 340ms faster" is not, without running it).
3. A **measurement methodology** you (or your team) can run in ~30–60 minutes to get real numbers, with the specific tools and steps.

## Targets (from your brief, for reference)

| Metric | Target |
|---|---|
| Cold Start | 1–2s |
| Warm Start | <1s |
| Login | 0.3–0.8s |
| Registration | 0.5–1s |
| Dashboard | <800ms |
| Booking | <1s |
| History | <500ms |
| Notifications | <500ms |
| Navigation | <300ms |
| Search | <200ms |
| Socket Connection | <1s |
| Scrolling / Animations | Stable 60 FPS |

## Where each change should matter, and why (qualitative, code-level reasoning)

- **Provider Dashboard load** — previously fetched a provider's *entire* booking history as full Mongoose documents (with `workImage` base64 fields) and categorized in JS; now `.lean()` + `workImage`-excluded + fetched once instead of twice on startup (via the new GET dedup). This is the single highest-confidence win of the whole pass — it touched the most bottleneck at once.
- **Payment history load** — same pattern: previously populated the full `booking` doc (including `workImage`) for every payment with no `.lean()`; now excluded and lean.
- **Booking detail / tracking screens** — same `workImage` exclusion + `.lean()`.
- **Notifications load** — same pattern, plus it's on the app's most frequent polling/refresh path (socket status-change events, foreground return, 10s fallback poll).
- **App startup for provider accounts** — the GET de-dup layer means the dashboard endpoint is hit once instead of twice concurrently on mount.
- **Tab switching / opening sheets** — the per-tab `useMemo` split on `screen` means switching tabs or opening/closing a sheet no longer risks recomputing every screen's JSX tree; each screen only recomputes when its own actual props would change. Combined with `React.memo` on all 9 screens, this should reduce dropped frames during navigation and sheet transitions specifically.
- **Bookings/Providers/Notifications list scrolling** — virtualization tuning (`windowSize`, `initialNumToRender`, `maxToRenderPerBatch`, `removeClippedSubviews`) should reduce initial render cost and off-screen memory for these lists as they grow with usage; the effect is more noticeable the longer a user's booking/notification history gets, less noticeable on a fresh test account with few items.

None of the above are measured numbers — they're the direct, traceable consequence of the code paths that changed. Please treat them as "where to look first," not as guaranteed deltas.

## How to get real numbers (recommended before production sign-off)

**Cold/warm start:**
```
adb shell am force-stop com.yourapp.package
adb shell am start-activity -W com.yourapp.package/.MainActivity
```
The `-W` flag prints `ThisTime`/`TotalTime` — that's your cold start. Repeat without force-stop for warm start.

**API/DB latency:** Use the existing `responseTimeLogger` middleware output (already in `server.js`) in production/staging logs, or hit endpoints with `curl -w "%{time_total}\n"` against a staging server with realistic data volume (the `.lean()`/`workImage` fixes will show the biggest delta on accounts with many past bookings — test with a seeded account that has 50+ bookings, not an empty one).

**FPS/JS+UI thread/memory/CPU:** React Native's built-in Perf Monitor (shake gesture → "Show Perf Monitor") for a quick check, or Flipper (React DevTools Profiler tab + Hermes sampling profiler) for a proper before/after on the specific screens above. Record a session scrolling the Bookings list and switching tabs 10–15 times before and after this patch for a fair comparison.

**Socket connection time:** Add a `console.time`/`console.timeEnd` around the `io(...)` call and the `"connect"` event in `App.js` temporarily, or watch the Network tab in Flipper's Socket.IO plugin.

I'd rather hand you a real methodology than a fake number — happy to help interpret results once you've run this.
