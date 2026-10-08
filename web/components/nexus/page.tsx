import Link from "next/link";

import {
  ArrowLeft,
  Bot,
  Network,
  ShieldCheck,
  Wifi,
} from "lucide-react";

import NexusGraph from "@/components/nexus/nexus-graph";

export default function NexusPage() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8">

        <header className="flex items-center justify-between border-b border-white/[0.07] pb-6">
          <div className="flex items-center gap-4">

            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-300" />

                <h1 className="text-xl font-semibold">
                  Nexus Graph
                </h1>
              </div>

              <p className="mt-1 text-xs text-white/35">
                Connected campus operational ecosystem
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Status
              icon={<Wifi className="h-3 w-3" />}
              text="Network"
            />

            <Status
              icon={<ShieldCheck className="h-3 w-3" />}
              text="Security"
            />

            <Status
              icon={<Bot className="h-3 w-3" />}
              text="AI Agent"
            />
          </div>
        </header>

        <section className="py-6">
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/25">
              Operational topology
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              One campus. Connected intelligence.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
              DinusNexus correlates signals from network,
              security, physical devices, and human operators
              into a single operational context.
            </p>
          </div>

          <NexusGraph />
        </section>
      </div>
    </main>
  );
}

function Status({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/45">
      <span className="text-emerald-300">
        {icon}
      </span>

      {text}
    </div>
  );
}