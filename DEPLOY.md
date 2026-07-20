# Deployment Guide

## Architecture

```
Vercel (static)                     Render (server)
┌──────────────┐           ┌──────────────────────────┐
│  dist/       │           │  Node.js + uWebSockets   │
│  index.html  │  WSS ───▶ │  Signaling WS (:4000)    │
│  assets/*    │           │         │                │
│  SPA fallback│           │  MediaSoup SFU           │
│              │           │  (UDP 40000-49999)       │
└──────────────┘           └──────────┬───────────────┘
                                      │
                          ┌───────────▼───────────────┐
                          │  TURN Relay (Twilio/coturn)│
                          │  (required on Render —    │
                          │   no host networking)     │
                          └───────────────────────────┘
```

---

## Vercel (Client)

### 1. Connect repo to Vercel

- Import your git repo
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- No manual `vercel.json` needed (already provided)

### 2. Set environment variables in Vercel dashboard

| Variable | Value |
|---|---|
| `VITE_WS_URL` | `wss://voice-server.onrender.com/ws` |
| `VITE_API_URL` | `https://voice-server.onrender.com/api` |
| `VITE_TURN_URLS` | `turn:your-turn-server.com:3478` |
| `VITE_TURN_USERNAME` | *(from TURN provider)* |
| `VITE_TURN_CREDENTIAL` | *(from TURN provider)* |

Deploy — Vercel detects the `vercel.json`, builds, and serves with SPA routing.

---

## Render (Server)

### 1. Create a new Web Service on Render

- Connect repo → select `server/` as root directory
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `node --experimental-vm-modules src/index.ts`
- **Plan**: Starter ($7/mo) or higher

### 2. Set environment variables in Render dashboard

| Variable | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `PORT` | `4000` |
| `NUM_WORKERS` | `2` |
| `SFU_IP` | *(leave empty — auto-detects Render hostname)* |
| `TURN_URLS` | `turn:global.turn.twilio.com:3478?transport=udp` |
| `TURN_USERNAME` | *(Twilio / coturn credentials)* |
| `TURN_CREDENTIAL` | *(Twilio / coturn credentials)* |

### 3. Important: Render + WebRTC limitations

**Render does not support host-networking or custom UDP port ranges.**  
This means mediasoup's direct peer-to-peer UDP connections **will not work** on Render.

**Solution**: Force ALL media through a TURN relay.

#### Option A: Twilio NTS (recommended, pay-per-use)

```bash
# 1. Sign up at twilio.com
# 2. Get Account SID and Auth Token
# 3. Create a temp credential endpoint:

cat > server/src/turn.ts << 'EOF'
export async function getTwilioTurnCredentials() {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Tokens.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${process.env.TWILIO_SID}:${process.env.TWILIO_AUTH}`)}`,
      },
    }
  )
  const data = await res.json()
  return data.ice_servers
}
EOF

# 4. Serve this to clients on room join
```

Add to Render env:

| Variable | Value |
|---|---|
| `TWILIO_SID` | `ACxxxxxxxxxx` |
| `TWILIO_AUTH` | `your_auth_token` |

Set `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` to the values from Twilio.

#### Option B: Self-hosted coturn on a VPS

Run coturn on a cheap VPS ($5/mo DigitalOcean / Hetzner):

```bash
docker run -d --network host --name coturn \
  -e DETECT_EXTERNAL_IP=yes \
  coturn/coturn \
  -n --min-port=50000 --max-port=59999 \
  --realm=yourdomain.com \
  --user=user:secret \
  --lt-cred-mech
```

Then point `TURN_URLS` to your VPS IP.

#### Option C: Cloudflare TURN (free, limited beta)

Apply at https://developers.cloudflare.com/calls/turn/

---

## How the client finds the server

The client connects directly to the Render server via WebSocket:

```
Vercel client ──WSS──▶ voice-server.onrender.com:4000
```

No Vercel proxy needed. The `VITE_WS_URL` env var tells the client where to connect.

---

## Verification

After deploying:

1. Open the Vercel URL
2. Click "Create Room"
3. Check the browser console for WebSocket connection (should see `Connected`)
4. Open Render logs — should show `Server listening on port 4000`

If the WebSocket fails:
- Verify `VITE_WS_URL` is set correctly in Vercel
- Verify the server is running on Render (check logs)
- Verify there's no firewall blocking the connection

If audio doesn't flow (webRTC):
- Check that TURN credentials are correctly configured
- Verify TURN server is reachable from client browsers
- Check browser console for ICE candidate errors (should show `relay` type candidates)

---

## Production Runbook

### Deploy client

Push to main branch → Vercel auto-deploys.

### Deploy server

Push to main branch → Render auto-deploys (or manual deploy from dashboard).

### Debug

```bash
# Check server health
curl https://voice-server.onrender.com/api/health

# Watch server logs
# Render dashboard → your service → Logs
```

### Scale

- Vercel: auto-scales globally (static)
- Render: upgrade plan or add more instances behind a load balancer
- TURN: upgrade Twilio plan or add more coturn instances
