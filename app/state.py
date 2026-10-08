from dataclasses import dataclass, field
from typing import Any


@dataclass
class IncidentState:
    incident_id: str
    title: str
    building: str
    floor: int
    device: str

    status: str = "investigating"

    evidence: list[dict[str, Any]] = field(
        default_factory=list
    )

    root_cause: str | None = None

    confidence: float = 0.0

    recommendation: str | None = None

    approved: bool = False

    action_result: dict[str, Any] | None = None

    verification: dict[str, Any] | None = None