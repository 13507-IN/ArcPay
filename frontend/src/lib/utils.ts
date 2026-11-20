import { formatUnits } from "viem";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(
    address.length - chars
  )}`;
}

/**
 * On Arc, native USDC uses 18 decimals when read from getBalance or msg.value.
 */
export function formatUSDC(amountWei: string | bigint | number): string {
  try {
    const raw = typeof amountWei === "bigint" ? amountWei : BigInt(amountWei || 0);
    const formatted = formatUnits(raw, 18);
    const num = parseFloat(formatted);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(num);
  } catch {
    return "0.00";
  }
}

export function formatDate(timestampSec: number): string {
  if (!timestampSec) return "N/A";
  const date = new Date(timestampSec * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRemainingTime(deadlineSec: number): {
  isExpired: boolean;
  text: string;
} {
  const now = Math.floor(Date.now() / 1000);
  const diff = deadlineSec - now;

  if (diff <= 0) {
    const passed = Math.abs(diff);
    const days = Math.floor(passed / 86400);
    const hours = Math.floor((passed % 86400) / 3600);
    if (days > 0) return { isExpired: true, text: `Expired ${days}d ago` };
    if (hours > 0) return { isExpired: true, text: `Expired ${hours}h ago` };
    return { isExpired: true, text: "Expired recently" };
  }

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return { isExpired: false, text: `${days}d ${hours}h left` };
  if (hours > 0) return { isExpired: false, text: `${hours}h ${minutes}m left` };
  return { isExpired: false, text: `${minutes}m left` };
}

export function getExplorerTxUrl(txHash: string): string {
  const base =
    process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://explorer.testnet.arc.io";
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  const base =
    process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://explorer.testnet.arc.io";
  return `${base}/address/${address}`;
}
