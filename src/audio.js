/* First 12 Weeks — sound. Everything is synthesised with Web Audio, so there are no audio files.
   Off by default (browsers block autoplay, and parents may be holding a sleeping baby).
   Every sound has an on-screen counterpart, so the game works fully muted.
   Cries stay soft on purpose: they are a cue, never an alarm. They can be switched off on their own.
   Must never call Math.random: the seeded balance test would shift. Noise uses its own tiny PRNG. */
(function(){
'use strict';
const KEY='first12weeks.sound';
const prefs={on:false,cry:true};
try{const o=JSON.parse(localStorage.getItem(KEY)); if(o){prefs.on=!!o.on; prefs.cry=o.cry!==false;}}catch(e){}

let ctx=null, master=null, noiseBuf=null, amb=null;
const log=[]; // names of sounds requested while sound is on (used by tests)
const note=n=>{log.push(n); if(log.length>200) log.shift();};

let seed=20260101;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296;};

function ensure(){
 if(!prefs.on) return null;
 try{
  if(!ctx){
   const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
   ctx=new AC(); master=ctx.createGain(); master.gain.value=.8; master.connect(ctx.destination);
  }
  if(ctx.state==='suspended') ctx.resume();
  return ctx;
 }catch(e){return null;}
}
function noiseBuffer(){
 if(noiseBuf) return noiseBuf;
 const n=ctx.sampleRate*2, b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0);
 let last=0; for(let i=0;i<n;i++){last=(last+0.02*(rnd()*2-1))/1.02; d[i]=last*3.5;} // soft brown noise
 return noiseBuf=b;
}
function env(g,t,dur,peak,att){
 g.gain.setValueAtTime(0.0001,t);
 g.gain.exponentialRampToValueAtTime(peak,t+(att||.02));
 g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
}
function tone(f,t,dur,o){
 o=o||{};
 const osc=ctx.createOscillator(), g=ctx.createGain();
 osc.type=o.type||'sine'; osc.frequency.setValueAtTime(f,t);
 if(o.to) osc.frequency.exponentialRampToValueAtTime(o.to,t+dur);
 env(g,t,dur,o.gain||.06,o.att);
 osc.connect(g); g.connect(master); osc.start(t); osc.stop(t+dur+.05);
}
function hiss(t,dur,o){
 const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain();
 s.buffer=noiseBuffer(); s.loop=true; f.type=o.type||'bandpass'; f.frequency.setValueAtTime(o.f,t); f.Q.value=o.q||1;
 if(o.to) f.frequency.exponentialRampToValueAtTime(o.to,t+dur);
 env(g,t,dur,o.gain||.05,o.att||.03);
 s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+dur+.05);
}
// A soft baby voice: sawtooth through two vowel-like filters, with a little vibrato.
function voice(t,o){
 const osc=ctx.createOscillator(), lfo=ctx.createOscillator(), lg=ctx.createGain();
 osc.type='sawtooth'; osc.frequency.setValueAtTime(o.f0,t); osc.frequency.linearRampToValueAtTime(o.f1,t+o.dur);
 lfo.frequency.value=o.vib||6; lg.gain.value=o.f0*0.035; lfo.connect(lg); lg.connect(osc.frequency);
 const a=ctx.createBiquadFilter(), b=ctx.createBiquadFilter(), ga=ctx.createGain(), gb=ctx.createGain(), lp=ctx.createBiquadFilter(), g=ctx.createGain();
 a.type=b.type='bandpass'; a.frequency.value=900; a.Q.value=4; b.frequency.value=2600; b.Q.value=6; ga.gain.value=1; gb.gain.value=.5;
 lp.type='lowpass'; lp.frequency.value=3500;
 osc.connect(a); osc.connect(b); a.connect(ga); b.connect(gb); ga.connect(lp); gb.connect(lp); lp.connect(g); g.connect(master);
 env(g,t,o.dur,o.gain,.07);
 osc.start(t); lfo.start(t); osc.stop(t+o.dur+.05); lfo.stop(t+o.dur+.05);
}

