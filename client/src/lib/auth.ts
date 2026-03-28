const OAUTH_ISSUER = (import.meta.env.VITE_OAUTH_ISSUER as string | undefined)?.replace(/\/+$/, "") || "https://shelter.net.cn";
const OAUTH_CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID as string | undefined;
const OAUTH_SCOPE = (import.meta.env.VITE_OAUTH_SCOPE as string | undefined) || "openid profile email";
const OAUTH_REDIRECT_URI = (import.meta.env.VITE_OAUTH_REDIRECT_URI as string | undefined) || `${window.location.origin}/auth/callback`;

const AUTHORIZE_ENDPOINT = `${OAUTH_ISSUER}/api/oauth/authorize/`;
const TOKEN_ENDPOINT = `${OAUTH_ISSUER}/api/oauth/token/`;
const USERINFO_ENDPOINT = `${OAUTH_ISSUER}/api/oauth/userinfo/`;

const SESSION_STORAGE_KEY = "sheldng.auth.session";
const PKCE_STORAGE_KEY = "sheldng.auth.pkce";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  avatar?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
  user: AuthUser;
}

interface PkceState {
  state: string;
  codeVerifier: string;
}

function assertOAuthConfig() {
  if (!OAUTH_CLIENT_ID) {
    throw new Error("缺少登录配置：请在 client/.env 中填写 VITE_OAUTH_CLIENT_ID");
  }
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomString(length = 64): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return encodeBase64Url(bytes);
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return encodeBase64Url(new Uint8Array(digest));
}

async function fetchUserInfo(accessToken: string): Promise<AuthUser> {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`获取用户信息失败（${response.status}）`);
  }

  const userInfo = await response.json() as {
    id: string | number;
    username?: string;
    nickname?: string;
    email?: string;
    avatar?: string;
  };

  return {
    id: String(userInfo.id),
    username: userInfo.nickname || userInfo.username || userInfo.email?.split("@")[0] || `用户${userInfo.id}`,
    email: userInfo.email,
    fullName: userInfo.nickname || userInfo.username,
    avatar: userInfo.avatar,
  };
}

function persistSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function readStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function storePkceState(data: PkceState) {
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(data));
}

function takePkceState(): PkceState | null {
  const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PkceState;
  } catch {
    return null;
  }
}

export async function beginOAuthSignIn(): Promise<void> {
  assertOAuthConfig();

  const state = randomString(32);
  const codeVerifier = randomString(64);
  const codeChallenge = await sha256(codeVerifier);

  storePkceState({ state, codeVerifier });

  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID!,
    redirect_uri: OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: OAUTH_SCOPE,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.assign(`${AUTHORIZE_ENDPOINT}?${params.toString()}`);
}

export async function finishOAuthCallback(callbackUrl: URL): Promise<AuthSession> {
  assertOAuthConfig();

  const error = callbackUrl.searchParams.get("error");
  if (error) {
    throw new Error(callbackUrl.searchParams.get("error_description") || error);
  }

  const code = callbackUrl.searchParams.get("code");
  const returnedState = callbackUrl.searchParams.get("state");
  const pkceState = takePkceState();

  if (!code || !returnedState || !pkceState) {
    throw new Error("登录回调缺少授权码或校验状态");
  }

  if (returnedState !== pkceState.state) {
    throw new Error("登录状态校验失败，请重新发起登录");
  }

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: OAUTH_CLIENT_ID,
      code,
      redirect_uri: OAUTH_REDIRECT_URI,
      code_verifier: pkceState.codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(`换取登录令牌失败：${errorBody}`);
  }

  const tokenData = await tokenResponse.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const user = await fetchUserInfo(tokenData.access_token);
  const session: AuthSession = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? null,
    expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
    user,
  };

  persistSession(session);
  return session;
}

export async function refreshStoredSession(session: AuthSession): Promise<AuthSession | null> {
  assertOAuthConfig();

  if (!session.refresh_token) {
    persistSession(null);
    return null;
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: OAUTH_CLIENT_ID,
      refresh_token: session.refresh_token,
    }),
  });

  if (!response.ok) {
    persistSession(null);
    return null;
  }

  const tokenData = await response.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const user = await fetchUserInfo(tokenData.access_token);
  const nextSession: AuthSession = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? session.refresh_token,
    expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
    user,
  };

  persistSession(nextSession);
  return nextSession;
}

export function clearStoredSession() {
  persistSession(null);
}
