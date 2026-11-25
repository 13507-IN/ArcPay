import { Address, Hex, isAddress, recoverMessageAddress } from "viem";

const AUTH_WINDOW_MS = 5 * 60 * 1000;

export type GigAuthAction =
  | "create-gig"
  | "apply-gig"
  | "select-applicant"
  | "close-gig"
  | "link-milestone";

export function buildGigAuthorizationMessage(input: {
  action: GigAuthAction;
  address: Address;
  issuedAt: number;
  gigId?: number;
  targetId?: number;
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
      }),
      signature: input.signature as Hex,
    });
  } catch {
    return null;
  }
}
