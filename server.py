#!/usr/bin/env python3
"""One-click LAN server for Next Chapter.

Serves the game to phones on the same network and provides a tiny shared-save
endpoint at /api/server-save. This is intended for private home/LAN use.
"""
from __future__ import annotations

import argparse
import json
import socket
import sys
import threading
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SAVE_FILE = ROOT / ".next-chapter-server-save.json"
MAX_SAVE_BYTES = 2 * 1024 * 1024


def local_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


class Handler(SimpleHTTPRequestHandler):
    server_version = "NextChapterHomeServer/1.0"

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path.split("?", 1)[0] == "/api/server-save":
            if not SAVE_FILE.exists():
                self.send_error(HTTPStatus.NOT_FOUND, "No shared save exists")
                return
            payload = SAVE_FILE.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

    def do_PUT(self) -> None:  # noqa: N802
        if self.path.split("?", 1)[0] != "/api/server-save":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_error(HTTPStatus.BAD_REQUEST, "Invalid content length")
            return
        if length <= 0 or length > MAX_SAVE_BYTES:
            self.send_error(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "Save is empty or too large")
            return
        payload = self.rfile.read(length)
        try:
            document = json.loads(payload.decode("utf-8"))
            if document.get("format") != "next-chapter-life-save" or not isinstance(document.get("state"), dict):
                raise ValueError("Not a Next Chapter export")
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            self.send_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
        temporary = SAVE_FILE.with_suffix(".tmp")
        temporary.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(SAVE_FILE)
        response = b'{"ok":true}'
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve Next Chapter on your home network.")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    # Python 3.7+ supports the directory parameter, avoiding global chdir.
    def factory(*factory_args, **factory_kwargs):
        return Handler(*factory_args, directory=str(ROOT), **factory_kwargs)

    try:
        server = ThreadingHTTPServer(("0.0.0.0", args.port), factory)
    except OSError as exc:
        print(f"Could not start the server on port {args.port}: {exc}", file=sys.stderr)
        return 1

    pc_url = f"http://127.0.0.1:{args.port}/"
    phone_url = f"http://{local_ip()}:{args.port}/"
    print("\nNext Chapter home server is running.")
    print(f"PC:    {pc_url}")
    print(f"Phone: {phone_url}")
    print("\nKeep this window open while playing. Your phone must be on the same Wi-Fi.")
    print("Use Save & export → Save to home server to share a save between devices.")
    print("Press Ctrl+C to stop.\n")

    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(pc_url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server…")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
