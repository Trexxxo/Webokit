#!/usr/bin/env python3
"""Small standard-library HTTP(S) static host for Webokit development."""

from __future__ import annotations

import argparse
import functools
import http.server
import ssl
from pathlib import Path
from urllib.parse import unquote, urlsplit


class QuietStaticHandler(http.server.SimpleHTTPRequestHandler):
    server_version = "WebokitHost/1.0"

    def __init__(self, *args, directory: str, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def _deny_private_paths(self) -> bool:
        # The host serves the repository root. Never expose dotfiles, Git metadata,
        # local TLS private keys, or development configuration over HTTP(S).
        parts = Path(unquote(urlsplit(self.path).path)).parts
        if any(part.startswith(".") for part in parts):
            self.send_error(404, "Not found")
            return True
        return False

    def do_GET(self):
        if self._deny_private_paths():
            return
        super().do_GET()

    def do_HEAD(self):
        if self._deny_private_paths():
            return
        super().do_HEAD()

    def list_directory(self, path):
        self.send_error(403, "Directory listing is disabled")
        return None

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve Webokit over HTTP or HTTPS.")
    parser.add_argument("--bind", default="0.0.0.0", help="Interface to bind (default: all interfaces)")
    parser.add_argument("--port", type=int, default=8080, help="Port (default: 8080)")
    parser.add_argument("--root", default=".", help="Directory to serve (default: repository root)")
    parser.add_argument("--tls-cert", help="TLS certificate PEM; enables HTTPS when supplied")
    parser.add_argument("--tls-key", help="TLS private key PEM; required with --tls-cert")
    args = parser.parse_args()

    if bool(args.tls_cert) != bool(args.tls_key):
        parser.error("--tls-cert and --tls-key must be provided together")
    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")

    root = Path(args.root).resolve()
    if not root.is_dir():
        parser.error(f"Root directory does not exist: {root}")

    handler = functools.partial(QuietStaticHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer((args.bind, args.port), handler)
    protocol = "HTTP"

    if args.tls_cert:
        cert = Path(args.tls_cert).resolve()
        key = Path(args.tls_key).resolve()
        if not cert.is_file() or not key.is_file():
            parser.error("TLS certificate or key file does not exist")
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.load_cert_chain(str(cert), str(key))
        server.socket = context.wrap_socket(server.socket, server_side=True)
        protocol = "HTTPS"

    print(f"Webokit host: {protocol}://{args.bind}:{args.port}/")
    print(f"Serving: {root}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print()\n        print("Stopping Webokit host…")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
