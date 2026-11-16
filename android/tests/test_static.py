import pathlib, re, unittest, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Static(unittest.TestCase):
  def test_assets_and_routes(self):
    for channel in ('phone','tv'):
      base=ROOT/'app/src/main/assets/ui'/channel
      for name in ('index.html','style.css','app.js'):self.assertTrue((base/name).stat().st_size>100)
      doc=(base/'index.html').read_text()
      self.assertIn('/app/app.js',doc)
      self.assertIn('/app/style.css',doc)
      self.assertIn('Content-Security-Policy',doc)
  def test_manifest_xml(self):
    doc=ET.parse(ROOT/'app/src/main/AndroidManifest.xml')
    text=(ROOT/'app/src/main/AndroidManifest.xml').read_text()
    self.assertIn('android.hardware.touchscreen',text)
    self.assertIn('android.intent.category.LEANBACK_LAUNCHER',text)
    self.assertIn('android.permission.INTERNET',text)
  def test_remotes_separated(self):
    source=(ROOT/'app/src/main/java/dev/auratv/launcher/RemoteUi.java').read_text()
    self.assertIn('SHA256withRSA',source)
    self.assertIn('"/version"',source)
    self.assertIn('"/manifest.json"',source)
    self.assertIn('"tv".equals(channel)?"tv":"phone"',source)
if __name__=='__main__':unittest.main()
