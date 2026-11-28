import dns from "node:dns/promises";
import net from "node:net";

/**
 * Autonomous AI Deliverable Verification Oracle
 *
 * 1. Fetches real, live deliverable evidence (GitHub REST API repo tree, languages,
 *    README, package.json, PR diffs, or SSRF-safe HTTP deployment content / IPFS gateway).
 * 2. Sends the real evidence + client milestone title/brief to Cerebras / Groq / OpenRouter / Gemini
 *    for strict semantic verification.
 * 3. Falls back to strict evidence-based domain & file-tree checks if no LLM key is set.
 */

export interface VerificationCheck {
  id: string;
  name: string;
  status: "passed" | "warning" | "failed";
  score: number; // 0 - 100
  detail: string;
}

export interface VerificationAuditReport {
  milestoneId?: number;
  deliverableUrl: string;
  deliverableType:
    | "github_pr"
    | "github_repo"
    | "figma"
    | "ipfs"
    | "deployment"
    | "generic_url";
  overallScore: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "F";
  status: "PASSED" | "REVIEW_RECOMMENDED" | "FAILED";
  recommendation:
    | "SAFE_TO_RELEASE"
    | "SATISFACTORY"
    | "MANUAL_REVIEW_REQUIRED";
  summary: string;
  checks: VerificationCheck[];
  metadata: {
    targetMilestone?: string;
    filesInspected?: number;
    testsDetected?: boolean;
    securityFlags?: number;
    inspectedAt: string;
    oracleSignature?: string;
    aiEngine?: string;
    llmConfigured?: boolean;
  };
}

interface DeliverableEvidence {
  deliverableType: VerificationAuditReport["deliverableType"];
  normalizedUrl: string;
  reachable: boolean;
  httpStatus?: number;
  fetchError?: string;
  github?: {
    owner: string;
    repo: string;
    prNumber?: number;
    description: string;
    primaryLanguage: string | null;
    languages: Record<string, number>;
    topics: string[];
    sizeKb: number;
    defaultBranch: string;
    totalFiles: number;
    sampleFiles: string[];
    hasSolidityFiles: boolean;
    hasSmartContractTooling: boolean;
    hasTestFiles: boolean;
    hasCiCd: boolean;
    hasEnvLeak: boolean;
    dependencies: string[];
    readmeSnippet: string;
    prInfo?: {
      title: string;
      state: string;
      merged: boolean;
      changedFiles: number;
      additions: number;
      deletions: number;
      files: string[];
    };
  };
  web?: {
    title: string;
    description: string;
    textSnippet: string;
  };
}

const FETCH_TIMEOUT_MS = 7000;
const MAX_WEB_BODY_BYTES = 262_144; // 256 KB cap
const AUDIT_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_AUDIT_CACHE_ENTRIES = 200;

interface CachedAuditEntry {
  report: VerificationAuditReport;
  expiresAt: number;
}

const auditCache = new Map<string, CachedAuditEntry>();

function isPrivateOrReservedIp(ip: string): boolean {
  const cleaned = ip.replace(/^::ffff:/i, "");
  const ipv4Match = cleaned.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // Link-local / Cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    ) {
      return true;
    }
    return false;
  }

  const lower = cleaned.toLowerCase();
  if (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  ) {
    return true;
  }
  return false;
}

