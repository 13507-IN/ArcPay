import {
  Address,
  Hex,
  isAddress,
  recoverMessageAddress,
} from "viem";
import { MilestoneMetadataInput } from "./types.js";

const AUTH_WINDOW_MS = 5 * 60 * 1000;

function normalizedMetadata(metadata: MilestoneMetadataInput) {
  return {
    brief: metadata.brief ?? null,
    invoiceNotes: metadata.invoiceNotes ?? null,
    freelancerEmail: metadata.freelancerEmail ?? null,
    freelancerWebhook: metadata.freelancerWebhook ?? null,
  };
}

export function buildMetadataAuthorizationMessage(input: {
  address: Address;
  milestoneId: number;
  issuedAt: number;
  metadata: MilestoneMetadataInput;
}): string {
  const contractAddress = (
    process.env.ESCROW_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000"
  ).toLowerCase();

  return JSON.stringify({
    app: "ArcPay",
    action: "update-milestone-metadata",
    chainId: 5042002,
    contractAddress,
    milestoneId: input.milestoneId,
    wallet: input.address.toLowerCase(),
    issuedAt: input.issuedAt,
    metadata: normalizedMetadata(input.metadata),
  });
}

export async function recoverMetadataSigner(input: {
  address: string;
  signature: string;
  issuedAt: number;
  milestoneId: number;
  metadata: MilestoneMetadataInput;
}): Promise<Address | null> {
  if (!isAddress(input.address) || !Number.isSafeInteger(input.issuedAt)) {
    return null;
  }

  if (Math.abs(Date.now() - input.issuedAt) > AUTH_WINDOW_MS) {
    return null;
  }

  try {
    return await recoverMessageAddress({
      message: buildMetadataAuthorizationMessage({
        address: input.address as Address,
        milestoneId: input.milestoneId,
        issuedAt: input.issuedAt,
        metadata: input.metadata,
      }),
      signature: input.signature as Hex,
    });
  } catch {
    return null;
  }
}
