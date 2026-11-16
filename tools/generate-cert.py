#!/usr/bin/env python3
"""Generate a short-lived self-signed development certificate for the LAN host."""

from __future__ import annotations

import ipaddress
import shutil
import socket
import subprocess
from pathlib import Path


def local_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # No packet is sent; connect() asks the OS which interface would route this address.
        sock.connect(("192.0.2.1", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


def main() -> None:
    openssl = shutil.which("openssl")
    if not openssl:
        raise SystemExit("OpenSSL was not found on PATH. Install OpenSSL, then retry.")

    address = local_ip()
    ipaddress.ip_address(address)
    cert_dir = Path(".certs")
    cert_dir.mkdir(exist_ok=True)
    cert = cert_dir / "webokit.crt"
    key = cert_dir / "webokit.key"
    san = f"subjectAltName=IP:127.0.0.1,IP:{address},DNS:localhost"
    command = [
        openssl, "req", "-x509", "-newkey", "rsa:2048", "-sha256", "-nodes",
        "-keyout", str(key), "-out", str(cert), "-days", "30",
        "-subj", "/CN=Webokit local development",
        "-addext", san,
    ]
    subprocess.run(command, check=True)
    print(f"Certificate: {cert}")
    print(f"Private key: {key}")
    print(f"LAN address in certificate: {address}")
    print("This is a self-signed development certificate, not a publicly trusted identity.")


if __name__ == "__main__":
    main()
