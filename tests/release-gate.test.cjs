const fs=require('fs');
const assert=require('node:assert/strict');

const version=fs.readFileSync('version','utf8').trim();
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));

assert.equal(manifest.version,version,'manifest.version must match activation marker version');
assert.equal(
  manifest.release,
  '2026.09.20-remote.'+version.replace(/^0\./,''),
  'manifest.release must describe the same activated version'
);

const archive='manifest.remote'+version.replace(/^0\./,'')+'.json';
assert.ok(fs.existsSync(archive),'activated release archive is missing: '+archive);
assert.equal(
  fs.readFileSync(archive,'utf8'),
  fs.readFileSync('manifest.json','utf8'),
  'activated archive must be byte-identical to manifest.json'
);

console.log('release gate PASS · '+version+' · '+manifest.release);
