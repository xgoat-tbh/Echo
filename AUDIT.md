# Production Audit Report

## 🔴 Critical

### 1. XSS via dangerouslySetInnerHTML in chat (`src/App.tsx:1233,1304`)
Chat messages use `dangerouslySetInnerHTML` with user-controlled `msg.text` that is regex-replaced for @mentions but **not HTML-escaped first**:
```ts
const highlighted = msg.text.replace(/@(\w+)/g, '<span>@$1</span>')
// If msg.text = "<img src=x onerror=alert(1)>" — executes!
```
**Fix:** Sanitize with DOMPurify or escape HTML entities before the regex replace.

### 2. WebRTC without TURN server (`src/config.ts`)
Only STUN servers configured. P2P will fail for ~15% of users behind symmetric NATs. Voice simply won't work for them.
```
iceServers: [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
]
```
**Fix:** Set `VITE_TURN_URLS`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` env vars with a TURN provider (Twilio, Metered, etc.).

### 3. No authentication or rate limiting
Anyone can create/join any room, spam chat/clues/votes, and brute-force room codes. No server-side throttling on any event.
**Fix:** Add rate limiter (`express-rate-limit` or socket.io middleware). Consider player authentication via the player key system (server-issued tokens).

### 4. Room code space is small and enumrable
4 chars from 30-char alphabet = **810,000 combinations**. Trivial to brute-force join active rooms.
**Fix:** Increase to 6+ chars or use UUIDs. Add per-IP join rate limiting.

## 🟠 High

### 5. No TURN configured means voice fails for many users
As noted above. Without a TURN server, WebRTC is unreliable across NAT types. Voice is a core feature — this blocks a significant user segment.

### 6. State-based voice signaling is lossy (`src/hooks/useSocket.ts:56-58`, `src/App.tsx:218-243`)
`voiceOffer`, `voiceAnswer`, `iceCandidate` are single-value states. If two offers arrive before the first effect processes, the second overwrites the first silently.
**Fix:** Queue offers/answers, or process them in the socket listener directly rather than via React state.

### 7. In-memory game state (`server/src/game.ts:52`)
All rooms in a `Map<string, GameRoom>`. A server crash = total data loss. No persistence.
**Fix:** At minimum, add periodic serialization to disk. Long-term: Redis.

### 8. Server single-instance only
Socket.io uses default in-memory adapter. No horizontal scaling possible.
**Fix:** Add `@socket.io/redis-adapter` if scaling is needed.

### 9. Stale closure in handleDisconnect (`server/src/game.ts:789-831`)
`pIndex` and `wasActive` are captured at disconnect time. After 20s timeout, the array may have been modified by another disconnect or leave_room. Could splice the wrong player.
**Fix:** Re-look up the player by socket ID inside the timeout callback. Or use a stable player ID (not array index).

### 10. CORS origin: '*' (`server/src/index.ts:58`)
Wildcard CORS allows any website to use the WebSocket. Should restrict to known origins.
**Fix:** Set `origin: process.env.CORS_ORIGIN || ['https://echo-voice.vercel.app']`.

### 11. Reconnect uses nickname as identity (`server/src/game.ts:765`)
`room.players.find(p => p.nickname === nickname)` — if two players have the same nickname (not prevented), reconnect matches the wrong player.
**Fix:** Use a unique per-player key (the client-generated player key) as the identity for reconnect.

## 🟡 Medium

### 12. Timer drift (`server/src/game.ts:149`)
`setInterval(() => r.timerValue--, 1000)` has no drift correction. Over long game sessions (30+ min), the timer will drift.
**Fix:** Store a target end timestamp, compute remaining time as `endTime - Date.now()`.

### 13. Memory leak: disconnectTimers not cleaned up on room delete (`server/src/game.ts:746`)
If a room is deleted while a disconnect timer is pending, the timer stays in the map and fires on a stale reference.
**Fix:** When deleting a room, iterate and clear any disconnectTimers with matching keys.

### 14. Zombie code: ~25 unused files (~4000+ lines)
- `src/voice/` — full voice processing pipeline (NoiseSuppressor, VADProcessor, AGCProcessor, etc.) — **unused**
- `src/store/` — `gameStore.ts` and `voiceStore.ts` — **unreferenced by App.tsx**
- `src/app/lobby/page.tsx` — **unused route**
- VotePanel imports Player type from zombie store (`src/game/components/VotePanel.tsx:6`), works around with `as any`

**Fix:** Delete dead code. It bloats the bundle and misleads developers.

### 15. Unused dependencies in package.json
`mediasoup-client`, `dexie`, `zustand`, `uuid`, `mediasoup` are in package.json but never imported by actual code.
**Fix:** Remove unused deps. `mediasoup` on the server is also unused (pure P2P, no SFU).

### 16. Player nicknames and chat not sanitized on server (`server/src/game.ts:660`)
No HTML/tag stripping server-side. Server should strip tags even if client does.
**Fix:** Strip HTML from nicknames and chat messages before storing.

### 17. Player key is client-generated with no server validation
```ts
const key = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 30)]).join('')
```
The key is never sent to or validated by the server. It provides no actual security.
**Fix:** Generate keys server-side and issue them on socket connect.

### 18. VotePanel `as any` cast (`src/App.tsx:1273`)
```tsx
players={players.map(p => ({ ...p, username: p.nickname, avatar: '' })) as any}
```
Bypasses TypeScript safety. Component expects `username` + `avatar` fields but actual type uses `nickname`.
**Fix:** Update VotePanel to use the correct Player interface from useSocket.

### 19. Banner state leak across rooms
`showBanner` / `bannerPhase` are React states that don't reset when leaving a room. If a user rejoins, old banner may flash.

### 20. particle generation on every render (`src/App.tsx:361`)
```tsx
{Array.from({ length: 20 }).map((_, i) => (
  <motion.div ... style={{ left: `${Math.random() * 100}%`, ...  }}
```
Creates new array and new random positions on every render. Particles jump around.
**Fix:** Use `useMemo` for the particle positions.

### 21. handleDisconnect closes over stale `room` and `player` references
In the 20s timeout closure, `room` and `player` are from the outer `for` loop at disconnect time — they're correct since no room code changed, but the `pIndex` can be stale as noted.

### 22. Spectators leak: join from URL with no validation
Anyone can spectate any room by guessing room codes via `?spectate=CODE`.

### 23. AudioContext not resumed on user gesture
`beepRef` uses `new AudioContext()` which may be suspended on some browsers without a user gesture.
**Fix:** Resume on first click: `if (ctx.state === 'suspended') ctx.resume()`.

### 24. Mobile chat sheet shares state with desktop
Same `chatInput` state for both. Opening mobile sheet while desktop input has text carries it over.
**Fix:** Use separate state, or clear on sheet open.

## 🟢 Low

### 25. Bundle size: manualChunks only separates React
Other large deps (framer-motion, lucide-react) all in main chunk.
**Fix:** Add more granular code-splitting for heavy libs.

### 26. Vite config uses proxy for dev, but no preload/preconnect for production
No `<link rel="preconnect">` for the WebSocket server URL.
**Fix:** Add preconnect hint in index.html for the backend URL.

### 27. No error boundary
Whole app crashes on any render error. No `ErrorBoundary` wrapping.
**Fix:** Add a top-level error boundary.

### 28. No loading state for server static files
If `dist/` doesn't exist on server, it silently skips static serving. No log message.
**Fix:** Log a warning when static path is missing.

### 29. `handleSetCustomWordPairs` mutates server-side word list but `broadcastRoomState` doesn't include custom pairs in state
Custom word pairs are never sent to clients after update, only stored on server.
**Fix:** Either broadcast them, or remove the `currentPairs` prop if not needed client-side.

### 30. No offline/reconnect toast
When socket disconnects, the UI shows "Disconnected" status but no persistent toast explaining what happened.
**Fix:** Show a reconnecting overlay with countdown/heartbeat.

### 31. `navigator.vibrate` may throw in some contexts
`haptic()` wraps in try/catch but some browsers throw on cross-origin iframes.
**Fix:** Already handled (no issue, just noting).

---

## Phase 1: Security & Safety (Pre-launch must-fix)
- 🔴 1. XSS in chat — sanitize with DOMPurify
- 🔴 4. Room code enumeration — increase to 6+ chars + rate limit
- 🟠 10. CORS — restrict to known origins
- 🟡 16. Server-side input sanitization

## Phase 2: Core Reliability (Week 1)
- 🟠 6. Voice signaling — queue offers instead of state-based
- 🟠 9. Stale closure in handleDisconnect — re-lookup by socket ID
- 🟡 12. Timer drift correction
- 🟡 13. Clean up disconnectTimers on room delete
- 🟠 11. Reconnect by player key, not nickname

## Phase 3: Scalability & Persistence (Week 2)
- 🟠 7. Room persistence (disk + Redis)
- 🟠 8. Socket.io Redis adapter for multi-instance
- 🟠 3. Auth + rate limiting middleware

## Phase 4: Voice Completion (Week 2)
- 🔴 2. TURN server configuration
- 🟠 5. Voice connectivity testing/fallback
- 🟡 23. AudioContext resume on gesture

## Phase 5: Code Cleanup (Week 3)
- 🟡 14. Delete zombie code (~4000 lines)
- 🟡 15. Remove unused deps
- 🟡 18. Fix VotePanel types, remove `as any`
- 🟡 20. Memoize particles

## Phase 6: Polish (Week 3)
- 🟡 17. Server-issued player keys
- 🟡 19. Reset banner state on room leave
- 🟡 24. Separate mobile chat state
- 🟢 25-31. Bundle, preconnect, error boundary, reconnection UX
