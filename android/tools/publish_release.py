#!/usr/bin/env python3
"""Assina release usando a chave privada que NUNCA deve entrar no Git."""
import argparse, base64, hashlib, json, pathlib, shutil, subprocess

def signed(root, channel, revision, key):
    folder=root/channel
    src=folder/'ui'
    dest=folder/'releases'/str(revision)
    dest.mkdir(parents=True,exist_ok=True)
    files={}
    for name in ('index.html','style.css','app.js'):
        raw=(src/name).read_bytes()
        if len(raw)>512*1024: raise ValueError(f'{name} excede 512 KiB')
        (dest/name).write_bytes(raw)
        files[name]=hashlib.sha256(raw).hexdigest()
    payload={'schema':1,'channel':channel,'revision':revision,'min_native':1,'files':files}
    data=json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
    proc=subprocess.run(['openssl','dgst','-sha256','-sign',str(key)],input=data,check=True,capture_output=True)
    envelope={'schema':1,'payload':base64.b64encode(data).decode(),'signature':base64.b64encode(proc.stdout).decode()}
    (folder/'manifest.json').write_text(json.dumps(envelope,indent=2)+'\n',encoding='utf-8')
    # Na publicação ao vivo, publique arquivos de releases + manifest antes do marcador version.
    (folder/'version').write_text(str(revision)+'\n')
    print(f'{channel} release {revision}: arquivos, hashes e assinatura criados')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--channel',choices=['phone','tv'],required=True)
    parser.add_argument('--revision',type=int,required=True)
    parser.add_argument('--key',type=pathlib.Path,required=True)
    a=parser.parse_args()
    if not 1<=a.revision<=999999:raise SystemExit('Revisão inválida')
    signed(pathlib.Path(__file__).resolve().parents[1],a.channel,a.revision,a.key)
