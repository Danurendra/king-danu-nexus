import json
import os
from dataclasses import dataclass, field
from typing import Any

from openai import OpenAI

from tools import (
    check_network,
    check_access_point,
    check_dhcp,
    check_authentication,
    check_switch,
    run_diagnostic,
    verify_network,
)


# ============================================================
# CONFIG
# ============================================================

API_KEY = os.getenv("OPENAI_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "OPENAI_API_KEY belum tersedia."
    )

MODEL = os.getenv(
    "DINUSNEXUS_MODEL",
    "gpt-5.4-nano"
)

client = OpenAI(api_key=API_KEY)


# ============================================================
# INCIDENT STATE
# ============================================================

@dataclass
class IncidentState:

    incident_id: str

    title: str

    status: str = "investigating"

    evidence: list[dict[str, Any]] = field(
        default_factory=list
    )

    hypotheses: list[dict[str, Any]] = field(
        default_factory=list
    )

    root_cause: str | None = None

    confidence: float = 0.0

    recommended_action: str | None = None

    action_result: dict[str, Any] | None = None

    verification: dict[str, Any] | None = None


# ============================================================
# TOOL REGISTRY
# ============================================================

TOOLS = {
    "check_network": check_network,
    "check_access_point": check_access_point,
    "check_dhcp": check_dhcp,
    "check_authentication": check_authentication,
    "check_switch": check_switch,
}


# ============================================================
# OPENAI TOOL DEFINITIONS
# ============================================================

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "name": "check_network",
        "description":
            "Check network packet loss and latency.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "check_access_point",
        "description":
            "Check access point status.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "check_dhcp",
        "description":
            "Check DHCP service status.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "check_authentication",
        "description":
            "Check authentication service status.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "check_switch",
        "description":
            "Check switch uplink condition.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False,
        },
        "strict": True,
    },
]


# ============================================================
# TOOL CALLER
# ============================================================

def call_tool(name: str, arguments: dict):

    tool = TOOLS.get(name)

    if tool is None:
        return {
            "error": f"Unknown tool: {name}"
        }

    try:
        return tool(**arguments)

    except Exception as exc:
        return {
            "error": str(exc)
        }


# ============================================================
# AI INVESTIGATION
# ============================================================

def investigate(
    incident: IncidentState,
    user_request: str
):

    print("\n=== AI INVESTIGATION ===")

    response = client.responses.create(
        model=MODEL,

        instructions="""
You are DinusNexus.

You investigate campus IT incidents.

Rules:
- Use tools before deciding.
- Never invent evidence.
- Compare possible causes.
- Identify the most likely root cause.
- Give confidence between 0 and 1.
- Recommend an action.
- Do not claim resolution without verification.
""",

        input=user_request,

        tools=TOOL_DEFINITIONS,

        reasoning={
            "effort": "low"
        },

        max_output_tokens=400,
    )

    max_rounds = 5

    for _ in range(max_rounds):

        function_calls = [
            item
            for item in response.output
            if item.type == "function_call"
        ]

        if not function_calls:
            return response.output_text

        tool_outputs = []

        for item in function_calls:

            print(
                f"Calling tool: {item.name}"
            )

            arguments = json.loads(
                item.arguments
            )

            result = call_tool(
                item.name,
                arguments
            )

            print(
                f"Result: {result}"
            )

            incident.evidence.append(
                result
            )

            tool_outputs.append(
                {
                    "type": "function_call_output",
                    "call_id": item.call_id,
                    "output": json.dumps(result),
                }
            )

        response = client.responses.create(
            model=MODEL,
            instructions="""
Continue investigating the incident.

Based on the evidence collected:

1. Identify the most likely root cause.
2. Give confidence from 0 to 1.
3. Explain briefly.
4. Recommend the safest next action.
5. Do NOT claim the incident is resolved.
""",
            input=[
                *response.output,
                *tool_outputs,
            ],
            tools=TOOL_DEFINITIONS,
            reasoning={
                "effort": "low"
            },
            max_output_tokens=400,
        )

    return "Investigation stopped."


# ============================================================
# HUMAN APPROVAL
# ============================================================

def request_human_approval(
    incident: IncidentState
) -> bool:

    print("\n=== HUMAN APPROVAL ===")

    print(
        "DinusNexus recommends a diagnostic action."
    )

    print(
        "Action:",
        incident.recommended_action
    )

    answer = input(
        "\nApprove action? [y/N]: "
    )

    return answer.lower() == "y"


# ============================================================
# ACTION
# ============================================================

def execute_action(
    incident: IncidentState
):

    print("\n=== ACTION ===")

    result = run_diagnostic()

    incident.action_result = result

    print(result)


# ============================================================
# VERIFICATION
# ============================================================

def verify(
    incident: IncidentState
):

    print("\n=== VERIFICATION ===")

    result = verify_network()

    incident.verification = result

    print(result)

    if result["healthy"]:
        incident.status = "resolved"
    else:
        incident.status = "investigating"


# ============================================================
# MAIN
# ============================================================

def main():

    incident = IncidentState(
        incident_id="INC-001",
        title="Wi-Fi Building A Floor 3"
    )

    request = """
Wi-Fi users in Building A Floor 3
report severe connectivity problems.

Investigate the issue using available tools.
Find the most likely root cause.
Recommend the next action.
"""

    analysis = investigate(
        incident,
        request
    )

    print("\n=== AI ANALYSIS ===")
    print(analysis)

    # Untuk prototype malam ini,
    # action recommendation kita mapping dari evidence.
    if any(
        evidence.get("source") == "switch"
        and evidence.get("uplink") == "unstable"
        for evidence in incident.evidence
    ):
        incident.root_cause = "Uplink Degradation"

        incident.confidence = 0.91

        incident.recommended_action = (
            "Run network diagnostic"
        )

    print("\nRoot Cause:")
    print(incident.root_cause)

    print("\nConfidence:")
    print(incident.confidence)

    # --------------------------------------------------------
    # HUMAN APPROVAL
    # --------------------------------------------------------

    approved = request_human_approval(
        incident
    )

    if not approved:

        print(
            "\nAction rejected by human."
        )

        incident.status = "waiting_approval"

        print(
            "STATUS:",
            incident.status
        )

        return

    # --------------------------------------------------------
    # ACTION
    # --------------------------------------------------------

    execute_action(
        incident
    )

    # --------------------------------------------------------
    # VERIFICATION
    # --------------------------------------------------------

    verify(
        incident
    )

    print("\n=== FINAL STATE ===")

    print(
        "Incident:",
        incident.incident_id
    )

    print(
        "Status:",
        incident.status
    )

    print(
        "Root cause:",
        incident.root_cause
    )

    print(
        "Verification:",
        incident.verification
    )


if __name__ == "__main__":
    main()