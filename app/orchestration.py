import os
from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.types import Command, interrupt

from .tools import (
    check_access_point,
    check_authentication,
    check_dhcp,
    check_network,
    check_switch,
    run_diagnostic,
    verify_network,
)


# ============================================================
# CONFIG
# ============================================================

MODEL = os.getenv(
    "DINUSNEXUS_MODEL",
    "gpt-5.4-nano",
)

if not os.getenv("OPENAI_API_KEY"):
    raise RuntimeError(
        "OPENAI_API_KEY belum tersedia."
    )


# ChatOpenAI dapat menggunakan OpenAI Responses API.
# Kita gunakan low reasoning untuk menghemat biaya.
llm = ChatOpenAI(
    model=MODEL,
    use_responses_api=True,
    reasoning={
        "effort": "low",
    },
)


# ============================================================
# STATE
# ============================================================

class DinusNexusState(TypedDict, total=False):

    # Conversation / agent messages
    messages: Annotated[
        list[BaseMessage],
        add_messages,
    ]

    # Incident information
    incident_id: str
    title: str
    building: str
    floor: int
    device: str

    # Investigation
    evidence: list[dict]
    root_cause: str
    confidence: float
    recommendation: str

    # Human / action
    approval: str
    action_result: dict
    verification: dict

    # Current phase
    status: str


# ============================================================
# TOOLS
# ============================================================

@tool
def network_tool():
    """Check network packet loss and latency."""
    return check_network()


@tool
def access_point_tool():
    """Check campus Wi-Fi access point status."""
    return check_access_point()


@tool
def dhcp_tool():
    """Check DHCP service health."""
    return check_dhcp()


@tool
def authentication_tool():
    """Check campus authentication service."""
    return check_authentication()


@tool
def switch_tool():
    """Check switch uplink condition."""
    return check_switch()


tools = [
    network_tool,
    access_point_tool,
    dhcp_tool,
    authentication_tool,
    switch_tool,
]


# Model receives these tools.
llm_with_tools = llm.bind_tools(tools)

# LangGraph executes them.
tool_node = ToolNode(tools)


# ============================================================
# NODE 1 — INVESTIGATE
# ============================================================

def investigate_node(
    state: DinusNexusState,
):
    """
    Ask the LLM what should be investigated.
    The LLM can call one or more tools.
    """

    messages = state.get("messages", [])

    system = SystemMessage(
        content="""
You are DinusNexus.

You are investigating a campus IT incident.

Rules:
- Use diagnostic tools before making conclusions.
- Never invent telemetry.
- Investigate relevant infrastructure.
- Compare evidence.
- Do not claim the incident is resolved.
- After enough evidence is collected, provide a concise analysis.
"""
    )

    response = llm_with_tools.invoke(
        [system, *messages]
    )

    print("\n[AGENT]")
    print("LLM responded.")

    if response.tool_calls:
        for call in response.tool_calls:
            print(
                f"  → requesting tool: {call['name']}"
            )

    return {
        "messages": [response],
        "status": "investigating",
    }


# ============================================================
# ROUTER — AGENT → TOOLS OR ANALYSIS
# ============================================================

def route_after_investigation(
    state: DinusNexusState,
):
    """
    If the LLM requested tools,
    execute tools.

    Otherwise move to analysis.
    """

    messages = state.get("messages", [])

    if not messages:
        return "analysis"

    last_message = messages[-1]

    if getattr(last_message, "tool_calls", None):
        return "tools"

    return "analysis"


# ============================================================
# NODE 2 — ANALYSIS
# ============================================================

def analysis_node(
    state: DinusNexusState,
):
    """
    Convert collected evidence into
    a normalized incident state.

    For tonight we intentionally use
    deterministic analysis for critical fields.
    """

    messages = state.get("messages", [])

    evidence = []

    for message in messages:

        # ToolMessage
        if getattr(message, "type", None) == "tool":

            content = message.content

            evidence.append(
                {
                    "tool": getattr(
                        message,
                        "name",
                        "unknown",
                    ),
                    "result": content,
                }
            )

    # --------------------------------------------------------
    # Deterministic interpretation
    # --------------------------------------------------------

    root_cause = "Unknown"
    confidence = 0.20
    recommendation = (
        "Continue investigation."
    )

    has_bad_network = False
    has_bad_uplink = False

    for item in evidence:

        result = item["result"]

        if "packet_loss" in result:
            if "42" in result:
                has_bad_network = True

        if "unstable" in result:
            has_bad_uplink = True

    if has_bad_network and has_bad_uplink:

        root_cause = "Uplink Degradation"
        confidence = 0.91

        recommendation = (
            "Run network diagnostic on the "
            "affected uplink."
        )

    print("\n[ANALYSIS]")
    print(f"Root cause: {root_cause}")
    print(f"Confidence: {confidence}")

    return {
        "evidence": evidence,
        "root_cause": root_cause,
        "confidence": confidence,
        "recommendation": recommendation,
        "status": "waiting_approval",
    }


