export const config = {
  wsUrl: __WS_URL__,
  apiUrl: __API_URL__,
  iceServers: [
    { urls: 'stun:stun.cloudflare.com:3478' },
    ...(__TURN_URLS__.filter(Boolean).length > 0
      ? [
          {
            urls: __TURN_URLS__,
            username: __TURN_USERNAME__,
            credential: __TURN_CREDENTIAL__,
          },
        ]
      : []),
  ],
}
