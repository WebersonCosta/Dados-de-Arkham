"""Servidor para testar o app no computador.

Uso:  python tools/servidor-local.py   e abra http://localhost:8766
"""
import contextlib
import http.server
import mimetypes
import os
import socket

PORT = 8766
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# No Windows o tipo dos arquivos .js às vezes vem errado do registro, e o navegador recusa os módulos.
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/manifest+json', '.webmanifest')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


class DualStackServer(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        with contextlib.suppress(Exception):
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()


if __name__ == '__main__':
    print(f'Abra http://localhost:{PORT}')
    DualStackServer(('::', PORT), Handler).serve_forever()