async function assertSafePublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Unsupported protocol: ${url.protocol}`);
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("Blocked internal or localhost address");
  }

  if (net.isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      throw new Error("Blocked private or reserved IP address");
    }
    return;
  }

  const records = await dns.lookup(host, { all: true }).catch(() => null);
  if (!records || records.length === 0) {
    throw new Error("Domain DNS resolution failed");
  }
  for (const rec of records) {
    if (isPrivateOrReservedIp(rec.address)) {
      throw new Error("Blocked domain resolving to private network");
    }
  }
}

async function safePublicWebFetch(initialUrl: URL): Promise<{ res: Response; html: string }> {
  let currentUrl = initialUrl;
  for (let hop = 0; hop < 4; hop++) {
    await assertSafePublicUrl(currentUrl);
    const res = await fetch(currentUrl.toString(), {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "ArcPay-AI-Oracle/1.0" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) {
        return { res, html: "" };
      }
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return { res, html: "" };
    }
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (totalBytes < MAX_WEB_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      totalBytes += value.byteLength;
    }
    try {
      await reader.cancel();
    } catch {}
    const html = Buffer.concat(chunks).toString("utf-8").slice(0, MAX_WEB_BODY_BYTES);
    return { res, html };
  }
  throw new Error("Too many HTTP redirects");
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "ArcPay-AI-Oracle/1.0",
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function safeFetchJson(
  url: string,
  headers: Record<string, string> = {}
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || "Network request failed",
    };
  }
}

async function fetchDeliverableEvidence(
  rawUrl: string
): Promise<DeliverableEvidence> {
  let parsed: URL;
  try {
    parsed = new URL(
      rawUrl.startsWith("http://") ||
        rawUrl.startsWith("https://") ||
        rawUrl.startsWith("ipfs://")
        ? rawUrl
        : `https://${rawUrl}`
    );
  } catch {
    return {
      deliverableType: "generic_url",
      normalizedUrl: rawUrl,
      reachable: false,
      fetchError: "Invalid URL format",
    };
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  // 1. GitHub Repository or Pull Request
  if (host === "github.com" || host === "www.github.com") {
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/i, "");
      if (!/^[a-zA-Z0-9_.-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(repo)) {
        return {
          deliverableType: "github_repo",
          normalizedUrl: parsed.toString(),
          reachable: false,
          fetchError: "Invalid GitHub owner or repository name.",
        };
      }
      let prNumber: number | undefined;
      let deliverableType: VerificationAuditReport["deliverableType"] =
        "github_repo";

      if (parts[2] === "pull" && parts[3] && /^\d+$/.test(parts[3])) {
        prNumber = parseInt(parts[3], 10);
        deliverableType = "github_pr";
      }

      const headers = githubHeaders();
      const repoRes = await safeFetchJson(
        `https://api.github.com/repos/${owner}/${repo}`,
        headers
      );

      if (!repoRes.ok || !repoRes.data) {
        return {
          deliverableType,
          normalizedUrl: parsed.toString(),
          reachable: false,
          httpStatus: repoRes.status,
          fetchError:
            repoRes.status === 404
              ? "GitHub repository not found or is private."
              : repoRes.status === 403
              ? "GitHub API rate limit reached. Set GITHUB_TOKEN in backend/.env."
              : repoRes.error || `GitHub API returned HTTP ${repoRes.status}`,
        };
      }

      const defaultBranch = repoRes.data.default_branch || "main";

      // Fetch languages, tree, readme, and package.json in parallel
      const [langRes, treeRes, readmeRes, pkgRes] = await Promise.all([
        safeFetchJson(
          `https://api.github.com/repos/${owner}/${repo}/languages`,
          headers
        ),
        safeFetchJson(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
          headers
        ),
        safeFetchJson(
          `https://api.github.com/repos/${owner}/${repo}/readme`,
          headers
        ),
        safeFetchJson(
          `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
          headers
        ),
      ]);

      const languages: Record<string, number> =
        langRes.ok && langRes.data && typeof langRes.data === "object"
          ? langRes.data
          : {};

      const allPaths: string[] =
        treeRes.ok && Array.isArray(treeRes.data?.tree)
          ? treeRes.data.tree
              .filter((item: any) => item.type === "blob")
              .map((item: any) => String(item.path))
          : [];

      const hasSolidityFiles = allPaths.some(
        (p) => p.endsWith(".sol") || p.endsWith(".vy")
      );
      const hasSmartContractTooling = allPaths.some(
        (p) =>
          /(^|\/)hardhat\.config\.(js|ts|cjs|mjs)$/i.test(p) ||
          /(^|\/)foundry\.toml$/i.test(p) ||
          /(^|\/)truffle-config\.(js|ts)$/i.test(p) ||
          /(^|\/)Anchor\.toml$/i.test(p) ||
          /(^|\/)Move\.toml$/i.test(p)
      );
      const hasTestFiles = allPaths.some((p) =>
        /(^|\/)(tests?|__tests__|spec)(\/|$)|\.(test|spec|t\.sol)\./i.test(p) ||
        p.endsWith(".t.sol")
      );
      const hasCiCd = allPaths.some((p) => p.startsWith(".github/workflows/"));
      const hasEnvLeak = allPaths.some((p) => {
        const base = p.split("/").pop()?.toLowerCase() || "";
        return (
          (base === ".env" ||
            base === ".env.production" ||
            base === "id_rsa" ||
            base.endsWith(".pem")) &&
          !base.includes("example")
        );
      });

      let readmeSnippet = "";
      if (readmeRes.ok && readmeRes.data?.content) {
        try {
          readmeSnippet = Buffer.from(
            readmeRes.data.content,
            "base64"
          )
            .toString("utf-8")
            .slice(0, 2500);
        } catch {
          readmeSnippet = "";
        }
      }

      let dependencies: string[] = [];
      if (pkgRes.ok && pkgRes.data?.content) {
        try {
          const pkgJson = JSON.parse(
            Buffer.from(pkgRes.data.content, "base64").toString("utf-8")
          );
          dependencies = [
            ...Object.keys(pkgJson.dependencies || {}),
            ...Object.keys(pkgJson.devDependencies || {}),
          ];
        } catch {
          dependencies = [];
        }
      }

      let prInfo: NonNullable<DeliverableEvidence["github"]>["prInfo"];
      if (prNumber) {
        const [prRes, prFilesRes] = await Promise.all([
          safeFetchJson(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
            headers
          ),
          safeFetchJson(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=30`,
            headers
          ),
        ]);
        if (prRes.ok && prRes.data) {
          prInfo = {
            title: prRes.data.title || "",
            state: prRes.data.state || "",
            merged: Boolean(prRes.data.merged),
            changedFiles: prRes.data.changed_files || 0,
            additions: prRes.data.additions || 0,
            deletions: prRes.data.deletions || 0,
            files: Array.isArray(prFilesRes.data)
              ? prFilesRes.data.map((f: any) => String(f.filename))
              : [],
          };
        }
      }

      return {
        deliverableType,
        normalizedUrl: parsed.toString(),
        reachable: true,
        httpStatus: 200,
        github: {
          owner,
          repo,
          prNumber,
          description: repoRes.data.description || "",
          primaryLanguage: repoRes.data.language || null,
          languages,
          topics: Array.isArray(repoRes.data.topics) ? repoRes.data.topics : [],
          sizeKb: repoRes.data.size || 0,
          defaultBranch,
          totalFiles: allPaths.length,
          sampleFiles: allPaths.slice(0, 80),
          hasSolidityFiles,
          hasSmartContractTooling,
          hasTestFiles,
          hasCiCd,
          hasEnvLeak,
          dependencies: dependencies.slice(0, 60),
          readmeSnippet,
          prInfo,
        },
      };
    }
  }

  // 2. IPFS
  if (rawUrl.startsWith("ipfs://") || host.includes("ipfs") || host.includes("pinata")) {
    const cidMatch = rawUrl.match(/(Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafy[a-zA-Z0-9]{20,}|bafk[a-zA-Z0-9]{20,})/);
    if (!cidMatch) {
      return {
        deliverableType: "ipfs",
        normalizedUrl: rawUrl,
        reachable: false,
        fetchError: "Invalid IPFS CID format.",
      };
    }
    const probeUrl = `https://ipfs.io/ipfs/${cidMatch[1]}`;
    try {
      const res = await fetch(probeUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      return {
        deliverableType: "ipfs",
        normalizedUrl: rawUrl,
        reachable: res.ok,
        httpStatus: res.status,
        fetchError: res.ok ? undefined : `IPFS gateway returned HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        deliverableType: "ipfs",
        normalizedUrl: rawUrl,
        reachable: false,
        fetchError: err?.message || "IPFS gateway unreachable",
      };
    }
  }

  // 3. Figma / Deployment / Generic Web URL
  const isFigma = host.includes("figma.com");
  const isDeploy =
    host.includes("vercel.app") ||
    host.includes("netlify.app") ||
    host.includes("pages.dev") ||
    host.includes("render.com");

  const deliverableType: VerificationAuditReport["deliverableType"] = isFigma
    ? "figma"
    : isDeploy
    ? "deployment"
    : "generic_url";

  try {
    const { res, html } = await safePublicWebFetch(parsed);
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
    );
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);

    return {
      deliverableType,
      normalizedUrl: parsed.toString(),
      reachable: res.ok,
      httpStatus: res.status,
      fetchError: res.ok ? undefined : `Endpoint returned HTTP ${res.status}`,
      web: {
        title: titleMatch?.[1]?.trim() || "",
        description: descMatch?.[1]?.trim() || "",
        textSnippet: stripped,
      },
    };
  } catch (err: any) {
    return {
      deliverableType,
      normalizedUrl: parsed.toString(),
      reachable: false,
      fetchError: err?.message || "URL unreachable",
    };
  }
}

function buildAuditPrompt(params: {
  title: string;
  brief: string;
  evidence: DeliverableEvidence;
}): string {
  const { title, brief, evidence } = params;
  return `You are the Autonomous Escrow Deliverable Auditor for ArcPay (Circle Arc Layer-1 USDC Escrow).
Your job is to protect the client from paying for wrong, fake, empty, or mismatched deliverables, while fairly approving legitimate matching work.

Be STRICT and ADVERSARIAL. Never assume a repository matches just because it is on GitHub.
Inspect the ACTUAL evidence below and compare it against what the client requested.

CLIENT MILESTONE REQUIREMENT:
- Title: ${title || "(No title provided)"}
- Brief / Scope: ${brief || "(No additional brief provided)"}

DELIVERABLE URL: ${evidence.normalizedUrl}
DELIVERABLE TYPE: ${evidence.deliverableType}
REACHABLE: ${evidence.reachable} (HTTP ${evidence.httpStatus ?? "N/A"})${evidence.fetchError ? ` - Error: ${evidence.fetchError}` : ""}

LIVE INSPECTED EVIDENCE:
${JSON.stringify(evidence.github || evidence.web || {}, null, 2)}

CRITICAL RULES:
1. If REACHABLE is false, you MUST fail link_reachability (score 0-20) and set overallScore <= 30, status "FAILED", recommendation "MANUAL_REVIEW_REQUIRED".
2. Compare the milestone Title & Brief against the actual languages, file paths, dependencies, and README.
   - Example: If the milestone asks for a "Smart contract", "Solidity", "Web3", or "Smart contract Audit", and the repo has NO .sol/.vy files, NO Hardhat/Foundry/Anchor configs, and NO Web3 dependencies, you MUST mark spec_alignment as "failed" (score 0-20), set overallScore < 50, grade "F", status "FAILED", and recommendation "MANUAL_REVIEW_REQUIRED".
3. Evaluate test_coverage honestly from sampleFiles (hasTestFiles / hasCiCd). If there are no test files or CI workflows, mark it "warning" (score 40-60), NOT passed.
4. Cite actual observed facts (repo languages, filenames, dependencies, or missing files) in every check's "detail".

Return ONLY a valid JSON object matching this exact structure:
{
  "overallScore": number (0-100),
  "grade": "A+" | "A" | "B" | "C" | "F",
  "status": "PASSED" | "REVIEW_RECOMMENDED" | "FAILED",
  "recommendation": "SAFE_TO_RELEASE" | "SATISFACTORY" | "MANUAL_REVIEW_REQUIRED",
  "summary": "2-3 concise sentences summarizing the real findings and whether the deliverable matches the milestone.",
  "checks": [
    { "id": "link_reachability", "name": "Deliverable Reachability & Endpoint Health", "status": "passed"|"warning"|"failed", "score": 0-100, "detail": "..." },
    { "id": "source_integrity", "name": "Codebase & Deliverable Structure", "status": "passed"|"warning"|"failed", "score": 0-100, "detail": "..." },
    { "id": "test_coverage", "name": "Automated Test Suite & CI/CD Status", "status": "passed"|"warning"|"failed", "score": 0-100, "detail": "..." },
    { "id": "security_audit", "name": "Security, Secrets & Leak Detection", "status": "passed"|"warning"|"failed", "score": 0-100, "detail": "..." },
    { "id": "spec_alignment", "name": "Milestone Scope & Deliverable Alignment", "status": "passed"|"warning"|"failed", "score": 0-100, "detail": "..." }
  ]
}`;
}

interface LlmAuditResult {
  overallScore: number;
  grade: VerificationAuditReport["grade"];
  status: VerificationAuditReport["status"];
  recommendation: VerificationAuditReport["recommendation"];
  summary: string;
  checks: VerificationCheck[];
  modelUsed: string;
}

function parseAuditJson(rawText: string, modelUsed: string): LlmAuditResult | null {
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.overallScore === "number" &&
      Array.isArray(parsed.checks) &&
      parsed.checks.length > 0
    ) {
      return {
        overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore))),
        grade: parsed.grade || "C",
        status: parsed.status || "REVIEW_RECOMMENDED",
        recommendation: parsed.recommendation || "MANUAL_REVIEW_REQUIRED",
        summary: parsed.summary || "AI audit completed.",
        checks: parsed.checks,
        modelUsed,
      };
    }
  } catch {
    // ignore parse failure
  }
  return null;
}

async function callOpenAICompatibleAudit(prompt: string): Promise<LlmAuditResult | null> {
  const providers: Array<{ name: string; baseUrl: string; apiKey: string; model: string }> = [];

  if (process.env.CEREBRAS_API_KEY) {
    providers.push({
      name: "Cerebras",
      baseUrl: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: process.env.CEREBRAS_API_KEY,
      model: process.env.CEREBRAS_MODEL || "llama-3.3-70b",
    });
  }
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
    });
  }
  if (process.env.AI_API_KEY && process.env.AI_BASE_URL) {
    providers.push({
      name: "CustomAI",
      baseUrl: process.env.AI_BASE_URL,
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
    });
  }

  for (const p of providers) {
    try {
      const res = await fetch(p.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${p.apiKey}`,
        },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          model: p.model,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a strict escrow deliverable auditor. Always respond with valid JSON only.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`${p.name} (${p.model}) failed (${res.status}):`, errText.slice(0, 250));
        continue;
      }

      const json: any = await res.json();
      const rawText = json?.choices?.[0]?.message?.content;
      if (!rawText) continue;

      const parsed = parseAuditJson(rawText, `${p.name}: ${p.model}`);
      if (parsed) return parsed;
    } catch (err: any) {
      console.warn(`${p.name} error:`, err?.message);
    }
  }
  return null;
}

