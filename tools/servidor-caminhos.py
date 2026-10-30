"""Serve o app nos mesmos caminhos do GitHub Pages, para testar no computador a cópia que o app
guarda no aparelho (sw.js) e as atualizações de versão.

Uso:  python tools/servidor-caminhos.py   e abra
      http://localhost:8767/Dados-de-Arkham-teste/   (como o endereço de teste)
      http://localhost:8767/Dados-de-Arkham/         (como o oficial)

No servidor comum (tools/servidor-local.py) o app abre na raiz e não guarda cópia, para cada
mudança aparecer na hora. Aqui ele se comporta como publicado: guarda a versão inteira e só troca
de versão quando o RELEASE do sw.js muda.
"""
import contextlib
import http.server
import mimetypes
import os
import socket
import urllib.parse

PORT = 8767
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATHS = ('/Dados-de-Arkham-teste/', '/Dados-de-Arkham/')

mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/manifest+json', '.webmanifest')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        clean = urllib.parse.urlsplit(path).path
        for prefix in PATHS:
            if clean.startswith(prefix):
                return super().translate_path('/' + path[len(prefix):])
        return os.path.join(ROOT, '.fora-dos-caminhos')   # fora dos dois caminhos: não existe

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
    print(f'Abra http://localhost:{PORT}/Dados-de-Arkham-teste/  (ou /Dados-de-Arkham/)')
    DualStackServer(('::', PORT), Handler).serve_forever()
