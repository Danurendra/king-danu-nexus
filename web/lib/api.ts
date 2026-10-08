const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function startIncident() {
  const response = await fetch(
    `${API_URL}/api/incidents/start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incident_id: "INC-001",
        title: "Wi-Fi Degradation",
        building: "Building A",
        floor: 3,
        device: "AP-03",
        user_request:
          "Wi-Fi users in Building A Floor 3 report severe connectivity problems. Investigate the incident.",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to start investigation: ${response.status}`
    );
  }

  return response.json();
}

export async function approveIncident(
  incidentId: string,
  approved: boolean
) {
  const response = await fetch(
    `${API_URL}/api/incidents/${incidentId}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        approved,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to submit approval: ${response.status}`
    );
  }

  return response.json();
}

export async function getIncident(
  incidentId: string
) {
  const response = await fetch(
    `${API_URL}/api/incidents/${incidentId}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve incident: ${response.status}`
    );
  }

  return response.json();
}