async function callGeminiAudit(params: {
  title: string;
  brief: string;
  evidence: DeliverableEvidence;
}): Promise<LlmAuditResult | null> {
  const prompt = buildAuditPrompt(params);

  // Try high-limit OpenAI-compatible free providers first (Cerebras, Groq, OpenRouter, Custom)
  const openAiResult = await callOpenAICompatibleAudit(prompt);
  if (openAiResult) return openAiResult;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Gemini ${model} failed (${res.status}):`, errText.slice(0, 300));
        continue;
      }

      const json: any = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      if (
        typeof parsed.overallScore === "number" &&
        Array.isArray(parsed.checks) &&
        parsed.checks.length > 0
      ) {
        return {
          overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore))),
          grade: parsed.grade || "C",
          status: parsed.status || "REVIEW_RECOMMENDED",
          recommendation: parsed.recommendation || "MANUAL_REVIEW_REQUIRED",
          summary: parsed.summary || "AI audit completed.",
          checks: parsed.checks,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      console.warn(`Gemini ${model} error:`, err?.message);
    }
  }

  return null;
}

function buildEvidenceBasedFallbackReport(params: {
  rawUrl: string;
  title: string;
  brief: string;
  evidence: DeliverableEvidence;
  milestoneId?: number;
}): VerificationAuditReport {
  const { rawUrl, title, brief, evidence, milestoneId } = params;
  const checks: VerificationCheck[] = [];

  // 1. Reachability
  checks.push({
    id: "link_reachability",
    name: "Deliverable Reachability & Endpoint Health",
    status: evidence.reachable ? "passed" : "failed",
    score: evidence.reachable ? 100 : 0,
    detail: evidence.reachable
      ? `Verified live ${evidence.deliverableType.toUpperCase()} endpoint (HTTP ${evidence.httpStatus ?? 200}).`
      : evidence.fetchError || "Deliverable endpoint could not be reached.",
  });

  const gh = evidence.github;

  // 2. Source Structure
  if (gh) {
    const langList = Object.keys(gh.languages);
    const hasContent = gh.totalFiles > 0 && gh.sizeKb > 0;
    checks.push({
      id: "source_integrity",
      name: gh.prNumber
        ? "GitHub Pull Request & Git Commit Audit"
        : "GitHub Repository & Code Structure",
      status: !evidence.reachable ? "failed" : hasContent ? "passed" : "failed",
      score: !evidence.reachable ? 0 : hasContent ? 90 : 15,
      detail: !evidence.reachable
        ? "Repository unreachable; cannot inspect source structure."
        : hasContent
        ? `Inspected ${gh.totalFiles} files (${gh.sizeKb} KB). Languages: ${
            langList.length > 0 ? langList.join(", ") : gh.primaryLanguage || "Unknown"
          }.`
        : "Repository appears empty (0 files).",
    });

    // 3. Test Suite & CI/CD
    checks.push({
      id: "test_coverage",
      name: "Automated Test Suite & CI/CD Status",
      status: gh.hasTestFiles && gh.hasCiCd ? "passed" : gh.hasTestFiles || gh.hasCiCd ? "warning" : "warning",
      score: gh.hasTestFiles && gh.hasCiCd ? 92 : gh.hasTestFiles || gh.hasCiCd ? 65 : 40,
      detail:
        gh.hasTestFiles || gh.hasCiCd
          ? `Detected ${gh.hasTestFiles ? "test files" : "no test files"} and ${
              gh.hasCiCd ? ".github/workflows CI" : "no CI workflows"
            }.`
          : "No test files or .github/workflows CI pipelines detected in repository tree.",
    });

    // 4. Security
    checks.push({
      id: "security_audit",
      name: "Security, Secrets & Leak Detection",
      status: gh.hasEnvLeak ? "failed" : "passed",
      score: gh.hasEnvLeak ? 20 : 95,
      detail: gh.hasEnvLeak
        ? "Warning: Sensitive environment/key file (.env or .pem) committed in repository tree!"
        : "No committed .env files or private key artifacts found in repository tree.",
    });

    // 5. Scope Alignment (Real content check, NEVER blind pass!)
    const scopeText = `${title} ${brief}`.toLowerCase();
    const needsWeb3 =
      /(smart\s*contract|solidity|vyper|erc20|erc721|erc1155|web3|defi|foundry|hardhat|truffle|blockchain|escrow|on-?chain|wagmi|viem|ethers)/i.test(
        scopeText
      );
    const web3Deps = gh.dependencies.filter((d) =>
      /(ethers|viem|wagmi|hardhat|openzeppelin|web3|solc|foundry|truffle|rainbowkit|anchor)/i.test(d)
    );
    const hasWeb3Evidence =
      gh.hasSolidityFiles ||
      gh.hasSmartContractTooling ||
      web3Deps.length > 0 ||
      Boolean(gh.languages["Solidity"] || gh.languages["Vyper"] || gh.languages["Move"]);

    const repoCorpus = `${gh.description} ${gh.topics.join(" ")} ${gh.sampleFiles.join(" ")} ${gh.readmeSnippet}`.toLowerCase();
    const keywords = scopeText
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["with", "this", "that", "from", "milestone", "project", "for"].includes(w));
    const matchedKeywords = keywords.filter((kw) => repoCorpus.includes(kw));

    if (!evidence.reachable) {
      checks.push({
        id: "spec_alignment",
        name: "Milestone Scope & Deliverable Alignment",
        status: "failed",
        score: 0,
        detail: "Cannot verify milestone alignment because deliverable is unreachable.",
      });
    } else if (needsWeb3 && !hasWeb3Evidence) {
      checks.push({
        id: "spec_alignment",
        name: "Milestone Scope & Deliverable Alignment",
        status: "failed",
        score: 10,
        detail: `Scope Mismatch: Milestone requires smart contract / Web3 work ("${title}"), but inspected repo has 0 Solidity/Vyper files, no Hardhat/Foundry config, and no Web3 dependencies (Detected: ${
          langList.join(", ") || "none"
        }).`,
      });
    } else if (keywords.length > 0 && matchedKeywords.length === 0) {
      checks.push({
        id: "spec_alignment",
        name: "Milestone Scope & Deliverable Alignment",
        status: "warning",
        score: 45,
        detail: `No direct keyword match between milestone ("${title}") and repo files/README. Add GEMINI_API_KEY in backend/.env for full AI semantic audit.`,
      });
    } else {
      checks.push({
        id: "spec_alignment",
        name: "Milestone Scope & Deliverable Alignment",
        status: "warning",
        score: 72,
        detail: `Matched ${matchedKeywords.length}/${keywords.length} scope terms (${matchedKeywords
          .slice(0, 4)
          .join(", ")}). Add GEMINI_API_KEY in backend/.env for deep AI code verification.`,
      });
    }
  } else {
    // Non-GitHub deliverable
    checks.push({
      id: "source_integrity",
      name: "Deliverable Content Inspection",
      status: evidence.reachable ? "passed" : "failed",
      score: evidence.reachable ? 85 : 0,
      detail: evidence.web?.title
        ? `Page title: "${evidence.web.title}"`
        : evidence.reachable
        ? "Deliverable endpoint responded cleanly."
        : evidence.fetchError || "Deliverable unreachable.",
    });

    checks.push({
      id: "test_coverage",
      name: "Deliverable Quality & Spec Compliance",
      status: evidence.reachable ? "warning" : "failed",
      score: evidence.reachable ? 65 : 0,
      detail: evidence.reachable
        ? "Non-code URL inspected. Manual verification of interactive features recommended."
        : "Endpoint unreachable.",
    });

    const hasSuspiciousChars =
      rawUrl.includes("private_key") ||
      rawUrl.includes("secret=") ||
      rawUrl.includes("password=");
    checks.push({
      id: "security_audit",
      name: "Security, Secrets & Leak Detection",
      status: hasSuspiciousChars ? "failed" : "passed",
      score: hasSuspiciousChars ? 15 : 95,
      detail: hasSuspiciousChars
        ? "Potential exposed secret parameters detected in URL."
        : "No exposed secret parameters detected in deliverable URL.",
    });

    checks.push({
      id: "spec_alignment",
      name: "Milestone Scope & Deliverable Alignment",
      status: evidence.reachable ? "warning" : "failed",
      score: evidence.reachable ? 55 : 0,
      detail: evidence.reachable
        ? "Add GEMINI_API_KEY in backend/.env to enable full AI semantic comparison against the milestone brief."
        : "Deliverable unreachable; cannot verify milestone alignment.",
    });
  }

  // Weighted score: if spec_alignment or link_reachability failed, cap overall score!
  const reachFailed = checks.find((c) => c.id === "link_reachability")?.status === "failed";
  const specFailed = checks.find((c) => c.id === "spec_alignment")?.status === "failed";
  let totalScore = Math.round(
    checks.reduce((acc, c) => acc + c.score, 0) / checks.length
  );
  if (reachFailed) totalScore = Math.min(totalScore, 20);
  if (specFailed) totalScore = Math.min(totalScore, 35);

  let grade: VerificationAuditReport["grade"] = "C";
  let status: VerificationAuditReport["status"] = "REVIEW_RECOMMENDED";
  let recommendation: VerificationAuditReport["recommendation"] =
    "MANUAL_REVIEW_REQUIRED";

  if (totalScore >= 93) {
    grade = "A+";
    status = "PASSED";
    recommendation = "SAFE_TO_RELEASE";
  } else if (totalScore >= 85) {
    grade = "A";
    status = "PASSED";
    recommendation = "SAFE_TO_RELEASE";
  } else if (totalScore >= 75) {
    grade = "B";
    status = "PASSED";
    recommendation = "SATISFACTORY";
  } else if (totalScore >= 55) {
    grade = "C";
    status = "REVIEW_RECOMMENDED";
    recommendation = "MANUAL_REVIEW_REQUIRED";
  } else {
    grade = "F";
    status = "FAILED";
    recommendation = "MANUAL_REVIEW_REQUIRED";
  }

  const summary = specFailed
    ? `CRITICAL SCOPE MISMATCH: The inspected deliverable does not match the milestone ("${title}"). Do NOT release escrow funds without manual review.`
    : reachFailed
    ? `UNREACHABLE DELIVERABLE: ${evidence.fetchError || "Endpoint failed to respond."} Do NOT release escrow funds.`
    : `Live deliverable inspected (${totalScore}/100, Grade ${grade}). Note: GEMINI_API_KEY is not configured in backend/.env, so deep LLM semantic code auditing is inactive.`;

  return {
    milestoneId,
    deliverableUrl: rawUrl,
    deliverableType: evidence.deliverableType,
    overallScore: totalScore,
    grade,
    status,
    recommendation,
    summary,
    checks,
    metadata: {
      targetMilestone: title,
      filesInspected: gh?.totalFiles ?? (evidence.reachable ? 1 : 0),
      testsDetected: gh?.hasTestFiles ?? false,
      securityFlags: checks.filter((c) => c.status === "failed").length,
      inspectedAt: new Date().toISOString(),
      oracleSignature: `0xarc_${Date.now().toString(16)}_${Math.random()
        .toString(36)
        .substring(2, 8)}`,
      aiEngine: "live-inspector (no LLM key)",
      llmConfigured: false,
    },
  };
}

export async function inspectDeliverable(params: {
  deliverableUrl: string;
  title?: string;
  brief?: string;
  milestoneId?: number;
  forceRefresh?: boolean;
}): Promise<VerificationAuditReport> {
  const {
    deliverableUrl,
    title = "",
    brief = "",
    milestoneId,
    forceRefresh = false,
  } = params;
  const rawUrl = (deliverableUrl || "").trim();

  const cacheKey = `${rawUrl}::${title.trim()}::${brief.trim()}`;
  const now = Date.now();
  if (!forceRefresh) {
    const cached = auditCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return {
        ...cached.report,
        milestoneId: milestoneId ?? cached.report.milestoneId,
      };
    }
  }

  // 1. Fetch live real evidence from GitHub / Web / IPFS
  const evidence = await fetchDeliverableEvidence(rawUrl);

  // 2. If Groq / Cerebras / OpenRouter / Gemini is configured, run LLM semantic audit
  const llmResult = await callGeminiAudit({
    title,
    brief,
    evidence,
  });

  const report: VerificationAuditReport = llmResult
    ? {
        milestoneId,
        deliverableUrl: rawUrl,
        deliverableType: evidence.deliverableType,
        overallScore: llmResult.overallScore,
        grade: llmResult.grade,
        status: llmResult.status,
        recommendation: llmResult.recommendation,
        summary: llmResult.summary,
        checks: llmResult.checks,
        metadata: {
          targetMilestone: title,
          filesInspected:
            evidence.github?.totalFiles ?? (evidence.reachable ? 1 : 0),
          testsDetected: evidence.github?.hasTestFiles ?? false,
          securityFlags: llmResult.checks.filter((c) => c.status === "failed")
            .length,
          inspectedAt: new Date().toISOString(),
          oracleSignature: `0xarc_${Date.now().toString(16)}_${Math.random()
            .toString(36)
            .substring(2, 8)}`,
          aiEngine: llmResult.modelUsed,
          llmConfigured: true,
        },
      }
    : buildEvidenceBasedFallbackReport({
        rawUrl,
        title,
        brief,
        evidence,
        milestoneId,
      });

  if (auditCache.size >= MAX_AUDIT_CACHE_ENTRIES) {
    const oldestKey = auditCache.keys().next().value;
    if (oldestKey) auditCache.delete(oldestKey);
  }
  auditCache.set(cacheKey, {
    report,
    expiresAt: now + AUDIT_CACHE_TTL_MS,
  });

  return report;
}
