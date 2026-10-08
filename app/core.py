def create_event():
    return {
        "building": "A",
        "floor": 3,
        "device": "AP-03",
        "packet_loss": 42,
    }


def create_incident(event):
    return {
        "id": "INC-001",
        "status": "investigating",
        "event": event,
        "evidence": [],
        "hypotheses": [],
        "action": None,
        "verification": None,
    }


def collect_evidence(incident):
    incident["evidence"] = [
        {"source": "AP", "status": "online"},
        {"source": "DHCP", "status": "normal"},
        {"source": "Authentication", "status": "normal"},
        {"source": "Switch", "uplink": "unstable"},
    ]

    return incident


def analyze(incident):
    packet_loss = incident["event"]["packet_loss"]

    if packet_loss > 30:
        incident["hypotheses"] = [
            {"name": "AP Failure", "confidence": 0.10},
            {"name": "DHCP Failure", "confidence": 0.05},
            {"name": "Authentication Failure", "confidence": 0.05},
            {"name": "Uplink Degradation", "confidence": 0.80},
        ]

    return incident


def select_action(incident):
    best = max(
        incident["hypotheses"],
        key=lambda x: x["confidence"]
    )

    incident["action"] = {
        "type": "network_diagnostic",
        "reason": best["name"],
    }

    return incident


def verify(incident):
    incident["verification"] = {
        "before_packet_loss": 42,
        "after_packet_loss": 1.2,
        "success": True,
    }

    if incident["verification"]["success"]:
        incident["status"] = "resolved"

    return incident


def main():
    event = create_event()
    print("\nEVENT")
    print(event)

    incident = create_incident(event)

    incident = collect_evidence(incident)

    print("\nEVIDENCE")
    for evidence in incident["evidence"]:
        print(evidence)

    incident = analyze(incident)

    print("\nHYPOTHESES")
    for hypothesis in incident["hypotheses"]:
        print(hypothesis)

    incident = select_action(incident)

    print("\nACTION")
    print(incident["action"])

    incident = verify(incident)

    print("\nVERIFICATION")
    print(incident["verification"])

    print("\nFINAL STATUS")
    print(incident["status"])


if __name__ == "__main__":
    main()