# ============================================================
# NODE 3 — HUMAN APPROVAL
# ============================================================

def approval_node(
    state: DinusNexusState,
):
    """
    Pause the graph and ask a human
    whether the action should proceed.
    """

    decision = interrupt(
        {
            "type": "approval_request",
            "incident_id": state["incident_id"],
            "action": state["recommendation"],
            "root_cause": state["root_cause"],
            "confidence": state["confidence"],
        }
    )

    approved = bool(
        decision.get("approved", False)
        if isinstance(decision, dict)
        else decision
    )

    print(
        "\n[HUMAN APPROVAL]",
        "APPROVED" if approved else "REJECTED",
    )

    return {
        "approval": (
            "approved"
            if approved
            else "rejected"
        ),
        "status": (
            "approved"
            if approved
            else "rejected"
        ),
    }


# ============================================================
# ROUTER — APPROVAL
# ============================================================

def route_after_approval(
    state: DinusNexusState,
):
    if state.get("approval") == "approved":
        return "action"

    return END


# ============================================================
# NODE 4 — ACTION
# ============================================================

def action_node(
    state: DinusNexusState,
):
    """
    Execute a safe simulated diagnostic.
    """

    print("\n[ACTION]")
    print("Running network diagnostic...")

    result = run_diagnostic()

    print(result)

    return {
        "action_result": result,
        "status": "verifying",
    }


# ============================================================
# NODE 5 — VERIFICATION
# ============================================================

def verification_node(
    state: DinusNexusState,
):
    """
    Check whether the action actually worked.
    """

    print("\n[VERIFICATION]")

    result = verify_network()

    print(result)

    if result.get("healthy"):
        status = "resolved"
    else:
        status = "investigating"

    return {
        "verification": result,
        "status": status,
    }


# ============================================================
# GRAPH
# ============================================================

builder = StateGraph(DinusNexusState)


builder.add_node(
    "investigate",
    investigate_node,
)

builder.add_node(
    "tools",
    tool_node,
)

builder.add_node(
    "analysis",
    analysis_node,
)

builder.add_node(
    "approval",
    approval_node,
)

builder.add_node(
    "action",
    action_node,
)

builder.add_node(
    "verification",
    verification_node,
)


# START
builder.add_edge(
    START,
    "investigate",
)


# Agent chooses tools or analysis
builder.add_conditional_edges(
    "investigate",
    route_after_investigation,
    {
        "tools": "tools",
        "analysis": "analysis",
    },
)


# Tool results go back to agent
builder.add_edge(
    "tools",
    "investigate",
)


# Analysis → approval
builder.add_edge(
    "analysis",
    "approval",
)


# Approval → action OR END
builder.add_conditional_edges(
    "approval",
    route_after_approval,
    {
        "action": "action",
        END: END,
    },
)


# Action → verification
builder.add_edge(
    "action",
    "verification",
)


# Verification → end
builder.add_edge(
    "verification",
    END,
)


# ============================================================
# CHECKPOINTER
# ============================================================

checkpointer = InMemorySaver()


graph = builder.compile(
    checkpointer=checkpointer
)


# ============================================================
# DEMO
# ============================================================

def main():

    config = {
        "configurable": {
            "thread_id": "INC-001",
        }
    }

    initial_state = {
        "incident_id": "INC-001",
        "title": "Wi-Fi Degradation",
        "building": "Building A",
        "floor": 3,
        "device": "AP-03",
        "messages": [
            {
                "role": "user",
                "content": """
Wi-Fi users in Building A Floor 3
report severe connectivity problems.

Investigate the incident.
Find the most likely root cause.
Recommend a safe diagnostic action.
Do not claim the issue is resolved
until verification is complete.
""",
            }
        ],
        "status": "investigating",
    }

    print("=" * 60)
    print("DINUSNEXUS ORCHESTRATOR")
    print("=" * 60)

    result = graph.invoke(
        initial_state,
        config=config,
    )

    # --------------------------------------------------------
    # INTERRUPTED
    # --------------------------------------------------------

    if "__interrupt__" in result:

        print("\n")
        print("=" * 60)
        print("HUMAN APPROVAL REQUIRED")
        print("=" * 60)

        interrupt_data = result[
            "__interrupt__"
        ]

        print(interrupt_data)

        answer = input(
            "\nApprove action? [y/N]: "
        )

        approved = (
            answer.lower() == "y"
        )

        result = graph.invoke(
            Command(
                resume={
                    "approved": approved,
                }
            ),
            config=config,
        )

    print("\n")
    print("=" * 60)
    print("FINAL STATE")
    print("=" * 60)

    print(
        "Status:",
        result.get("status"),
    )

    print(
        "Root Cause:",
        result.get("root_cause"),
    )

    print(
        "Confidence:",
        result.get("confidence"),
    )

    print(
        "Recommendation:",
        result.get("recommendation"),
    )

    print(
        "Verification:",
        result.get("verification"),
    )


if __name__ == "__main__":
    main()