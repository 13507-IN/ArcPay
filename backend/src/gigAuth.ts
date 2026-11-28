import {
  Address,
  Hex,
  isAddress,
  keccak256,
  recoverMessageAddress,
  toHex,
} from "viem";

const AUTH_WINDOW_MS = 5 * 60 * 1000;

export type GigAuthAction =
  | "create-gig"
  | "apply-gig"
  | "select-applicant"
  | "close-gig"
  | "link-milestone";

export function hashGigPayload(payload?: Record<string, unknown> | null): Hex | null {
  if (!payload) return null;
  const sortedEntries = Object.keys(payload)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = payload[key] ?? null;
      return acc;
    }, {});
  return keccak256(toHex(JSON.stringify(sortedEntries)));
}

export function buildGigAuthorizationMessage(input: {
  action: GigAuthAction;
  address: Address;
  issuedAt: number;
  gigId?: number;
  targetId?: number;
  payload?: Record<string, unknown> | null;
}): string {
  const contractAddress = (
    process.env.ESCROW_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000"
  ).toLowerCase();

  return JSON.stringify({
    app: "ArcPay",
    action: input.action,
    chainId: 5042002,
    contractAddress,
    gigId: input.gigId ?? null,
    targetId: input.targetId ?? null,
    payloadHash: hashGigPayload(input.payload),
    wallet: input.address.toLowerCase(),
    issuedAt: input.issuedAt,
  });
}

export async function recoverGigSigner(input: {
  action: GigAuthAction;
  address: string;
  signature: string;
  issuedAt: number;
  gigId?: number;
  targetId?: number;
  payload?: Record<string, unknown> | null;
}): Promise<Address | null> {
  if (!isAddress(input.address) || !Number.isSafeInteger(input.issuedAt)) {
    return null;
  }

  if (Math.abs(Date.now() - input.issuedAt) > AUTH_WINDOW_MS) {
    return null;
  }

  try {
    return await recoverMessageAddress({
      message: buildGigAuthorizationMessage({
        action: input.action,
        address: input.address as Address,
        issuedAt: input.issuedAt,
        gigId: input.gigId,
        targetId: input.targetId,
        payload: input.payload,
      }),
      signature: input.signature as Hex,
    });
  } catch {
    return null;
  }
}
