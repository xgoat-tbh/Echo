# Twilio NTS Setup — Step by Step

## Step 1: Create a Twilio account

1. Go to https://www.twilio.com/en-us/stun-turn
2. Click **Sign up** (top right) — email + password, takes 2 minutes
3. Verify your email

## Step 2: Get your Account SID and Auth Token

1. After login, you land on the **Console**: https://console.twilio.com
2. Look for **Account SID** and **Auth Token** on the dashboard (right side, under "Project Info")
3. Copy both values — you'll need them for env vars

```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Add these env vars to Render

In your Render dashboard → your voice-server service → **Environment**:

| Variable | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

## Step 4: Add the TURN endpoint to the server

Add this file to `server/src/`:

```typescript
// server/src/turn.ts
export async function getTurnCredentials() {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Tokens.json`,
    {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          btoa(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`),
      },
    }
  )
  if (!res.ok) throw new Error(`Twilio error: ${res.status}`)
  const data = await res.json()
  return data.ice_servers as Array<{
    urls: string
    username?: string
    credential?: string
  }>
}
```

## Step 5: Wire it into the room join flow

In `server/src/app.ts`, inside the `ROOM_JOIN` handler, fetch TURN credentials and send them to the client:

```typescript
case SignalMessageType.ROOM_JOIN: {
  // ... existing code ...

  // Fetch TURN credentials
  let iceServers = [{ urls: 'stun:stun.cloudflare.com:3478' }]
  try {
    const turnCreds = await getTurnCredentials()
    iceServers = turnCreds
  } catch (err) {
    console.warn('Failed to fetch TURN credentials, using STUN only:', err)
  }

  ws.send(JSON.stringify({
    type: SignalMessageType.ROOM_STATE,
    roomId: room.id,
    senderId: 'server',
    payload: {
      userId,
      ...room.getState(),
      iceServers,  // <-- send to client
    },
  }), true)
  break
}
```

## Step 6: Client uses the TURN servers

The client already reads `config.iceServers` from `src/config.ts`. During room join, update the stored ICE servers:

```typescript
// In room/page.tsx — when receiving room state
import { config } from '../../config'

// On ICE servers from server:
config.iceServers = roomState.iceServers || config.iceServers
```

## Verify it works

1. Open the deployed app in a browser
2. Open DevTools → Console
3. Look for ICE candidate messages. They should show `relay` type:

```
ICE candidate: candidate:... 1 udp ... typ relay raddr ...
```

If you see `typ host` or `typ srflx` only, TURN isn't being used — check credentials.

## Pricing

Twilio NTS pricing (as of 2026):

- **STUN**: free, unlimited
- **TURN**: $0.004 per 1,000 minutes (i.e., ~$0.24 for 1 hour of conversation for 10 users)

A typical game night (2 hours, 8 players) costs roughly **$0.02**.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `401 Unauthorized` from Twilio | Wrong Account SID or Auth Token in env vars |
| `relay` candidates never appear | TURN creds not passed to client; check server logs |
| No audio but signaling works | ICE candidates stuck on `host`; Render can't do P2P |
| Twilio returns error 400 | Account might need payment method — add one in billing |
