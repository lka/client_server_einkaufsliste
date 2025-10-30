"""Ein einfacher, standard-library-basierter HTTP-Server.

- API: /api/items (GET, POST, DELETE)
- Serviert statische Dateien aus ../client
- Keine externen Abhängigkeiten
"""

import http.server
import json
import uuid
import os
from http import HTTPStatus

PORT = 8000
HERE = os.path.dirname(os.path.abspath(__file__))
CLIENT_DIR = os.path.normpath(os.path.join(HERE, "..", "..", "client"))

items = []  # In-memory store: list of dicts {"id": ..., "name": ...}


class APIHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler for API and static file serving.

    Handles REST API endpoints for shopping list items and serves
    static files from the client directory.
    """

    def __init__(self, *args, directory=None, **kwargs):
        """Initialize the handler with client directory for static files.

        Args:
            *args: Positional arguments passed to parent class.
            directory: Directory to serve files from (ignored,
                uses CLIENT_DIR).
            **kwargs: Keyword arguments passed to parent class.
        """
        # serve files from client directory for non-API paths
        super().__init__(*args, directory=CLIENT_DIR, **kwargs)

    def end_headers(self):
        """Send response headers including CORS headers.

        Adds CORS headers to allow cross-origin requests for local development.
        """
        # Add CORS headers to allow easy local development
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight.

        Returns a 204 No Content response with CORS headers.
        """
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self):
        """Handle GET requests.

        Returns all shopping list items for /api/items endpoint.
        For other paths, serves static files from the client directory.
        """
        if self.path.startswith("/api/items"):
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            payload = json.dumps(items, ensure_ascii=False).encode("utf-8")
            self.wfile.write(payload)
            return
        # else serve static files from client/
        return super().do_GET()

    def do_POST(self):
        """Handle POST requests.

        Creates a new shopping list item at /api/items endpoint.
        Expects JSON body with "name" field.
        Returns 201 Created with the new item including generated ID,
        or 400 Bad Request if the request is invalid.
        """
        if self.path.startswith("/api/items"):
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length).decode("utf-8") if length else ""
            try:
                data = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                self.send_response(HTTPStatus.BAD_REQUEST)
                self.end_headers()
                return
            name = data.get("name")
            if not name:
                self.send_response(HTTPStatus.BAD_REQUEST)
                self.end_headers()
                return
            item = {"id": str(uuid.uuid4()), "name": name}
            items.append(item)
            self.send_response(HTTPStatus.CREATED)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(item, ensure_ascii=False).encode("utf-8"))
            return
        # fallback
        self.send_response(HTTPStatus.NOT_FOUND)
        self.end_headers()

    def do_DELETE(self):
        """Handle DELETE requests.

        Deletes a shopping list item at /api/items/<id> endpoint.
        Returns 204 No Content if item was deleted,
        404 Not Found if item doesn't exist,
        or 400 Bad Request if the request format is invalid.
        """
        if self.path.startswith("/api/items"):
            # expected: /api/items/<id>
            parts = self.path.rstrip("/").split("/")
            if len(parts) >= 3 and parts[2]:
                target_id = parts[2]
                global items
                before = len(items)
                items = [it for it in items if it["id"] != target_id]
                if len(items) < before:
                    self.send_response(HTTPStatus.NO_CONTENT)
                    self.end_headers()
                    return
                else:
                    self.send_response(HTTPStatus.NOT_FOUND)
                    self.end_headers()
                    return
        self.send_response(HTTPStatus.BAD_REQUEST)
        self.end_headers()


def run(server_class=http.server.ThreadingHTTPServer, handler_class=APIHandler):
    """Start and run the HTTP server.

    Args:
        server_class: The server class to use (default: ThreadingHTTPServer).
        handler_class: The request handler class to use (default: APIHandler).
    """
    addr = ("", PORT)
    with server_class(addr, handler_class) as httpd:
        print(f"Serving HTTP on port {PORT} (client dir: {CLIENT_DIR})")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down")
            httpd.shutdown()


if __name__ == "__main__":
    run()
