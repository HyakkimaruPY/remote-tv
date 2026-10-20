#!/usr/bin/env python3
"""Build a self-contained ES5 player, local recovery image and update manifest."""
from pathlib import Path
import json, hashlib, re, argparse
ROOT=Path(__file__).resolve().parent
VERSION='1.0.1'
parser=argparse.ArgumentParser()
parser.add_argument('--update-embedded', action='store_true', help='Explicitly regenerate the packaged fallback; remote publication does not require a new IPK.')
args=parser.parse_args()
src=ROOT/'src'
def replace_function(code,name,replacement):
    start=code.index('    function '+name+'(')
    end=code.index('\n    function ',start+10)
    return code[:start]+replacement+code[end:]

def apply_source_patch(code, patch_path):
    """Apply reviewed hunks by exact context; never silently patch a new baseline."""
    hunks=[]
    before=[];after=[];active=False
    for line in patch_path.read_text().splitlines(keepends=True):
        if line.startswith('@@'):
            if active:hunks.append((''.join(before),''.join(after)))
            before=[];after=[];active=True
        elif active:
            if line.startswith((' ','-')):before.append(line[1:])
            if line.startswith((' ','+')):after.append(line[1:])
    if active:hunks.append((''.join(before),''.join(after)))
    for before,after in hunks:
        if not before or code.count(before)!=1:
            raise ValueError('Patch baseline differs or is ambiguous: '+str(patch_path))
        code=code.replace(before,after,1)
    return code

def adapt(name):
    code=(src/'upstream'/name).read_text()
    if name.startswith('xtream-lazy-core'):
        code=code.replace("src = bridgePrefix + encodeURIComponent(target)","src = target")
        code=replace_function(code,'catalogIdentity', '''    function catalogIdentity(c) {
        /* LG has account-scoped storage; never delete another account's history. */
    }''')
        code=code.replace("String(b || '')", "mask(String(b || ''))")
        code=replace_function(code,'auth', '''    function auth(cb) {
        cancel();
        if (!windowRef.Aura.currentSource) { cb('Escolha uma fonte.'); return; }
        var source=windowRef.Aura.currentSource;
        if (source.kind==='m3u') { cb(null); return; }
        var c=source.credentials;
        catalogState.c={d:c.host,u:c.user,p:c.pass};
        cb(null);
    }''')
    if name.startswith('tmdb-metadata'):
        code=code.replace("BR + encodeURIComponent(u)","u")
    if name.startswith('xtream-ui'):
        code=replace_function(code,'asset', '''    function asset(url) {
        try { return windowRef.Aura.url(String(url||''), windowRef.Aura.baseURL()); } catch(e) { return ''; }
    }''')
        code=code.replace("BR = 'http://127.0.0.1:8765/fetch?u='", "BR = ''")
        # Source screen is owned by the LG shell, not the Philco firmware menu.
        code=replace_function(code,'hideBase', '''    function hideBase() { windowRef.Aura.$('sourceShell').style.display='none'; }''')
        code=replace_function(code,'showBase', '''    function showBase() { windowRef.Aura.sourceHome(); }''')
        code=code.replace('M3U bruto ', 'Aura ').replace('beta \\xB7 Graphene', 'LG '+VERSION+' \\xB7 beta.5')
        code=code.replace('M3U bruto beta','Aura').replace('Player M3U','Aura')
        # Scoped keys preserve each account, and are selected before opening.
        code=code.replace("FK = 'xtream.favorites.v14'", "FK = windowRef.Aura.storageKey('favorites')")
        code=code.replace('function open() {', 'function open() {\n        FK = windowRef.Aura.storageKey(\"favorites\");')
    # Preserve the beta's layout relationships, with viewport-derived rem units.
    # Root and major panels receive percentage overrides in lg.css.
    if name.startswith(('xtream-ui','graphos-skin')):
        code=re.sub(r'(-?\d+(?:\.\d+)?)px',lambda m:format(float(m[1])/20,'.5g')+'rem',code)
        code=code.replace('1280rem','100%')
    if name.startswith('xtream-lazy-core'):
        code=apply_source_patch(code,src/'patches/xtream-core.patch')
    if name.startswith('xtream-ui'):
        code=code.replace('LG '+VERSION,'LG __AURA_VERSION__')
        code=apply_source_patch(code,src/'patches/xtream-ui.patch')
        code=code.replace('__AURA_VERSION__',VERSION)
    return code
mods=['xtream-lazy-core.beta56-3.js','tmdb-metadata.beta56-5.js','xtream-ui.beta56-5.js','graphos-skin-beta56-5.js']
parts=[(src/'core.js').read_text(),(src/'sources.js').read_text(),adapt(mods[0]),(src/'lg-adapter.js').read_text(),adapt(mods[1]),adapt(mods[2]),adapt(mods[3]),(src/'init.js').read_text()]
css=(src/'player.css').read_text()+'\n'+(src/'lg.css').read_text()
html=(src/'player.html').read_text().replace('<!--STYLE-->','<style>'+css+'</style>').replace('<!--SCRIPTS-->','<script>'+('\n'.join(parts)).replace('</script','<\\/script')+'</script>')
release=ROOT/'releases'/VERSION
release.mkdir(parents=True,exist_ok=True)
(release/'player.html').write_text(html)
b=html.encode()
manifest={'schema':1,'version':VERSION,'base':'remote-tv 0.56-beta.5','path':'releases/'+VERSION+'/player.html','bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(ROOT/'version').write_text(VERSION+'\n')
fallback={k:manifest[k] for k in ('version','bytes','sha256')};fallback['html']=html
if args.update_embedded: (ROOT/'app'/'fallback.js').write_text('window.AuraFallback='+json.dumps(fallback,ensure_ascii=True).replace('</','<\\/')+';\n')
print(json.dumps({k:v for k,v in manifest.items()}))
