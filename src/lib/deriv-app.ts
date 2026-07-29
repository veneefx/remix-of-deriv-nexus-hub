// Single source of truth for the Deriv application ID.
// Used for every WebSocket connection and OAuth authorization request.
export const DERIV_APP_ID = "33XI8M32mLLGgkDWPE4wt";

export const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;