const ACTION={
 feed(t){for(let i=0;i<4;i++) tone(230,t+i*.28,.12,{to:140,gain:.07});},
 burp(t){tone(120,t,.35,{type:'sawtooth',to:70,gain:.05}); hiss(t+.05,.2,{f:300,type:'lowpass',gain:.04});},
 change(t){hiss(t,.28,{f:2500,q:1.5,gain:.05}); hiss(t+.35,.18,{f:1800,q:1.5,gain:.04});},
 sleep(t){[659,587,494].forEach((f,i)=>tone(f,t+i*.5,.7,{gain:.05,att:.08}));},
 soothe(t){tone(262,t,1.1,{type:'triangle',gain:.045,att:.15}); tone(330,t+.5,1.1,{type:'triangle',gain:.035,att:.15});},
 play(t){[523,659,784].forEach((f,i)=>tone(f,t+i*.13,.2,{type:'triangle',gain:.05}));},
 bath(t){hiss(t,.8,{f:400,to:1400,type:'lowpass',gain:.06,att:.1}); [0,1,2,3].forEach(i=>tone(600+i*130,t+.2+i*.17,.12,{to:1000+i*130,gain:.035}));},
 rest(t){tone(196,t,1.2,{to:147,gain:.04,att:.2}); hiss(t,1,{f:600,type:'lowpass',gain:.025,att:.3});},
 help(t){tone(523,t,.7,{gain:.06,att:.03}); tone(784,t+.22,.9,{gain:.06,att:.03});},
};
const EVENT={
 card(t){tone(880,t,.18,{gain:.04}); tone(1320,t+.12,.3,{gain:.035});},
 day(t){[523,659,784].forEach(f=>tone(f,t,1.2,{gain:.03,att:.1}));},
 on(t){tone(660,t,.15,{gain:.05}); tone(880,t+.1,.25,{gain:.05});},
};
// Cry shapes by cue, so a hungry cry sounds different from a tired one.
const CRY={
 hunger:{f0:380,f1:470,dur:.55,reps:1,gap:0},
 sleep:{f0:540,f1:380,dur:.85,reps:1,gap:0},
 diaper:{f0:450,f1:420,dur:.28,reps:2,gap:.2},
 gas:{f0:300,f1:260,dur:.4,reps:1,gap:0},
 purple:{f0:600,f1:520,dur:1.4,reps:1,gap:0},
 coo:{f0:330,f1:430,dur:.4,reps:1,gap:0},
};
const LEVEL={early:{g:.035,len:.6,every:7},mid:{g:.065,len:1,every:4},late:{g:.1,len:1.3,every:3},calm:{g:.03,len:1,every:12}};

function run(kind,fn){
 note(kind);
 const c=ensure(); if(!c) return;
 try{fn(c.currentTime+.02);}catch(e){}
}
let ticks=0,lastKey='',nextAt=0;
const A={
 log,
 get on(){return prefs.on;},
 get cryOn(){return prefs.cry;},
 set(p){
  const was=prefs.on;
  if(p.on!==undefined) prefs.on=!!p.on;
  if(p.cry!==undefined) prefs.cry=!!p.cry;
  try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(e){}
  if(!prefs.on){A.ambient(false); lastKey='';}
  else{ensure(); if(!was) run('on',EVENT.on);}
 },
 unlock(){ensure();}, // call from a user gesture so the browser allows sound
 action(k){if(prefs.on&&ACTION[k]) run(k,ACTION[k]);},
 card(){if(prefs.on) run('card',EVENT.card);},
 day(){if(prefs.on) run('day',EVENT.day);},
 // Call once per real second with {kind, level} or null. Plays a soft cry that repeats while the cue lasts.
 cry(info){
  if(!prefs.on) return;
  ticks++;
  if(!info){lastKey=''; return;}
  if(info.kind!=='coo'&&!prefs.cry) return;
  const lv=LEVEL[info.level]||LEVEL.calm, key=info.kind+'/'+info.level;
  if(key!==lastKey||ticks>=nextAt){
   lastKey=key; nextAt=ticks+lv.every;
   const s=CRY[info.kind]; if(!s) return;
   run('cry:'+key,t=>{for(let i=0;i<s.reps;i++) voice(t+i*(s.dur*lv.len+s.gap),{f0:s.f0*(info.level==='late'?1.12:1),f1:s.f1,dur:s.dur*lv.len,gain:lv.g,vib:info.level==='late'?7:5});});
  }
 },
 // Soft low noise while the baby sleeps.
 ambient(on){
  if(on&&prefs.on){
   if(amb) return;
   if(!ensure()) {note('ambient'); return;}
   note('ambient');
   try{
    const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain();
    s.buffer=noiseBuffer(); s.loop=true; f.type='lowpass'; f.frequency.value=420;
    g.gain.setValueAtTime(0.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.05,ctx.currentTime+1.5);
    s.connect(f); f.connect(g); g.connect(master); s.start(); amb={s,g};
   }catch(e){}
  }else if(amb){
   const a=amb; amb=null;
   try{a.g.gain.cancelScheduledValues(ctx.currentTime); a.g.gain.setValueAtTime(a.g.gain.value||.05,ctx.currentTime); a.g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+.8); a.s.stop(ctx.currentTime+.9);}catch(e){}
  }
 },
};
try{
 document.addEventListener('visibilitychange',()=>{ if(!ctx) return; if(document.hidden) ctx.suspend(); else if(prefs.on) ctx.resume(); });
}catch(e){}
window.F12_AUDIO=A;
})();
