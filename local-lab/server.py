"""Local fixture bridge; deliberately does not proxy the public Internet."""
import argparse
import json
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse, quote

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'local-lab'
LOCK = threading.Lock()
STATE = {'scenario': 'healthy', 'session': 0, 'active': False, 'logs': [], 'requests': []}

def mark(msg):
    with LOCK:
        STATE['logs'].append(msg)
        STATE['logs'] = STATE['logs'][-200:]

def channels():
    return [[f'Canal de teste {i+1:02}', f'Categoria {i//12+1}',
             f'http://tv.fixture/live/demo/demo/{i+1}.m3u8', f'http://tv.fixture/logo/{i+1}.svg'] for i in range(96)]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, *a):
        pass

    def output(self, data, content='text/plain; charset=utf-8', status=200):
        if not isinstance(data, bytes):
            data = data.encode()
        self.send_response(status)
        self.send_header('Content-Type', content)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        path = u.path
        if self.server.server_port == 18766 and not getattr(self, '_upstream', False) and not path.startswith('/media/'):
            original = self.path
            self.path = '/fetch?u=' + quote('http://tv.fixture' + original, safe='')
            self._upstream = True
            try:
                return self.do_GET()
            finally:
                self._upstream = False
                self.path = original
        if path == '/':
            m = json.loads((ROOT/'manifest.json').read_text())
            candidate = q.get('candidate', ['0'])[0] == '1'
            head = '<!doctype html><html><head><meta charset="utf-8"><title>Philco Local Lab</title></head><body>'
            out = [head, '<script src="/local-lab/adapter.js"></script>']
            for mod in m['modules']:
                p = mod['path']
                if candidate and mod['id'] == 'app':
                    p = 'apps/player1/app.beta56.js'
                if mod['type'] == 'html':
                    out.append((ROOT/p).read_text())
                elif mod['type'] == 'css':
                    out.append(f'<link rel="stylesheet" href="/{p}">')
                elif mod['type'] == 'json':
                    out.append('<script>RemoteTV.data['+json.dumps(mod['id'])+']='+ (ROOT/p).read_text() +';</script>')
                elif mod['type'] == 'js':
                    out.append(f'<script src="/{p}"></script>')
            out.append('</body></html>')
            return self.output('\n'.join(out), 'text/html; charset=utf-8')
        if path.startswith(('/control/', '/hls', '/fetch', '/c', '/debug/')):
            with LOCK:
                STATE['requests'].append({'path': path, 'time': time.monotonic()})
                STATE['requests'] = STATE['requests'][-2000:]
        if path == '/lab/scenario':
            scenario = q.get('id', ['healthy'])[0]
            if scenario not in ('healthy', 'slow', 'offline', 'transient', 'stalled', 'error'):
                return self.output('invalid scenario', status=400)
            with LOCK:
                STATE['scenario'] = scenario
            mark('SCENARIO '+scenario)
            return self.output('ok')
        if path == '/lab/state':
            with LOCK:
                return self.output(json.dumps(STATE), 'application/json')
        if path == '/health':
            return self.output('ok local-contract-simulator')
        if path == '/c':
            return self.output(json.dumps(channels()), 'application/json')
        if path == '/control/start':
            with LOCK:
                STATE['session'] += 1
                STATE['active'] = True
                session = STATE['session']
            mark('START session='+str(session))
            return self.output(str(session))
        if path == '/control/cancel':
            with LOCK:
                STATE['active'] = False
            mark('CANCEL')
            return self.output('0')
        if path == '/debug/mark':
            mark(q.get('m', [''])[0][:300])
            return self.output('ok')
        if path == '/debug/logs':
            with LOCK:
                return self.output('\n'.join(STATE['logs']))
        if path in ('/fetch', '/hls'):
            target = urlparse(q.get('u', [''])[0])
            if target.hostname not in ('tv.fixture', 'raw.githubusercontent.com'):
                return self.output('fixture-only bridge', status=403)
            if target.hostname == 'raw.githubusercontent.com':
                if target.path.endswith('credenciais.temp'):
                    return self.output('M3U="http://tv.fixture/get.php?username=demo&password=demo"')
                return self.output('fixture unavailable', status=404)
            if target.path.startswith('/logo/'):
                number = target.path.split('/')[-1].split('.')[0]
                return self.output(f'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="12" fill="#243743"/><text x="40" y="50" text-anchor="middle" fill="white" font-size="30">{number}</text></svg>', 'image/svg+xml')
            if target.path.endswith('player_api.php'):
                aq = parse_qs(target.query)
                action = aq.get('action', [''])[0]
                if action == 'get_live_categories':
                    data = [{'category_id':str(i), 'category_name':f'Categoria {i}'} for i in range(1,9)]
                elif action == 'get_live_streams':
                    cat = int(aq.get('category_id', ['1'])[0])
                    data = [{'stream_id':i, 'name':f'Canal de teste {i:02}', 'stream_icon':f'http://tv.fixture/logo/{i}.svg', 'category_id':str(cat)} for i in range((cat-1)*12+1, cat*12+1)]
                else:
                    data = {'user_info':{'auth':1,'status':'Active','exp_date':'0'},'server_info':{'timestamp_now':int(time.time())}}
                return self.output(json.dumps(data), 'application/json')
            with LOCK:
                scenario = STATE['scenario']
            if scenario == 'slow':
                time.sleep(1.2)
            if scenario == 'offline':
                return self.output('network unavailable', status=503)
            if target.path.endswith('.m3u8') or path == '/hls':
                return self.output('#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:6\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:6,\n/media/segment.ts\n', 'application/vnd.apple.mpegurl')
            if target.path.endswith('.ts'):
                return self.output((LAB/'media/segment.ts').read_bytes(), 'video/mp2t')
            if target.path.endswith('.webm'):
                return self.output((LAB/'media/channel.webm').read_bytes(), 'video/webm')
            return self.output('fixture missing', status=404)
        if path == '/media/channel.webm':
            return self.output((LAB/'media/channel.webm').read_bytes(), 'video/webm')
        if path == '/media/segment.ts':
            # Progressive writes, as required by the bridge's clear-TS contract.
            data = (LAB/'media/segment.ts').read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'video/mp2t')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            try:
                for offset in range(0, len(data), 188*64):
                    self.wfile.write(data[offset:offset+188*64])
                    self.wfile.flush()
                    time.sleep(.002)
            except (BrokenPipeError, ConnectionResetError):
                pass
            return
        super().do_GET()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=18765)
    args = parser.parse_args()
    upstream = ThreadingHTTPServer(('127.0.0.2', 18766), Handler)
    threading.Thread(target=upstream.serve_forever, daemon=True).start()
    srv = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'Philco lab http://127.0.0.1:{args.port}', flush=True)
    srv.serve_forever()
