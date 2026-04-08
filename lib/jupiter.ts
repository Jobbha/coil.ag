// Jupiter Developer Platform API Client
// Base: https://api.jup.ag — Auth: x-api-key header

const BASE = "https://api.jup.ag";

export function headers(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  const key = process.env.JUPITER_API_KEY;
  if (key) h["x-api-key"] = key;
  return h;
}

async function jfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...headers(), ...(init?.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new JupiterError(res.status, body, path);
  }
  return res.json() as Promise<T>;
}

export class JupiterError extends Error {
  constructor(
    public status: number,
    public body: string,
    public endpoint: string,
  ) {
    // Truncate body to 100 chars to avoid leaking sensitive data
    const safeBody = body.length > 100 ? body.substring(0, 100) + "..." : body;
    super(`Jupiter ${endpoint} responded ${status}: ${safeBody}`);
    this.name = "JupiterError";
  }
}

// ─── Price API ───────────────────────────────────────────────

export interface TokenPrice {
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
  liquidity: number;
  createdAt: string;
}

/** Price API returns { [mint]: TokenPrice } directly (no data wrapper) */
export type PriceResponse = Record<string, TokenPrice>;

/** Get USD prices for up to 50 token mints */
export async function getPrice(mints: string[]): Promise<PriceResponse> {
  const ids = mints.join(",");
  return jfetch<PriceResponse>(`/price/v3?ids=${ids}`);
}

// ─── Tokens API ──────────────────────────────────────────────

export interface TokenInfo {
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  mint: string;
  verified: boolean;
  organic_score: number;
  holder_count?: number;
  market_cap?: number;
  liquidity?: number;
  volume_24h?: number;
}

export interface TokenSearchResponse {
  tokens: TokenInfo[];
}

/** Search tokens by name, symbol, or mint */
export async function searchTokens(query: string): Promise<TokenSearchResponse> {
  return jfetch<TokenSearchResponse>(
    `/tokens/v2/search?query=${encodeURIComponent(query)}`,
  );
}

/** Get token metadata by mint address */
export async function getToken(mint: string): Promise<TokenInfo> {
  return jfetch<TokenInfo>(`/tokens/v2?mint=${mint}`);
}

// ─── Swap V2 API ─────────────────────────────────────────────

export interface SwapOrderParams {
  inputMint: string;
  outputMint: string;
  amount: string; // smallest unit
  taker: string; // wallet address
  slippageBps?: number;
}

export interface SwapOrderResponse {
  swapTransaction: string; // base64
  requestId: string;
  outputAmount: string;
  priceImpactPct: string;
}

export interface SwapExecuteResponse {
  status: "Success" | "Failed";
  signature: string;
  inputAmountResult: string;
  outputAmountResult: string;
}

/** Get a swap quote + assembled transaction */
export async function swapOrder(params: SwapOrderParams): Promise<SwapOrderResponse> {
  const qs = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    taker: params.taker,
    ...(params.slippageBps !== undefined && {
      slippageBps: String(params.slippageBps),
    }),
  });
  return jfetch<SwapOrderResponse>(`/swap/v2/order?${qs}`);
}

/** Submit a signed swap transaction for execution */
export async function swapExecute(
  signedTransaction: string,
  requestId: string,
): Promise<SwapExecuteResponse> {
  return jfetch<SwapExecuteResponse>("/swap/v2/execute", {
    method: "POST",
    body: JSON.stringify({ signedTransaction, requestId }),
  });
}

// ─── Lend API ────────────────────────────────────────────────

export interface LendTokenAsset {
  address: string;
  name: string;
  symbol: string;
  uiSymbol: string;
  decimals: number;
  logoUrl: string;
  price: string;
}

export interface LendToken {
  id: number;
  address: string; // vault token (jlUSDC etc)
  name: string;
  symbol: string; // jlUSDC, jlWSOL etc
  decimals: number;
  assetAddress: string; // underlying token mint
  asset: LendTokenAsset;
  totalRate: string; // APY in basis points (e.g. "378" = 3.78%)
  supplyRate: string;
  rewardsRate: string;
  totalAssets: string;
  totalSupply: string;
}

