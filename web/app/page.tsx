"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  LayoutDashboard,
  Network,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

import { startIncident, approveIncident } from "@/lib/api";

type EvidenceItem = {
  source: string;
  metric: string;
  value: string;
  status: "critical" | "warning" | "normal";
};

type AIResult = {
  status?: string;
  approval_required?: boolean;
  approval?: {
    approved?: boolean;
    reason?: string;
  };
  root_cause?: string;
  confidence?: number;
  recommendation?: string;
  evidence?: unknown;
  action_result?: {
    source?: string;
    status?: string;
    packet_loss?: number;
    latency?: number;
  };
  verification?: {
    source?: string;
    packet_loss?: number;
    latency?: number;
    healthy?: boolean;
  };
};

const initialEvidence: EvidenceItem[] = [
  {
    source: "Network",
    metric: "Packet Loss",
    value: "—",
    status: "normal",
  },
  {
    source: "Network",
    metric: "Latency",
    value: "—",
    status: "normal",
  },
  {
    source: "Access Point",
    metric: "Status",
    value: "—",
    status: "normal",
  },
  {
    source: "DHCP",
    metric: "Status",
    value: "—",
    status: "normal",
  },
  {
    source: "Authentication",
    metric: "Status",
    value: "—",
    status: "normal",
  },
  {
    source: "Switch",
    metric: "Uplink",
    value: "—",
    status: "normal",
  },
];

function normalizeEvidence(raw: unknown): EvidenceItem[] {
  if (!Array.isArray(raw)) {
    return initialEvidence;
  }

  const result: EvidenceItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const data = item as Record<string, unknown>;

    const source =
      typeof data.source === "string"
        ? data.source
        : "Unknown";

    if ("packet_loss" in data) {
      const value = Number(data.packet_loss);

      result.push({
        source,
        metric: "Packet Loss",
        value: Number.isFinite(value) ? `${value}%` : "—",
        status:
          Number.isFinite(value) && value >= 20
            ? "critical"
            : Number.isFinite(value) && value >= 5
              ? "warning"
              : "normal",
      });
    }

    if ("latency" in data) {
      const value = Number(data.latency);

      result.push({
        source,
        metric: "Latency",
        value: Number.isFinite(value) ? `${value} ms` : "—",
        status:
          Number.isFinite(value) && value >= 150
            ? "critical"
            : Number.isFinite(value) && value >= 80
              ? "warning"
              : "normal",
      });
    }

    if ("status" in data) {
      const value = String(data.status);

      result.push({
        source,
        metric: "Status",
        value,
        status:
          value.toLowerCase() === "online" ||
          value.toLowerCase() === "normal" ||
          value.toLowerCase() === "completed"
            ? "normal"
            : "warning",
      });
    }

    if ("uplink" in data) {
      const value = String(data.uplink);

      result.push({
        source,
        metric: "Uplink",
        value,
        status:
          value.toLowerCase().includes("unstable")
            ? "critical"
            : "normal",
      });
    }
  }

  return result.length > 0 ? result : initialEvidence;
}

