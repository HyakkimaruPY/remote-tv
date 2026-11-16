import base64,hashlib,json,pathlib,subprocess,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
PUB=ROOT/'app/src/main/assets/update_pub.der'
class TestRelease(unittest.TestCase):
    def test_signatures_and_payloads(self):
        for channel in ('phone','tv'):
            env=json.loads((ROOT/channel/'manifest.json').read_text())
            raw=base64.b64decode(env['payload']);signature=base64.b64decode(env['signature'])
            with tempfile.TemporaryDirectory() as td:
                payload=pathlib.Path(td)/'payload';sig=pathlib.Path(td)/'sig';pem=pathlib.Path(td)/'pub.pem'
                payload.write_bytes(raw);sig.write_bytes(signature)
                subprocess.run(['openssl','pkey','-pubin','-inform','DER','-in',str(PUB),'-out',str(pem)],check=True,capture_output=True)
                subprocess.run(['openssl','dgst','-sha256','-verify',str(pem),'-signature',str(sig),str(payload)],check=True,capture_output=True)
            m=json.loads(raw);self.assertEqual(m['channel'],channel);self.assertEqual(m['revision'],1)
            self.assertEqual(int((ROOT/channel/'version').read_text()),1)
            for filename,digest in m['files'].items():
                actual=hashlib.sha256((ROOT/channel/'releases'/'1'/filename).read_bytes()).hexdigest()
                self.assertEqual(actual,digest)
                self.assertEqual((ROOT/channel/'ui'/filename).read_bytes(),(ROOT/'app/src/main/assets/ui'/channel/filename).read_bytes())

if __name__=='__main__':unittest.main()
