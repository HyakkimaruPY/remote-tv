'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const activeUi = JSON.parse(fs.readFileSync('manifest.json', 'utf8')).modules.find(x=>x.id==='xtream-ui').path;
const src = fs.readFileSync(activeUi, 'utf8');
let count = 0;
function pass(name) { count++; console.log('PASS', name); }
function harness() {
  let time = 10000, id = 0, closed = 0, hub = 0, focused = 0;
  const jobs = new Map(), plays = [], logs = [], status = {textContent: ''};
  const channel = {id: '42', n: 'Canal fixture', _playing: 1};
  const state = {on: 1, view: 'live', preview: channel, previewIndex: 0,
    items: [channel], liveToken: 0, liveTry: 0, liveRecoveryTimer56: 0,
    liveRecoveryAttempts56: 0, liveRecoveryAt56: 0, full: 0,
    catTimer: 0, previewAt44: 0, fullExitAt44: 0};
  const raw = {play(name, url, v, ff, fail, headless) {
    plays.push({name, url, fail, headless});
  }, close() { closed++; }, fullscreen() { return 1; }};
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [time])); }
    static now() { return time; }
  }
  const ctx = {viewState: state, xtreamApi: {
      liveRoutes() { return ['fixture-720', 'fixture-1080', 'fixture-direct']; },
      mask(url) { return url; }, log(type, message) { logs.push(type + ' ' + message); }
    }, windowRef: {RawPlayer: raw}, element() { return status; },
    navAt31: 0, Date: ClockDate,
    setTimeout(fn, ms) { const t = ++id; jobs.set(t, {fn, at: time + ms}); return t; },
    clearTimeout(t) { jobs.delete(t); },
    hideFullscreenControls() {}, focusChannel() { focused++; },
    focusLiveCat() { focused++; }, fullLive() {}, liveHub() { hub++; state.view = 'live'; }};
  vm.createContext(ctx);
  function section(a,b) {
    const start = src.indexOf(a), end = src.indexOf(b,start);
    assert.ok(start>=0 && end>start, 'function boundaries');
    vm.runInContext(src.slice(start,end),ctx);
  }
  section('    function liveRoutes(o) {','    function chooseLive(i) {');
  section('    function chooseLive(i) {','    function fullLive() {');
  section('    function stopLive() {','    function open() {');
  function advance(ms) {
    const limit = time + ms;
    for (let i=0;i<10000;i++) {
      const ready = [...jobs].filter(([,v]) => v.at<=limit)
        .sort((a,b) => a[1].at-b[1].at)[0];
      if (!ready) break;
      jobs.delete(ready[0]); time=ready[1].at; ready[1].fn();
      if(i===9999) throw new Error('unbounded timer');
    }
    time=limit;
  }
  function failCycle() {
    for(let i=0;i<3;i++) {
      const p=plays[plays.length-1];
      assert.equal(p.headless,true);
      p.fail('routes-exhausted');
    }
  }
  return {state,channel,plays,logs,status,jobs,advance,failCycle,ctx,
    get closed() {return closed;}, get hub(){return hub;}, get focused(){return focused;}};
}
{
  const x=harness();
  x.ctx.startLive(x.channel,0); x.failCycle();
  assert.equal(x.plays.length,3);
  assert.equal(x.state.liveRecoveryAttempts56,1);
  assert.match(x.status.textContent,/Reconectando canal/);
  assert.ok(x.logs.some(x=>/LIVE56.*reconexão 1\/3 em 3000ms/.test(x)));
  x.advance(2999); assert.equal(x.plays.length,3);
  x.advance(1); assert.equal(x.plays.length,4);
  assert.equal(x.plays[3].url,'fixture-720');
  assert.equal(x.closed,3); // 720->1080->direct, then terminal recovery closes old route
  pass('terminal error schedules bounded same-channel reconnect without losing route priority');
}
{
  const x=harness();
  x.ctx.startLive(x.channel,0); x.failCycle();
  x.advance(3000); x.failCycle();
  assert.equal(x.state.liveRecoveryAttempts56,2);
  x.advance(9999); assert.equal(x.plays.length,6);
  x.advance(1); assert.equal(x.plays.length,7);
  x.failCycle(); assert.equal(x.state.liveRecoveryAttempts56,3);
  x.advance(25000); assert.equal(x.plays.length,10);
  x.failCycle();
  assert.equal(x.state.liveRecoveryAttempts56,3);
  assert.equal(x.channel._playing,0);
  assert.match(x.status.textContent,/Selecione o canal/);
  const count=x.plays.length; x.advance(300000); assert.equal(x.plays.length,count);
  pass('three retry delays 3/10/25 seconds then explicit terminal state (no endless loop)');
}
{
  const x=harness(); x.ctx.startLive(x.channel,0); x.failCycle();
  x.ctx.stopLive(); const before=x.plays.length;
  x.advance(300000); assert.equal(x.plays.length,before);
  assert.equal(x.jobs.size,0); assert.equal(x.state.preview,null);
  pass('Back/exit destroys retry timer and forbids late playback resurrection');
}
{
  const x=harness(); x.ctx.startLive(x.channel,0); x.failCycle();
  const next={id:'43',n:'Canal seguinte',_playing:0};
  x.state.items.push(next); x.ctx.chooseLive(1);
  assert.equal(x.state.liveRecoveryAttempts56,0);
  assert.equal(x.state.preview,next);
  const n=x.plays.length;
  x.advance(30000); assert.equal(x.plays.length,n);
  assert.equal(x.plays[n-1].name,'Canal seguinte');
  pass('channel change invalidates old retry without interrupting next channel');
}
{
  const x=harness(); x.ctx.startLive(x.channel,0); x.failCycle();
  const delayed=x.plays[2].fail;
  x.ctx.stopLive(); delayed('late');
  x.advance(30000); assert.equal(x.state.preview,null);
  assert.equal(x.plays.length,3);
  pass('stale failure callback after exit is ignored');
}
{
  const x=harness(); x.ctx.startLive(x.channel,0);
  x.failCycle(); x.advance(3000);
  x.failCycle(); x.advance(10000);
  x.failCycle(); x.advance(25000);
  x.failCycle();
  const n=x.plays.length;
  x.ctx.chooseLive(0);
  assert.equal(x.state.liveRecoveryAttempts56,0);
  assert.equal(x.channel._playing,1);
  assert.equal(x.plays.length,n+1);
  pass('manual retry remains available after auto-recovery budget ends');
}
console.log('Philco beta6 live recovery:',count,'PASS');
