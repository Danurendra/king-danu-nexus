import streamlit as st


st.set_page_config(
    page_title="DinusNexus",
    page_icon="🌐",
    layout="wide",
)


# ============================================================
# HEADER
# ============================================================

st.title("🌐 DinusNexus")
st.caption(
    "AI-Powered Campus Operations Intelligence"
)


# ============================================================
# CAMPUS HEALTH
# ============================================================

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(
        "Campus Health",
        "96%",
        "+2%"
    )

with col2:
    st.metric(
        "Active Incidents",
        "1"
    )

with col3:
    st.metric(
        "AI Investigations",
        "12"
    )

with col4:
    st.metric(
        "Resolved",
        "11"
    )


st.divider()


# ============================================================
# INCIDENT
# ============================================================

st.subheader("🚨 Active Incident")

col1, col2 = st.columns([2, 1])

with col1:

    st.markdown(
        """
        ### Wi-Fi Degradation

        **Location:** Building A — Floor 3  
        **Affected Device:** AP-03  
        **Severity:** High
        """
    )

with col2:

    st.warning(
        "INVESTIGATING"
    )


# ============================================================
# EVIDENCE
# ============================================================

st.subheader("🔎 Evidence")

evidence = [
    ("Network", "Packet Loss", "42%"),
    ("Network", "Latency", "181 ms"),
    ("Access Point", "Status", "Online"),
    ("DHCP", "Status", "Normal"),
    ("Authentication", "Status", "Normal"),
    ("Switch", "Uplink", "Unstable"),
]

for source, metric, value in evidence:

    col1, col2, col3 = st.columns(
        [2, 3, 2]
    )

    with col1:
        st.write(source)

    with col2:
        st.write(metric)

    with col3:
        st.write(value)


st.divider()


# ============================================================
# HYPOTHESIS
# ============================================================

st.subheader("🧠 AI Investigation")

hypotheses = {
    "Uplink Degradation": 0.78,
    "AP Failure": 0.10,
    "Authentication Failure": 0.07,
    "DHCP Failure": 0.05,
}

for name, confidence in hypotheses.items():

    st.write(
        f"**{name}** — {confidence * 100:.0f}%"
    )

    st.progress(
        confidence
    )


st.success(
    "Most likely root cause: Uplink Degradation"
)


# ============================================================
# ACTION
# ============================================================

st.subheader("⚙️ Recommended Action")

st.info(
    "Inspect and stabilize the affected switch uplink."
)


if "approved" not in st.session_state:
    st.session_state.approved = False


if not st.session_state.approved:

    st.warning(
        "Human approval required before action."
    )

    if st.button(
        "✅ Approve Diagnostic",
        use_container_width=True
    ):
        st.session_state.approved = True
        st.rerun()

else:

    st.success(
        "Action approved by human."
    )

    if st.button(
        "⚙️ Execute Diagnostic",
        use_container_width=True
    ):

        st.session_state.executed = True
        st.rerun()


# ============================================================
# VERIFICATION
# ============================================================

if st.session_state.get(
    "executed",
    False
):

    st.subheader("✅ Verification")

    col1, col2 = st.columns(2)

    with col1:

        st.metric(
            "Packet Loss",
            "1.2%",
            "-40.8%"
        )

    with col2:

        st.metric(
            "Latency",
            "18 ms",
            "-163 ms"
        )

    st.success(
        "INCIDENT RESOLVED"
    )

    st.caption(
        "Post-action verification successful."
    )


# ============================================================
# FOOTER
# ============================================================

st.divider()

st.caption(
    "DinusNexus — Connect. Understand. Act."
)