export default function Home() {
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = aiResult?.status ?? "idle";

  const waitingApproval =
    aiResult?.approval_required === true;

  const resolved = status === "resolved";

  const investigationStarted =
    aiResult !== null;

  const confidence =
    typeof aiResult?.confidence === "number"
      ? Math.round(aiResult.confidence * 100)
      : 0;

  const rootCause =
    aiResult?.root_cause ?? "Awaiting investigation";

  const recommendation =
    aiResult?.recommendation ??
    "Start an AI investigation to determine the recommended action.";

  const evidence = normalizeEvidence(aiResult?.evidence);

  const handleInvestigation = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await startIncident();

      setAiResult(result);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to start AI investigation. Make sure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    try {
      setApprovalLoading(true);
      setError(null);

      const result = await approveIncident(
        "INC-001",
        approved
      );

      setAiResult(result);
    } catch (err) {
      console.error(err);
      setError("Failed to submit approval.");
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.07] bg-[#080b10] lg:block">
          <div className="sticky top-0 flex h-screen flex-col p-5">
            {/* LOGO */}
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
                <Network className="h-5 w-5" />
              </div>

              <div>
                <div className="font-semibold tracking-tight">
                  DinusNexus
                </div>

                <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Operations AI
                </div>
              </div>
            </div>

            {/* NAV */}
            <nav className="mt-8 space-y-1">
              <NavItem
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Command Center"
                active
              />

              <NavItem
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Incidents"
                badge={resolved ? undefined : "1"}
              />

              <NavItem
                icon={<Bot className="h-4 w-4" />}
                label="AI Investigations"
              />

              <NavItem
                icon={<Network className="h-4 w-4" />}
                label="Nexus Graph"
              />

              <div className="my-5 border-t border-white/[0.06]" />

              <NavItem
                icon={<Wifi className="h-4 w-4" />}
                label="Network"
              />

              <NavItem
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Security"
              />

              <NavItem
                icon={<Cpu className="h-4 w-4" />}
                label="Devices"
              />

              <NavItem
                icon={<Users className="h-4 w-4" />}
                label="Identity"
              />
            </nav>

            {/* BOTTOM */}
            <div className="mt-auto">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                  <span className="text-xs font-medium text-emerald-300">
                    Nexus Online
                  </span>
                </div>

                <div className="mt-3 text-[11px] leading-5 text-white/35">
                  6 operational sources connected
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="min-w-0 flex-1">
          {/* TOP BAR */}
          <header className="flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#080b10]/80 px-5 backdrop-blur-xl lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black lg:hidden">
                <Network className="h-5 w-5" />
              </div>

              <div>
                <div className="text-sm font-medium">
                  Campus Command Center
                </div>

                <div className="hidden text-[11px] text-white/30 sm:block">
                  Thursday · 08 October 2026
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-300 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Systems Operational
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                <span className="text-xs font-medium">
                  DR
                </span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
            {/* ERROR */}
            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* HERO */}
            <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 lg:p-8">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/[0.08] blur-3xl" />

              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/35">
                  <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                  Operational Intelligence
                </div>

                <div className="mt-4 max-w-2xl">
                  <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                    Understand the campus.
                    <br />
                    Act with confidence.
                  </h1>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/40">
                    DinusNexus connects campus systems,
                    telemetry, devices, and human operators
                    into one operational intelligence layer.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleInvestigation}
                    disabled={loading || waitingApproval || resolved}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Terminal className="h-4 w-4" />

                    {loading
                      ? "Investigating..."
                      : resolved
                        ? "Investigation Complete"
                        : waitingApproval
                          ? "Awaiting Approval"
                          : "Start AI Investigation"}
                  </button>

                  <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.08]">
                    View Nexus
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* KPI */}
            <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                icon={<Activity className="h-4 w-4" />}
                label="Campus Health"
                value={resolved ? "99%" : "96%"}
                meta={
                  resolved
                    ? "+3.0% after recovery"
                    : "+2.1% today"
                }
                positive
              />

              <Metric
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Active Incidents"
                value={resolved ? "0" : "1"}
                meta={
                  resolved
                    ? "All clear"
                    : "Requires attention"
                }
              />

              <Metric
                icon={<Bot className="h-4 w-4" />}
                label="AI Investigations"
                value={investigationStarted ? "13" : "12"}
                meta={
                  resolved
                    ? "9 resolved"
                    : "8 resolved"
                }
              />

              <Metric
                icon={<Clock3 className="h-4 w-4" />}
                label="Avg. MTTR"
                value={resolved ? "6m" : "8m"}
                meta={
                  resolved
                    ? "-25% this week"
                    : "-31% this week"
                }
                positive
              />
            </section>

            {/* CONTENT */}
            <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
              {/* INCIDENT CARD */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
                {/* INCIDENT HEADER */}
                <div className="border-b border-white/[0.07] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div
                        className={`flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] ${
                          resolved
                            ? "text-emerald-300"
                            : "text-red-300"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            resolved
                              ? "bg-emerald-400"
                              : "animate-pulse bg-red-400"
                          }`}
                        />

                        Incident{" "}
                        {resolved
                          ? "Resolved"
                          : "Active"}
                      </div>

                      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                        Wi-Fi Degradation
                      </h2>

                      <p className="mt-1 text-sm text-white/35">
                        Building A · Floor 3 · AP-03
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-medium ${
                        resolved
                          ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                          : waitingApproval
                            ? "border-amber-400/15 bg-amber-400/10 text-amber-300"
                            : "border-blue-400/15 bg-blue-400/10 text-blue-300"
                      }`}
                    >
                      {resolved
                        ? "RESOLVED"
                        : waitingApproval
                          ? "APPROVAL REQUIRED"
                          : investigationStarted
                            ? "INVESTIGATING"
                            : "READY"}
                    </span>
                  </div>
                </div>

                {/* AI FINDING */}
                <div className="p-6">
                  <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Bot className="h-4 w-4" />
                        AI Investigation
                      </div>

                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Live
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto]">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-white/25">
                          Most likely root cause
                        </div>

                        <div className="mt-2 text-xl font-semibold">
                          {rootCause}
                        </div>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                          {investigationStarted
                            ? "The orchestration layer analyzed infrastructure evidence and produced the current operational finding."
                            : "Start the AI investigation to correlate infrastructure evidence and determine the most likely cause."}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 md:flex-col md:items-end md:gap-1">
                        <div className="text-[11px] text-white/25">
                          Confidence
                        </div>

                        <div className="text-3xl font-semibold">
                          {confidence}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-white transition-all duration-500"
                        style={{
                          width: `${confidence}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* EVIDENCE */}
                  <div className="mt-7">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Evidence collected
                      </div>

                      <div className="text-xs text-white/25">
                        {evidence.length} sources
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {evidence.map((item) => (
                        <div
                          key={`${item.source}-${item.metric}`}
                          className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider text-white/25">
                              {item.source}
                            </span>

                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.status === "critical"
                                  ? "bg-red-400"
                                  : item.status === "warning"
                                    ? "bg-amber-400"
                                    : "bg-emerald-400"
                              }`}
                            />
                          </div>

                          <div className="mt-3 text-xs text-white/45">
                            {item.metric}
                          </div>

                          <div className="mt-1 text-lg font-semibold">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ACTION */}
                  <div className="mt-7 rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
                        <Zap className="h-4 w-4 text-amber-300" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          Recommended action
                        </div>

                        <p className="mt-1 text-sm leading-6 text-white/40">
                          {recommendation}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {waitingApproval && (
                        <>
                          <button
                            onClick={() =>
                              handleApproval(true)
                            }
                            disabled={approvalLoading}
                            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {approvalLoading
                              ? "Executing..."
                              : "Approve Diagnostic"}
                          </button>

                          <button
                            onClick={() =>
                              handleApproval(false)
                            }
                            disabled={approvalLoading}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {resolved && (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          Verification successful
                        </div>
                      )}

                      {!waitingApproval &&
                        !resolved &&
                        investigationStarted && (
                          <div className="rounded-xl border border-blue-400/15 bg-blue-400/10 px-4 py-2.5 text-sm text-blue-300">
                            AI is processing the incident...
                          </div>
                        )}

                      {!investigationStarted && (
                        <button
                          onClick={handleInvestigation}
                          disabled={loading}
                          className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loading
                            ? "Investigating..."
                            : "Start Investigation"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* VERIFICATION */}
                  {resolved &&
                    aiResult?.verification && (
                      <div className="mt-5 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />

                          <span className="text-sm font-medium text-emerald-300">
                            Post-action verification
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <VerificationMetric
                            label="Packet Loss"
                            value={`${aiResult.verification.packet_loss ?? "—"}%`}
                          />

                          <VerificationMetric
                            label="Latency"
                            value={`${aiResult.verification.latency ?? "—"} ms`}
                          />

                          <VerificationMetric
                            label="Health"
                            value={
                              aiResult.verification.healthy
                                ? "Healthy"
                                : "Unhealthy"
                            }
                          />
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="space-y-5">
                {/* ACTIVITY */}
                <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Bot className="h-4 w-4" />
                      Agent Activity
                    </div>

                    <span className="text-[10px] uppercase tracking-wider text-emerald-300">
                      LIVE
                    </span>
                  </div>

                  <div className="mt-6 space-y-5">
                    <ActivityItem
                      text="Incident detected"
                      detail="Building A / Floor 3"
                      time="18:11:02"
                      complete={investigationStarted}
                    />

                    <ActivityItem
                      text="Network telemetry collected"
                      detail={
                        investigationStarted
                          ? "Evidence returned from network tools"
                          : "Waiting for investigation"
                      }
                      time="18:11:04"
                      complete={investigationStarted}
                    />

                    <ActivityItem
                      text="Infrastructure investigated"
                      detail={
                        investigationStarted
                          ? "AP, DHCP, Auth, Switch"
                          : "Not started"
                      }
                      time="18:11:08"
                      complete={investigationStarted}
                    />

                    <ActivityItem
                      text="Root cause identified"
                      detail={
                        investigationStarted
                          ? `${rootCause} · ${confidence}%`
                          : "Waiting for AI"
                      }
                      time="18:11:10"
                      complete={
                        investigationStarted &&
                        Boolean(aiResult?.root_cause)
                      }
                    />

                    <ActivityItem
                      text={
                        resolved
                          ? "Human approval granted"
                          : "Human approval"
                      }
                      detail={
                        resolved
                          ? "Diagnostic approved and executed"
                          : waitingApproval
                            ? "Waiting for operator"
                            : "Not required yet"
                      }
                      time="18:11:12"
                      complete={resolved}
                    />

                    {resolved && (
                      <ActivityItem
                        text="Verification successful"
                        detail="Network health restored"
                        time="18:11:18"
                        complete
                      />
                    )}
                  </div>
                </div>

                {/* CONNECTIVITY */}
                <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      Nexus Sources
                    </div>

                    <Network className="h-4 w-4 text-white/25" />
                  </div>

                  <div className="mt-5 space-y-3">
                    <Source
                      icon={<Network className="h-3.5 w-3.5" />}
                      name="Campus Network"
                      status="Connected"
                    />

                    <Source
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      name="Security"
                      status="Connected"
                    />

                    <Source
                      icon={<Server className="h-3.5 w-3.5" />}
                      name="Infrastructure"
                      status="Connected"
                    />

                    <Source
                      icon={<Cpu className="h-3.5 w-3.5" />}
                      name="IoT Devices"
                      status="Connected"
                    />
                  </div>
                </div>

                {/* MINI CTA */}
                <div className="rounded-3xl border border-blue-400/10 bg-blue-400/[0.035] p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10">
                    <Sparkles className="h-5 w-5 text-blue-300" />
                  </div>

                  <div className="mt-4 text-sm font-medium">
                    Ask DinusNexus
                  </div>

                  <p className="mt-2 text-xs leading-5 text-white/35">
                    Investigate incidents, query campus
                    infrastructure, or explain anomalies.
                  </p>

                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs text-white/60 transition hover:bg-white/[0.08]">
                    Open AI Console
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-white/[0.08] text-white"
          : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>

      {badge && (
        <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-[10px] text-red-300">
          {badge}
        </span>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  meta,
  positive = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  meta: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="flex items-center gap-2 text-white/35">
        {icon}

        <span className="text-xs">{label}</span>
      </div>

      <div className="mt-3 text-3xl font-semibold tracking-tight">
        {value}
      </div>

      <div
        className={`mt-1 text-xs ${
          positive
            ? "text-emerald-300/80"
            : "text-white/25"
        }`}
      >
        {meta}
      </div>
    </div>
  );
}

function Source({
  icon,
  name,
  status,
}: {
  icon: React.ReactNode;
  name: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="text-white/30">{icon}</div>

        <span className="text-xs text-white/55">
          {name}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {status}
      </div>
    </div>
  );
}

function ActivityItem({
  text,
  detail,
  time,
  complete,
}: {
  text: string;
  detail: string;
  time: string;
  complete: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
            complete
              ? "border-emerald-400/20 bg-emerald-400/10"
              : "border-amber-400/20 bg-amber-400/10"
          }`}
        >
          {complete ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-300" />
          ) : (
            <Clock3 className="h-3 w-3 text-amber-300" />
          )}
        </div>
      </div>

      <div className="min-w-0 pb-1">
        <div className="text-xs font-medium text-white/70">
          {text}
        </div>

        <div className="mt-1 text-[11px] text-white/30">
          {detail}
        </div>

        <div className="mt-1 text-[10px] text-white/20">
          {time}
        </div>
      </div>
    </div>
  );
}

function VerificationMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/25">
        {label}
      </div>

      <div className="mt-1 text-lg font-semibold">
        {value}
      </div>
    </div>
  );
}