def check_network():
    """
    Memeriksa kondisi network.
    Nantinya ini bisa diganti dengan ping/API/router telemetry.
    """
    return {
        "source": "network",
        "packet_loss": 42,
        "latency": 181,
    }


def check_access_point():
    return {
        "source": "access_point",
        "status": "online",
    }


def check_dhcp():
    return {
        "source": "dhcp",
        "status": "normal",
    }


def check_authentication():
    return {
        "source": "authentication",
        "status": "normal",
    }


def check_switch():
    return {
        "source": "switch",
        "uplink": "unstable",
    }


def run_diagnostic():
    """
    Simulasi tindakan pemulihan.
    """
    return {
        "source": "diagnostic",
        "packet_loss": 1.2,
        "status": "improved",
    }

def run_diagnostic():
    """
    Simulasi tindakan pemulihan network.
    """
    print("Running network diagnostic/recovery...")

    return {
        "source": "diagnostic",
        "status": "completed",
        "packet_loss": 1.2,
        "latency": 18,
    }


def verify_network():
    """
    Simulasi verifikasi setelah action.
    """
    return {
        "source": "network_verification",
        "packet_loss": 1.2,
        "latency": 18,
        "healthy": True,
    }