"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  Bot,
  Cpu,
  Globe,
  Router,
  Server,
  Shield,
  Wifi,
  Zap,
} from "lucide-react";

type NexusNodeData = {
  label: string;
  subtitle?: string;
  icon: string;
  status: "healthy" | "warning" | "critical" | "ai";
};

type NexusNode = Node<NexusNodeData, "nexus">;

const initialNodes: NexusNode[] = [
  {
    id: "nexus",
    type: "nexus",
    position: { x: 500, y: 40 },
    data: {
      label: "DinusNexus",
      subtitle: "Operational Intelligence Layer",
      icon: "nexus",
      status: "ai",
    },
  },

  // NETWORK
  {
    id: "network",
    type: "nexus",
    position: { x: 80, y: 220 },
    data: {
      label: "Network",
      subtitle: "Campus Connectivity",
      icon: "network",
      status: "healthy",
    },
  },

  {
    id: "router",
    type: "nexus",
    position: { x: -20, y: 400 },
    data: {
      label: "Router",
      subtitle: "Gateway",
      icon: "router",
      status: "healthy",
    },
  },

  {
    id: "switch",
    type: "nexus",
    position: { x: 150, y: 400 },
    data: {
      label: "Switch",
      subtitle: "Uplink unstable",
      icon: "server",
      status: "warning",
    },
  },

  {
    id: "ap",
    type: "nexus",
    position: { x: 320, y: 400 },
    data: {
      label: "AP-03",
      subtitle: "Wi-Fi Access Point",
      icon: "wifi",
      status: "healthy",
    },
  },

  // SECURITY
  {
    id: "security",
    type: "nexus",
    position: { x: 500, y: 220 },
    data: {
      label: "Security",
      subtitle: "Threat Monitoring",
      icon: "security",
      status: "healthy",
    },
  },

  {
    id: "wazuh",
    type: "nexus",
    position: { x: 480, y: 400 },
    data: {
      label: "Wazuh",
      subtitle: "SIEM / XDR",
      icon: "security",
      status: "healthy",
    },
  },

  {
    id: "suricata",
    type: "nexus",
    position: { x: 650, y: 400 },
    data: {
      label: "Suricata",
      subtitle: "Network IDS",
      icon: "shield",
      status: "healthy",
    },
  },

  // IOT
  {
    id: "iot",
    type: "nexus",
    position: { x: 920, y: 220 },
    data: {
      label: "IoT",
      subtitle: "Physical Telemetry",
      icon: "iot",
      status: "healthy",
    },
  },

  {
    id: "esp32",
    type: "nexus",
    position: { x: 820, y: 400 },
    data: {
      label: "ESP32",
      subtitle: "Room 301 Node",
      icon: "iot",
      status: "healthy",
    },
  },

  {
    id: "sensor",
    type: "nexus",
    position: { x: 990, y: 400 },
    data: {
      label: "Sensors",
      subtitle: "Temperature / Occupancy",
      icon: "sensor",
      status: "healthy",
    },
  },

  // CORE
  {
    id: "evidence",
    type: "nexus",
    position: { x: 480, y: 600 },
    data: {
      label: "Evidence",
      subtitle: "Correlated Campus Data",
      icon: "evidence",
      status: "ai",
    },
  },

  {
    id: "agent",
    type: "nexus",
    position: { x: 480, y: 780 },
    data: {
      label: "AI Agent",
      subtitle: "Investigate · Decide · Verify",
      icon: "agent",
      status: "ai",
    },
  },

  {
    id: "human",
    type: "nexus",
    position: { x: 480, y: 960 },
    data: {
      label: "Human Worker",
      subtitle: "Decision & Accountability",
      icon: "human",
      status: "ai",
    },
  },
];

