import base64
import hashlib
import json
import pathlib
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
LEGACY_KEY = ROOT / 'keys/update_pub_v0_1.der'
V12_KEY = ROOT / 'keys/update_pub_v1_2.der'
NATIVE_KEY = ROOT / 'app/src/main/assets/update_pub.der'


class TestRelease(unittest.TestCase):
    def test_signed_release_payloads(self):
        for channel in ('phone', 'tv'):
            folder = ROOT / channel
            envelope = json.loads((folder / 'manifest.json').read_text())
            payload = base64.b64decode(envelope['payload'], validate=True)
            signature = base64.b64decode(envelope['signature'], validate=True)
            manifest = json.loads(payload)
            revision = int(manifest['revision'])
            self.assertEqual(manifest['channel'], channel)
            self.assertEqual(manifest['schema'], 1)
            self.assertEqual(envelope['schema'], 1)
            self.assertEqual(int((folder / 'version').read_text()), revision)
            signing_key = LEGACY_KEY if revision == 1 else V12_KEY
            with tempfile.TemporaryDirectory() as td:
                root = pathlib.Path(td)
                (root / 'payload').write_bytes(payload)
                (root / 'signature').write_bytes(signature)
                (root / 'key.pem').write_bytes(
                    subprocess.run(
                        ['openssl', 'pkey', '-pubin', '-inform', 'DER', '-in', str(signing_key)],
                        check=True, capture_output=True
                    ).stdout
                )
                subprocess.run([
                    'openssl', 'dgst', '-sha256', '-verify', str(root / 'key.pem'),
                    '-signature', str(root / 'signature'), str(root / 'payload')
                ], check=True, capture_output=True)
            for name, digest in manifest['files'].items():
                self.assertIn(name, ('index.html', 'style.css', 'app.js'))
                data = (folder / 'releases' / str(revision) / name).read_bytes()
                self.assertEqual(hashlib.sha256(data).hexdigest(), digest)
                if revision >= 3 and channel == 'phone':
                    self.assertEqual(data, (folder / 'ui' / name).read_bytes())

    def test_update_signing_keys_are_separate(self):
        # Legacy revision-1 manifests remain valid for audit only.
        self.assertNotEqual(LEGACY_KEY.read_bytes(), V12_KEY.read_bytes())
        # Source still contains the old v0.1 native baseline. Never infer its
        # public key is compatible with the installed APK 1.2.
        self.assertEqual(NATIVE_KEY.read_bytes(), LEGACY_KEY.read_bytes())


if __name__ == '__main__':
    unittest.main()