export interface LendPosition {
  mint: string;
  amount: string;
  shares: string;
  value_usd: number;
  apy: number;
}

export interface LendTxResponse {
  transaction: string; // base64 unsigned transaction
}

/** List available lending vault tokens */
export async function lendTokens(): Promise<LendToken[]> {
  return jfetch<LendToken[]>("/lend/v1/earn/tokens");
}

/** Get user's lending positions */
export async function lendPositions(wallet: string): Promise<LendPosition[]> {
  return jfetch<LendPosition[]>(`/lend/v1/earn/positions?wallet=${wallet}`);
}

/** Build a deposit transaction for earning yield */
export async function lendDeposit(
  asset: string,
  amount: string,
  signer: string,
): Promise<LendTxResponse> {
  return jfetch<LendTxResponse>("/lend/v1/earn/deposit", {
    method: "POST",
    body: JSON.stringify({ asset, amount, signer }),
  });
}

/** Build a withdrawal transaction */
export async function lendWithdraw(
  asset: string,
  amount: string,
  signer: string,
): Promise<LendTxResponse> {
  return jfetch<LendTxResponse>("/lend/v1/earn/withdraw", {
    method: "POST",
    body: JSON.stringify({ asset, amount, signer }),
  });
}

// ─── Trigger API (Limit Orders) ─────────────────────────────

export interface TriggerChallengeResponse {
  challenge: string;
}

export interface TriggerVerifyResponse {
  jwt: string;
}

export interface TriggerDepositCraftResponse {
  transaction: string; // base64
}

export type OrderType = "single" | "oco" | "otoco";

export interface CreateOrderParams {
  inputMint: string;
  outputMint: string;
  triggerPrice: string;
  orderType: OrderType;
  signedDepositTxn: string;
  expiryTime?: number;
  // OTOCO-specific
  takeProfitPrice?: string;
  stopLossPrice?: string;
}

export interface OrderInfo {
  orderId: string;
  status: string;
  inputMint: string;
  outputMint: string;
  triggerPrice: string;
  orderType: OrderType;
  createdAt: string;
  filledAt?: string;
  expiredAt?: string;
}

export interface OrderHistoryResponse {
  orders: OrderInfo[];
}

/** Request a sign-in challenge for Trigger API auth */
export async function triggerChallenge(
  wallet: string,
): Promise<TriggerChallengeResponse> {
  return jfetch<TriggerChallengeResponse>("/trigger/v2/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ wallet }),
  });
}

/** Submit signed challenge to get JWT (valid 24h) */
export async function triggerVerify(
  challenge: string,
  signature: string,
): Promise<TriggerVerifyResponse> {
  return jfetch<TriggerVerifyResponse>("/trigger/v2/auth/verify", {
    method: "POST",
    body: JSON.stringify({ challenge, signature }),
  });
}

/** Build a deposit transaction for Trigger vault */
export async function triggerDepositCraft(
  jwt: string,
  inputMint: string,
  amount: string,
): Promise<TriggerDepositCraftResponse> {
  return jfetch<TriggerDepositCraftResponse>("/trigger/v2/deposit/craft", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ inputMint, amount }),
  });
}

/** Create a limit order (single, OCO, or OTOCO) */
export async function triggerCreateOrder(
  jwt: string,
  params: CreateOrderParams,
): Promise<OrderInfo> {
  return jfetch<OrderInfo>("/trigger/v2/orders/price", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(params),
  });
}

/** Cancel an active order */
export async function triggerCancelOrder(
  jwt: string,
  orderId: string,
): Promise<void> {
  await jfetch<unknown>(`/trigger/v2/orders/price/cancel/${orderId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
  });
}

/** Get order history */
export async function triggerOrderHistory(
  jwt: string,
): Promise<OrderHistoryResponse> {
  return jfetch<OrderHistoryResponse>("/trigger/v2/orders/history", {
    headers: { Authorization: `Bearer ${jwt}` },
  });
}
