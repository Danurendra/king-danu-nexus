from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langgraph.types import Command

from .orchestration import graph


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="DinusNexus API",
    version="0.1.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class StartIncidentRequest(BaseModel):

    incident_id: str = "INC-001"

    title: str = "Wi-Fi Degradation"

    building: str = "Building A"

    floor: int = 3

    device: str = "AP-03"

    user_request: str = (
        "Wi-Fi users in Building A Floor 3 "
        "report severe connectivity problems. "
        "Investigate the incident, identify the "
        "most likely root cause, and recommend "
        "a safe diagnostic action."
    )


class ApprovalRequest(BaseModel):

    approved: bool


# ============================================================
# CONFIG
# ============================================================

def graph_config(incident_id: str):
    return {
        "configurable": {
            "thread_id": incident_id,
        }
    }


# ============================================================
# SERIALIZER
# ============================================================

def serialize_result(
    result: dict[str, Any],
    incident_id: str,
):

    interrupt_data = result.get(
        "__interrupt__"
    )

    # Human approval required
    if interrupt_data:

        interrupt_value = (
            interrupt_data[0].value
        )

        return {
            "incident_id": incident_id,
            "status": "waiting_approval",
            "approval_required": True,
            "approval": interrupt_value,
            "root_cause": result.get(
                "root_cause"
            ),
            "confidence": result.get(
                "confidence"
            ),
            "recommendation": result.get(
                "recommendation"
            ),
            "evidence": result.get(
                "evidence",
                [],
            ),
        }

    # Normal completed state
    return {
        "incident_id": incident_id,
        "status": result.get(
            "status",
            "unknown",
        ),
        "approval_required": False,
        "root_cause": result.get(
            "root_cause"
        ),
        "confidence": result.get(
            "confidence"
        ),
        "recommendation": result.get(
            "recommendation"
        ),
        "evidence": result.get(
            "evidence",
            [],
        ),
        "action_result": result.get(
            "action_result"
        ),
        "verification": result.get(
            "verification"
        ),
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "service": "dinusnexus-api",
    }


# ============================================================
# START INVESTIGATION
# ============================================================

@app.post("/api/incidents/start")
def start_incident(
    request: StartIncidentRequest,
):

    initial_state = {
        "incident_id": request.incident_id,
        "title": request.title,
        "building": request.building,
        "floor": request.floor,
        "device": request.device,

        "status": "investigating",

        "messages": [
            {
                "role": "user",
                "content": request.user_request,
            }
        ],
    }

    config = graph_config(
        request.incident_id
    )

    result = graph.invoke(
        initial_state,
        config=config,
    )

    return serialize_result(
        result,
        request.incident_id,
    )


# ============================================================
# HUMAN APPROVAL
# ============================================================

@app.post(
    "/api/incidents/{incident_id}/approve"
)
def approve_incident(
    incident_id: str,
    request: ApprovalRequest,
):

    config = graph_config(
        incident_id
    )

    result = graph.invoke(
        Command(
            resume={
                "approved": request.approved
            }
        ),
        config=config,
    )

    return serialize_result(
        result,
        incident_id,
    )


# ============================================================
# CURRENT STATE
# ============================================================

@app.get(
    "/api/incidents/{incident_id}"
)
def get_incident(
    incident_id: str,
):

    config = graph_config(
        incident_id
    )

    snapshot = graph.get_state(
        config
    )

    return serialize_result(
        snapshot.values,
        incident_id,
    )