const initialEdges: Edge[] = [
  // Nexus -> domains
  edge("nexus-network", "nexus", "network"),
  edge("nexus-security", "nexus", "security"),
  edge("nexus-iot", "nexus", "iot"),

  // Network
  edge("network-router", "network", "router"),
  edge("network-switch", "network", "switch"),
  edge("network-ap", "network", "ap"),

  // Security
  edge("security-wazuh", "security", "wazuh"),
  edge("security-suricata", "security", "suricata"),

  // IoT
  edge("iot-esp32", "iot", "esp32"),
  edge("iot-sensor", "iot", "sensor"),

  // sources -> evidence
  edge("switch-evidence", "switch", "evidence"),
  edge("wazuh-evidence", "wazuh", "evidence"),
  edge("suricata-evidence", "suricata", "evidence"),
  edge("esp32-evidence", "esp32", "evidence"),
  edge("sensor-evidence", "sensor", "evidence"),
  edge("ap-evidence", "ap", "evidence"),

  // core
  edge("evidence-agent", "evidence", "agent"),
  edge("agent-human", "agent", "human"),
];

function edge(id: string, source: string, target: string): Edge {
  return {
    id,
    source,
    target,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  };
}

function NexusNodeComponent({
  data,
}: NodeProps<NexusNode>) {
  const statusClass = {
    healthy:
      "border-emerald-400/20 bg-emerald-400/[0.06]",
    warning:
      "border-amber-400/30 bg-amber-400/[0.08]",
    critical:
      "border-red-400/30 bg-red-400/[0.08]",
    ai:
      "border-blue-400/25 bg-blue-400/[0.07]",
  }[data.status];

  const dotClass = {
    healthy: "bg-emerald-400",
    warning: "bg-amber-400",
    critical: "bg-red-400",
    ai: "bg-blue-400",
  }[data.status];

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!border-0 !bg-transparent"
      />

      <div
        className={`min-w-[180px] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${statusClass}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20">
            <NodeIcon icon={data.icon} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-white">
                {data.label}
              </span>

              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
              />
            </div>

            <div className="mt-1 truncate text-[10px] text-white/35">
              {data.subtitle}
            </div>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!border-0 !bg-transparent"
      />
    </>
  );
}

function NodeIcon({ icon }: { icon: string }) {
  const className = "h-4 w-4 text-white/70";

  switch (icon) {
    case "nexus":
      return <Zap className={className} />;

    case "network":
      return <Globe className={className} />;

    case "router":
      return <Router className={className} />;

    case "server":
      return <Server className={className} />;

    case "wifi":
      return <Wifi className={className} />;

    case "security":
      return <Shield className={className} />;

    case "shield":
      return <Shield className={className} />;

    case "iot":
      return <Cpu className={className} />;

    case "sensor":
      return <Cpu className={className} />;

    case "evidence":
      return <ActivityIcon />;
    
    case "agent":
      return <Bot className={className} />;

    case "human":
      return <div className="text-sm">👤</div>;

    default:
      return <Server className={className} />;
  }
}

function ActivityIcon() {
  return (
    <div className="flex items-center gap-0.5">
      <span className="h-2 w-1 rounded-full bg-white/50" />
      <span className="h-4 w-1 rounded-full bg-white/70" />
      <span className="h-3 w-1 rounded-full bg-white/50" />
    </div>
  );
}

const nodeTypes = {
  nexus: NexusNodeComponent,
};

export default function NexusGraph() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  return (
    <div className="h-full min-h-[760px] w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#070a0f]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{
          padding: 0.18,
        }}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.08)"
        />

        <Controls />

        <MiniMap
          nodeColor={(node) => {
            if (node.data?.status === "warning") {
              return "#f59e0b";
            }

            if (node.data?.status === "critical") {
              return "#ef4444";
            }

            if (node.data?.status === "ai") {
              return "#60a5fa";
            }

            return "#10b981";
          }}
        />

        <Panel position="top-left">
          <div className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-xl">
            <div className="text-sm font-semibold">
              Campus Nexus
            </div>

            <div className="mt-1 text-[11px] text-white/35">
              Connected operational ecosystem
            </div>
          </div>
        </Panel>

        <Panel position="top-right">
          <div className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] text-emerald-300">
            ● 12 SOURCES CONNECTED
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}