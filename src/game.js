(function(){
'use strict';
/* First 12 Weeks — game loop, simulation and rendering. Content lives in content.js. */
const START_HOUR = 7;
const SAVE_KEY = 'first12weeks.v2'; // v2: added the baby's growth profile (S.g)
const {CARDS, WEEKS, CUES, LESSON} = window.F12_CONTENT;
const G = window.F12_GROWTH;
const CARD = Object.fromEntries(CARDS.map(c=>[c.id,c]));

const MAP = {hunger:'feed', sleep:'sleep', diaper:'change', gas:'burp', purple:'soothe', bath:'bath', bored:'play'};
const ACTIONS = [
 ['feed','🍼','Feed'],['burp','🫧','Burp'],['change','🧷','Change'],
 ['sleep','🌙','Put down'],['soothe','🤱','Hold & soothe'],['play','🧸','Tummy time'],
 ['bath','🛁','Bath'],['rest','😴','Rest'],['help','🤝','Ask for help'],
];
const FX = {feed:'🍼',burp:'🫧',change:'✨',sleep:'💤',soothe:'💛',play:'🧸',bath:'🫧'};

function cfg(w){
 return {
  feedInterval: w<=2?150 : w<=6?170 : w<=9?190 : 210,
  awakeWindow: 45 + w*4,
  feedDur: w<=2?30 : w<=6?25 : 20,
  purple: (w>=5&&w<=8)?0.012 : (w>=3&&w<=10)?0.004 : 0,
  nap:[30, 55+w*4],
  night:[90+w*10, 150+w*20],
  // Parent energy: strain scales passive drain and the cost of each care action.
  // It rises with the crying peak (weeks 5–8) and eases either side. Rest recovers
  // energy more slowly than a real night's sleep because naps are short and broken.
  strain: (w>=5&&w<=8)?1.5 : (w>=3&&w<=10)?1.25 : 1,
  restRate: 0.15,
 };
}

/* ============ State ============ */
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const freshStats=()=>({feeds:0,wet:0,dirty:0,sleep:0,right:0,cues:0,tummy:0,baths:0,helps:0,cry:0});
function freshBaby(){return {hunger:45,sleepy:15,diaper:null,dAge:0,gas:0,sinceFeed:150,hyg:45,asleep:false,sleepLeft:0,awake:0,purple:0,sincePlay:30,over:0,busy:null};}
function fresh(){return {v:2,g:G.newBaby(),week:1,min:0,speed:1,paused:false,meters:false,b:freshBaby(),p:{energy:85,resting:false,helpsToday:0},helper:0,ws:freshStats(),total:freshStats(),cards:[],flags:{},started:false,dayOver:false,inSummary:false,finished:false};}
let S = fresh();
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const r=localStorage.getItem(SAVE_KEY); if(!r) return null; const o=JSON.parse(r); return o&&o.v===2&&o.g?o:null;}catch(e){return null;}}

/* ============ Clock ============ */
const clockMin=()=>(START_HOUR*60+S.min)%1440;
const hour=()=>clockMin()/60;
const isNight=()=>{const h=hour(); return h>=21||h<6;};
const fmt=()=>{const m=clockMin(); return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
function darkness(){const h=hour(); if(h>=22||h<5) return .42; if(h>=19) return (h-19)/3*.42; if(h<7) return (7-h)/2*.42; return 0;}
function sleepLen(){const c=cfg(S.week); const r=isNight()?c.night:c.nap; return Math.round(rand(r[0],r[1]));}

/* ============ Needs ============ */
function needs(){
 const b=S.b; if(b.asleep) return [];
 const L=[{k:'hunger',v:b.hunger},{k:'sleep',v:b.sleepy}];
 if(b.diaper) L.push({k:'diaper',v:Math.min(95,(b.diaper==='dirty'?42:34)+b.dAge*1.1)});
 if(b.gas>0 && b.sinceFeed>=2) L.push({k:'gas',v:Math.min(90,40+(b.sinceFeed-2)*1.6)});
 if(b.purple>0) L.push({k:'purple',v:92});
 if(b.hyg>70) L.push({k:'bath',v:Math.min(55,36+(b.hyg-70)*0.6)});
 const mx=Math.max(...L.map(x=>x.v));
 if(mx<35 && b.awake>=8 && b.sincePlay>=45) L.push({k:'bored',v:Math.min(58,38+(b.awake-8)*0.3)});
 return L.sort((a,c)=>c.v-a.v);
}
function top(){const L=needs(); return L.length&&L[0].v>=35?L[0]:null;}
const level=v=>v<35?'calm':v<60?'early':v<85?'mid':'late';

/* ============ Simulation ============ */
function wake(){
 const b=S.b; b.asleep=false; b.awake=0; b.sleepLeft=0;
 if(S.p.resting){S.p.resting=false;}
 if(!S.helper) toast('Baby is waking up.','info');
}
function putToSleep(){const b=S.b; b.asleep=true; b.sleepLeft=sleepLen(); if(b.diaper==='dirty') b.sleepLeft=Math.round(b.sleepLeft*0.5); b.awake=0; b.over=0; b.purple=0;}

function stepMinute(){
 const b=S.b,p=S.p,c=cfg(S.week),night=isNight();
 S.min++;
 if(b.busy==='feed'){b.hunger=0;b.sinceFeed=0;} else b.sinceFeed++;
 b.sincePlay++;
 if(b.asleep){
  b.hunger=clamp(b.hunger+100/c.feedInterval*(night&&S.week>=9?0.6:0.85));
  b.sleepy=clamp(b.sleepy-1.5);
  b.sleepLeft--; S.ws.sleep++;
  if(b.sleepLeft<=0||b.hunger>=80) wake();
 }else{
  if(b.busy!=='feed') b.hunger=clamp(b.hunger+100/c.feedInterval);
  b.sleepy=clamp(b.sleepy+100/c.awakeWindow*(night?1.25:1)*(b.busy==='feed'?0.4:1));
  b.awake++;
  if(b.sleepy>=100){
   b.over++;
   if(b.over>=35&&!b.busy){putToSleep(); toast('Exhausted, baby finally dozed off in your arms. You laid them in the crib, on their back.','info'); learn('overtired');}
  }else b.over=0;
 }
 if(b.gas>0&&b.sinceFeed>60) b.gas=0;
 if(b.diaper&&!b.asleep) b.dAge++;
 else{
  const pWet=b.sinceFeed<60?1/40:1/160;
  const pDirty=(S.week<=4?1/200:1/380)*(b.sinceFeed<40?2:1);
  const r=Math.random();
  if(r<pDirty){b.diaper='dirty';b.dAge=0;}
  else if(r<pDirty+pWet){b.diaper='wet';b.dAge=0;}
 }
 b.hyg=clamp(b.hyg+100/1500);
 const h=hour();
 if(b.purple>0) b.purple--;
 else if(!b.asleep&&c.purple&&h>=17&&h<23&&Math.random()<c.purple){b.purple=Math.round(rand(25,55));}
 const t=top(); if(t&&t.v>=85) S.ws.cry++;
 // helper shift
 if(S.helper>0){
  S.helper--;
  if(!b.asleep){
   if(b.hunger>=50){b.hunger=0;b.sinceFeed=0;S.ws.feeds++;}
   if(b.diaper){b.diaper==='wet'?S.ws.wet++:S.ws.dirty++; b.diaper=null;b.dAge=0;}
   b.gas=0;
   if(b.purple>0) b.purple=Math.max(0,b.purple-1);
   if(b.sleepy>=45&&b.hunger<60) putToSleep();
  }
  if(S.helper===0) toast('Your helper hands baby back. You got some real rest.','ok');
 }
 if(S.helper>0) p.energy=clamp(p.energy+0.3);
 else if(p.resting&&b.asleep) p.energy=clamp(p.energy+c.restRate);
 else p.energy=clamp(p.energy-(night?0.12:0.05)*c.strain);
 if(p.energy<20&&!S.flags.lowE){S.flags.lowE=true; toast('You’re running on empty. Rest when baby sleeps, or ask for help — that’s part of the job, not a failure.','learn'); learn('help');}
 if(S.min>=1440) S.dayOver=true;
}
function advance(n,k){S.b.busy=k; for(let i=0;i<n&&!S.dayOver;i++) stepMinute(); S.b.busy=null; if(S.dayOver) endDay();}

/* ============ Actions ============ */
const EFF={
 feed(t){const b=S.b;
  if(b.hunger<30) return {msg:'Turns away from the feed — not hungry yet.',dur:3};
  const late=b.hunger>=85; let msg;
  if(late){msg='Fed — but it took a while to calm down enough to latch on. Feeding on early cues is easier for both of you.'; learn('cues');}
  else if(t&&t.k==='hunger'&&level(t.v)==='early'){msg='Fed on an early cue — calm and easy.'; learn('cues');}
  else msg=isNight()?'A quiet night feed. Night feeds are normal and important.':'A good feed. Content and milk-drunk.';
  if(b.sinceFeed<80){msg+=' Feeds this close together? That’s cluster feeding — normal, especially in the evening.'; learn('cluster');}
  S.ws.feeds++; b.gas=rand(45,80);
  return {msg,dur:cfg(S.week).feedDur};
 },
 burp(){const b=S.b;
  if(b.gas<=0) return {msg:'No burp needed right now.',dur:2};
  b.gas=0; learn('burp');
  return {msg:'Upright on your shoulder, gentle pats… a very satisfying burp.',dur:5};
 },
 change(){const b=S.b;
  if(!b.diaper) return {msg:'Still clean and dry. Checking is never wrong.',dur:2};
  let msg;
  if(b.diaper==='wet'){S.ws.wet++; msg='Wet nappy changed. Counting wet nappies tells you feeding is going well.'; learn('nappies');}
  else{S.ws.dirty++; msg=S.week===1?'Poo is shifting from dark and sticky toward mustard yellow — right on track.':'Yellow, seedy poo — perfectly normal.'; learn('poo');}
  b.diaper=null; b.dAge=0;
  return {msg,dur:5};
 },
 sleep(){const b=S.b,L=needs();
  if(b.hunger>=60) return {msg:'Fusses as soon as you lay them down — too hungry to settle.',dur:5};
  if(b.diaper==='dirty'&&b.dAge>=5) return {msg:'Squirms and protests in the crib — a dirty nappy needs changing first.',dur:5};
  if(b.sleepy<40) return {msg:'Wide awake and protesting. Not tired yet.',dur:4};
  const windy=b.gas>0&&b.sinceFeed>=2;
  const over=b.sleepy>=85; putToSleep(); learn('safesleep'); if(over) learn('overtired');
  if(windy){b.sleepLeft=Math.round(b.sleepLeft*0.4); learn('burp');}
  const wrap=S.week<8?'Swaddled (loose at the hips), on their back, in an empty crib.':'In a sleep sack, on their back, in an empty crib.';
  return {msg:(over?'Overtired — it took a while to settle. ':'Drifting off. ')+wrap+(windy?' Trapped wind may wake them early — burping after feeds helps.':''),dur:over?20:8};
 },
 soothe(t){const b=S.b;
  if(b.purple>0){b.purple=Math.max(0,b.purple-15); learn('purple'); if(S.p.energy<40) learn('nevershake');
   return {msg:b.purple?'Rocking, shushing, walking… a little calmer. Some crying has no fix — staying calm with them is the job.':'The storm passes. You stayed with them through it.',dur:10};}
  if(b.gas>0) b.gas=Math.max(1,b.gas-20);
  learn('soothe');
  if(!t) return {msg:'A lovely cuddle. You can’t spoil a newborn with holding.',dur:10,counts:false};
  return {msg:'Holding calms them for a moment, but the need is still there.',dur:10};
 },
 play(t){const b=S.b;
  if(t&&t.k!=='bored'&&t.v>=50) return {msg:'Not now — too unsettled for tummy time.',dur:2};
  if(b.sleepy>=55) return {msg:'Turns away and starts to fuss — getting tired. Looking away is a “break please” cue.',dur:3};
  b.sincePlay=0; b.sleepy=clamp(b.sleepy+8); S.ws.tummy++; learn('tummy');
  let msg='Tummy time on the mat, then faces and chat. Short sessions add up.';
  if(S.week>=6&&!S.flags.smile){S.flags.smile=true; learn('smile'); msg='Tummy time, then face to face… and a real social smile! 💛';}
  else if(S.week>=10){learn('talk'); msg='Tummy time, then cooing back and forth. Your voice is their favourite sound.';}
  return {msg,dur:10,counts:!!t};
 },
 bath(){const b=S.b;
  if(b.hyg<35) return {msg:'Pretty clean already — 2–3 baths a week is plenty.',dur:2,counts:false};
  b.hyg=0; S.ws.baths++; b.sleepy=clamp(b.sleepy+6);
  if(S.week<=2){learn('stump'); return {msg:'A gentle sponge bath, keeping the cord stump clean and dry.',dur:15};}
  learn('bath'); return {msg:'Warm bath (about 37°C), one hand on baby the whole time.',dur:15};
 },
};

function act(k){
 if(!S.started||S.paused||modalOpen||S.dayOver) return;
 if(S.helper>0){toast('Your helper is on shift — enjoy the break.','info'); return;}
 if(k==='rest') return doRest();
 if(k==='help') return doHelp();
 const b=S.b;
 if(b.asleep){toast('Baby is asleep. Let them sleep — and rest if you can.','info'); return;}
 const t=top(), L=needs();
 const r=EFF[k](t);
 let judge='';
 if(t&&r.counts!==false){
  S.ws.cues++;
  const matched=MAP[t.k]===k||L.some(n=>MAP[n.k]===k&&n.v>=55);
  if(matched){S.ws.right++; judge='right';} else judge='wrong';
 }
 const msg=r.msg+(judge==='wrong'?'<br>'+LESSON[t.k]:'');
 toast(msg,judge==='right'?'ok':judge==='wrong'?'learn':'info',true);
 popFx(FX[k]);
 S.p.energy=clamp(S.p.energy-(isNight()?2:0.5)*cfg(S.week).strain);
 if(r.dur) advance(r.dur,k);
 render(); save();
}
function doRest(){
 if(!S.b.asleep){toast('Resting needs someone else on baby duty. Baby’s awake — try “Ask for help”.','info',true); return;}
 S.p.resting=!S.p.resting;
 toast(S.p.resting?'Resting while baby sleeps. Time passes faster.':'Back up and about.','info',true);
 render(); save();
}
function doHelp(){
 if(S.p.helpsToday>=2){toast('Your helper has gone home for today. Tomorrow’s another day.','info',true); return;}
 S.p.helpsToday++; S.ws.helps++; S.helper=120; S.p.resting=false; learn('help');
 toast('Your partner takes a 2-hour shift. You get some real rest.','ok',true);
 render(); save();
}

/* ============ Learning cards ============ */
function learn(id){
 if(!CARD[id]||S.cards.includes(id)) return;
 S.cards.push(id);
 toast('📖 New learning card: <b>'+CARD[id].t+'</b>','card');
}

/* ============ Health panel (growth from src/growth.js + today's tallies) ============ */
const wide=window.matchMedia('(min-width:900px)');
const barPos=z=>Math.max(2,Math.min(98,(z+2.4)/4.8*100));
function growthRow(label,o,text,alt,extra,range,showPct){
 const pct=showPct?'around the '+G.ordinal(o.pct)+' percentile':'';
 const lo=barPos(G.Z[0]), hi=barPos(G.Z[4]);
 const bar=showPct?'<div class="gbar" role="img" aria-label="'+label+': '+pct+'. Typical range '+range+'"><i class="band" style="left:'+lo.toFixed(1)+'%;width:'+(hi-lo).toFixed(1)+'%"></i><i class="tick"></i><i class="dot" style="left:'+barPos(o.z).toFixed(1)+'%"></i></div>':'';
 const note=showPct?'Typical range at this age: '+range+' · '+pct:range;
 return '<div class="gr"><div class="gr-top"><span>'+label+'</span><b>'+text+'</b></div>'+
  '<div class="gr-sub">'+alt+(extra?' · '+extra:'')+'</div>'+bar+'<div class="gr-note">'+note+'</div></div>';
}
function healthHTML(){
 const m=G.measure(S.g,S.week), birth=G.measure(S.g,0), prev=G.measure(S.g,S.week-1), ws=S.ws;
 const w=m.weight, l=m.length, h=m.head;
 const lo=Math.round(w.lo*100)/100, hi=Math.round(w.hi*100)/100;
 const lb=G.lbOz(w.v);
 let wExtra;
 if(w.dip) wExtra='down '+Math.round((1-w.v/birth.weight.v)*100)+'% from birth';
 else wExtra='up '+(Math.round((w.v-prev.weight.v)*100)*10)+' g since last week';
 const wRange=w.dip?'Most babies lose a little weight in the first days and are back to birth weight by about 2–3 weeks. Percentiles start from week 2.':lo.toFixed(1)+'–'+hi.toFixed(1)+' kg';
 const cm=(o,v)=>o.lo.toFixed(1)+'–'+o.hi.toFixed(1)+' cm';
 const stat=(k,v,n)=>'<div class="stat"><span>'+k+(n?'<small>'+n+'</small>':'')+'</span><span class="v">'+v+'</span></div>';
 return '<h3>Growth <small>(WHO standards)</small></h3>'+
  growthRow('Weight',w,w.v.toFixed(2)+' kg',lb.lb+' lb '+lb.oz+' oz',wExtra,wRange,!w.dip)+
  growthRow('Length',l,l.v.toFixed(1)+' cm',G.inches(l.v)+' in','+'+(l.v-birth.length.v).toFixed(1)+' cm since birth',cm(l),true)+
  growthRow('Head',h,h.v.toFixed(1)+' cm',G.inches(h.v)+' in','+'+(h.v-birth.head.v).toFixed(1)+' cm since birth',cm(h),true)+
  '<p class="muted hp-note">Healthy babies follow their own curve — there is no “best” number, and the trend matters more than one reading. Boys’ and girls’ WHO values are averaged here. For a real baby, ask your midwife, health visitor or doctor.</p>'+
  '<h3>Today so far</h3>'+
  stat('Feeds',ws.feeds,'Typical: 8–12 in 24 h')+
  stat('Wet / dirty nappies',ws.wet+' / '+ws.dirty,'Expect 6+ wet a day after day 5')+
  stat('Baby’s sleep',(ws.sleep/60).toFixed(1)+' h','Newborns: roughly 14–17 h a day')+
  stat('Tummy time',ws.tummy+(ws.tummy===1?' session':' sessions'))+
  stat('Baths',ws.baths);
}
let lastHealth='';
function updateHealth(){
 const m=G.measure(S.g,S.week);
 $('hsText').textContent=m.weight.v.toFixed(2)+' kg · '+m.length.v.toFixed(1)+' cm';
 if(!wide.matches) return;
 const html='<div class="kicker">Week '+S.week+' of 12</div><h2>Baby’s health</h2>'+healthHTML();
 if(html!==lastHealth){$('healthSide').innerHTML=html; lastHealth=html;}
}
function openHealth(){
 learn('growth');
 modal('<div class="kicker">Week '+S.week+' of 12</div><h2>Baby’s health</h2>'+healthHTML()+
  '<p class="muted" style="font-size:12.5px">Source: WHO Child Growth Standards. A game simplification, educational only and not medical advice.</p>',[{label:'Close',primary:true}]);
}

/* ============ Toasts ============ */
let tq=[],tShowing=null,tTimer=null;
function toast(html,kind,front){
 const item={html,kind:kind||'info'};
 if(front){tq=tq.filter(x=>x.kind==='card'); tq.unshift(item); showNext(true);}
 else{tq.push(item); if(tq.length>4) tq.shift(); if(!tShowing) showNext();}
}
function showNext(force){
 if(tShowing&&!force) return;
 clearTimeout(tTimer);
 const el=document.getElementById('toasts');
 const it=tq.shift();
 if(!it){tShowing=null; return;}
 tShowing=it;
 el.innerHTML='<div class="toast '+it.kind+'">'+it.html+'</div>';
 if(it.kind==='card') el.firstChild.onclick=openJournal;
 tTimer=setTimeout(()=>{tShowing=null; showNext();}, it.kind==='card'?2600:(it.kind==='learn'?6500:4500));
}

/* ============ Rendering ============ */
const $=id=>document.getElementById(id);
function babyMarkup(m){
 const ink='#3a2e2a', st='stroke="'+ink+'" stroke-width="1.8" fill="none" stroke-linecap="round"';
 const E={
  open:'<circle cx="-8" cy="-16" r="2.8" fill="'+ink+'"/><circle cx="8" cy="-16" r="2.8" fill="'+ink+'"/><circle cx="-7" cy="-17" r=".9" fill="#fff"/><circle cx="9" cy="-17" r=".9" fill="#fff"/>',
  closed:'<path d="M-12 -16 q4 3.5 8 0 M4 -16 q4 3.5 8 0" '+st+'/>',
  happy:'<path d="M-12 -15 q4 -4.5 8 0 M4 -15 q4 -4.5 8 0" '+st+'/>',
  squeeze:'<path d="M-13 -19 l7 2.6 l-7 2.6 M13 -19 l-7 2.6 l7 2.6" '+st+'/>',
  brows:'<path d="M-12 -23 l7 1.8 M12 -23 l-7 1.8" '+st+'/>',
 };
 const M={
  calm:'<path d="M-4 -5 q4 2.6 8 0" '+st+'/>',
  smile:'<path d="M-7 -6 q7 8 14 0 z" fill="#b9615c" stroke="'+ink+'" stroke-width="1.4"/>',
  o:'<ellipse cx="0" cy="-5" rx="3" ry="2.6" fill="#9b4a48"/>',
  fuss:'<path d="M-5 -3 q5 -3.8 10 0" '+st+'/>',
  cry:'<ellipse cx="0" cy="-4" rx="6.5" ry="5.2" fill="#9b4a48"/><ellipse cx="0" cy="-2" rx="3.5" ry="2" fill="#d98a86"/>',
 };
 let eyes=E.open, mouth=M.calm, extra='', blush=.45;
 if(m==='sleep'){eyes=E.closed; mouth=M.calm;}
 else if(m==='smile'){eyes=E.happy; mouth=M.smile;}
 else if(m==='alert'){eyes=E.open; mouth=M.o;}
 else if(m==='early'){eyes=E.open; mouth=M.o;}
 else if(m==='mid'){eyes=E.open+E.brows; mouth=M.fuss; blush=.7;}
 else if(m==='late'){eyes=E.squeeze; mouth=M.cry; blush=.95; extra='<path d="M-15 -12 q-2 5 0 7 q2 -2 0 -7z M15 -12 q-2 5 0 7 q2 -2 0 -7z" fill="#8cc3ea"/>';}
 return '<path d="M-26 6 Q-31 42 0 46 Q31 42 26 6 Q14 -1 0 -1 Q-14 -1 -26 6Z" fill="#bcd3e8"/>'+
  '<path d="M-20 14 Q0 26 20 14" stroke="#a5c0da" stroke-width="2" fill="none"/>'+
  '<circle cx="-21" cy="-14" r="5" fill="#f1c6ad"/><circle cx="21" cy="-14" r="5" fill="#f1c6ad"/>'+
  '<circle cx="0" cy="-14" r="21" fill="#f6d3bd"/>'+
  '<path d="M-5 -34 q3 -7 8 -2" stroke="#7a5a44" stroke-width="2.2" fill="none" stroke-linecap="round"/>'+
  '<circle cx="-13" cy="-8" r="4.2" fill="#f19c92" opacity="'+blush+'"/><circle cx="13" cy="-8" r="4.2" fill="#f19c92" opacity="'+blush+'"/>'+
  eyes+mouth+extra+
  (m==='sleep'?'<g class="zzz" fill="#6d8fb5" font-family="Nunito" font-weight="800"><text x="20" y="-34" font-size="12">z</text><text x="29" y="-44" font-size="9">z</text></g>':'');
}
let lastMood='';
function render(){
 const b=S.b,p=S.p,t=top();
 $('wkLabel').textContent='Week '+S.week+' of 12';
 $('wkTitle').textContent=WEEKS[S.week].t;
 $('clock').textContent=fmt();
 const night=isNight(); $('dayIcon').textContent=night?'🌙':'☀️';
 $('dayFill').style.width=Math.min(100,S.min/1440*100)+'%';
 $('bPause').textContent=S.paused?'▶':'❚❚';
 $('bSpeed').textContent=S.speed+'×';
 // scene
 const h=hour();
 const sky=night?'#2f3b63':(h>=18||h<7)?'#f0b99a':'#bfe0f2';
 $('sky').setAttribute('fill',sky);
 $('sun').setAttribute('fill',night?'#f4f1dc':'#ffd36b');
 $('sun').setAttribute('r',night?7:9);
 $('stars').setAttribute('opacity',night?1:0);
 $('night').setAttribute('opacity',darkness().toFixed(2));
 $('lampGlow').setAttribute('opacity',night?1:(h>=19||h<7)?.5:0);
 let mood;
 if(b.asleep) mood='sleep';
 else if(!t) mood=(S.flags.smile&&b.sincePlay<30)?'smile':'calm';
 else if(t.k==='bored') mood=S.flags.smile?'smile':'alert';
 else mood=level(t.v);
 const pos=b.asleep?'translate(297 146) scale(.6)':'translate(180 178) scale(.88)';
 $('babyPos').setAttribute('transform',pos);
 if(mood!==lastMood){$('baby').innerHTML=babyMarkup(mood); lastMood=mood;}
 $('baby').setAttribute('class',mood==='late'?'w3':mood==='mid'?'w2':mood==='early'?'w1':'breath');
 // cue panel
 const lvl=$('cueLvl');
 if(S.helper>0){$('cueText').textContent='Your helper has baby. Nothing to do but rest.'; lvl.className='lvl sleep'; lvl.textContent='Resting';}
 else if(b.asleep){
  $('cueText').textContent=p.resting?'Asleep on their back. You’re resting too.':'Asleep on their back in an empty crib. A good moment to rest.';
  lvl.className='lvl sleep'; lvl.textContent='Asleep';
 }else if(!t){
  $('cueText').textContent=S.week>=6?'Content and calm. Watching you, making little sounds.':'Content and calm, looking around.';
  lvl.className='lvl calm'; lvl.textContent='Calm';
 }else{
  const L=level(t.v), c=CUES[t.k];
  let txt=c[L]||c.late||c.mid||c.early;
  const sec=needs().find(n=>n.k!==t.k&&n.v>=50);
  if(sec){const sc=CUES[sec.k], sl=level(sec.v); const st=sc[sl]||sc.mid||sc.early; if(st) txt+=' Also: '+st.charAt(0).toLowerCase()+st.slice(1);}
  $('cueText').textContent=txt;
  const names={early:'Early cue',mid:'Getting louder',late:'Crying'};
  lvl.className='lvl '+L; lvl.textContent=t.k==='bored'?'Alert':names[L];
 }
 $('helperBanner').hidden=!(S.helper>0);
 // energy
 const e=Math.round(p.energy);
 $('eFill').style.width=e+'%';
 $('eFill').style.background=e<25?'#c9574a':e<50?'#d9a441':'#6f9473';
 $('eNum').textContent=e;
 // meters
 const m=$('meters'); m.hidden=!S.meters;
 if(S.meters){
  const rows=[['Hunger',b.hunger],['Tired',b.asleep?0:b.sleepy],['Nappy',b.diaper?(b.diaper==='dirty'?80:50):0],['Wind',b.gas>0?60:0]];
  m.innerHTML=rows.map(r=>'<div class="m"><span>'+r[0]+'</span><div class="bar"><i style="width:'+Math.round(r[1])+'%;background:#c96f4a"></i></div></div>').join('');
 }
 // actions
 const hintK=(S.meters&&t&&!b.asleep)?MAP[t.k]:null;
 document.querySelectorAll('.act').forEach(el=>{
  const k=el.dataset.k;
  el.classList.toggle('hint',k===hintK);
  el.classList.toggle('soft',(b.asleep||S.helper>0)&&k!=='rest'&&k!=='help');
  if(k==='rest'){el.classList.toggle('on',p.resting); el.querySelector('.lb').textContent=p.resting?'Stop resting':'Rest';}
 });
 updateHealth();
}
function popFx(emoji){
 if(!emoji) return;
 const b=S.b, x=b.asleep?297:180, y=b.asleep?100:128;
 const g=$('fx');
 g.innerHTML='<text class="popfx" x="'+(x+18)+'" y="'+y+'" font-size="18">'+emoji+'</text>';
}

/* ============ Modals ============ */
let modalOpen=false;
function modal(html,buttons){
 modalOpen=true;
 const sh=$('sheet');
 sh.innerHTML=html+'<div class="btns">'+buttons.map((b,i)=>'<button class="btn'+(b.primary?' primary':'')+'" data-i="'+i+'">'+b.label+'</button>').join('')+'</div>';
 sh.querySelectorAll('.btns .btn').forEach(el=>el.onclick=()=>{const b=buttons[+el.dataset.i]; if(!b.keep) closeModal(); b.fn&&b.fn();});
 $('overlay').hidden=false; sh.scrollTop=0;
}
function closeModal(){modalOpen=false; $('overlay').hidden=true;}

function startScreen(){
 const saved=load();
 const html='<div class="kicker">A gentle newborn care sim</div><h2>First 12 Weeks</h2>'+
  '<p>One nursery. One newborn. Twelve weeks, one day per week.</p>'+
  '<h3>How it works</h3><ul>'+
  '<li><b>Read the cue.</b> Babies tell you what they need long before they cry. Watch, then choose the care that fits.</li>'+
  '<li><b>There’s no losing.</b> A wrong guess just teaches you the cue you missed.</li>'+
  '<li><b>Look after yourself too.</b> Rest when baby sleeps, and accept help.</li>'+
  '<li>Every action unlocks <b>learning cards</b> based on public health guidance.</li></ul>'+
  '<label class="toggle"><span>Easy mode: show need meters & hints</span><input type="checkbox" id="optMeters"'+(S.meters?' checked':'')+'></label>'+
  '<p class="muted" style="font-size:12.5px">A day lasts about 5 minutes at 1×. Educational only, not medical advice.</p>';
 const btns=[];
 if(saved&&saved.started&&!saved.finished) btns.push({label:'Continue — Week '+saved.week,primary:true,fn:()=>{const mm=readMeters(); S=saved; S.meters=mm; S.paused=false; S.dayOver=false; S.inSummary=false; if(S.min>=1440){S.dayOver=true; endDay();} render();}});
 btns.push({label:saved&&saved.started&&!saved.finished?'Start over':'Start week 1',primary:!(saved&&saved.started&&!saved.finished),fn:()=>{const mm=readMeters(); S=fresh(); S.meters=mm; S.started=true; weekIntro();}});
 modal(html,btns);
}
function readMeters(){const el=document.getElementById('optMeters'); return el?el.checked:S.meters;}

function weekIntro(){
 const w=WEEKS[S.week];
 const html='<div class="kicker">Week '+S.week+' of 12</div><h2>'+w.t+'</h2><h3>This week</h3><ul>'+w.n.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
 modal(html,[{label:'Start the day (7:00)',primary:true,fn:()=>{w.c.forEach(learn); render(); save();}}]);
}

function pct(a,b){return b?Math.round(a/b*100)+'%':'—';}
function endDay(){
 if(S.inSummary) return; S.inSummary=true;
 const ws=S.ws; Object.keys(ws).forEach(k=>S.total[k]+=ws[k]);
 save();
 const row=(l,v,n)=>'<div class="stat"><span>'+l+(n?'<small>'+n+'</small>':'')+'</span><span class="v">'+v+'</span></div>';
 const html='<div class="kicker">Week '+S.week+' complete</div><h2>'+(S.week===12?'You made it.':'Day done.')+'</h2>'+
  row('Feeds',ws.feeds,'Typical newborn: 8–12 in 24 h')+
  row('Wet / dirty nappies',ws.wet+' / '+ws.dirty,'Expect 6+ wet a day after day 5')+
  row('Baby’s sleep',(ws.sleep/60).toFixed(1)+' h','Newborns: roughly 14–17 h')+
  row('Cue reading',pct(ws.right,ws.cues)+' <small>'+ws.right+' of '+ws.cues+'</small>','Picking the care that matched the strongest cue')+
  row('Tummy time',ws.tummy+' sessions')+
  row('Help accepted',ws.helps+(ws.helps?' 💛':''))+
  row('Learning cards',S.cards.length+' / '+CARDS.length)+
  '<p class="muted" style="font-size:12.5px">Numbers are a learning mirror, not a score. Real babies vary a lot.</p>';
 if(S.week===12){
  modal(html,[{label:'See your 12 weeks',primary:true,fn:finale}]);
 }else{
  modal(html,[{label:'On to week '+(S.week+1),primary:true,fn:nextWeek},{label:'Open learning journal',keep:true,fn:()=>{openJournal(); }}]);
 }
}
function nextWeek(){
 S.week++; S.min=0; S.dayOver=false; S.inSummary=false; S.ws=freshStats(); S.b=freshBaby();
 S.p.energy=Math.max(S.p.energy,75); S.p.resting=false; S.p.helpsToday=0; S.helper=0;
 save(); render(); weekIntro();
}
function finale(){
 S.finished=true; save();
 const T=S.total;
 const html='<div class="kicker">Twelve weeks</div><h2>From strangers to a team</h2>'+
  '<div class="stat"><span>Feeds given</span><span class="v">'+T.feeds+'</span></div>'+
  '<div class="stat"><span>Nappies changed</span><span class="v">'+(T.wet+T.dirty)+'</span></div>'+
  '<div class="stat"><span>Cue reading overall</span><span class="v">'+pct(T.right,T.cues)+'</span></div>'+
  '<div class="stat"><span>Learning cards</span><span class="v">'+S.cards.length+' / '+CARDS.length+'</span></div>'+
  '<h3>Before the real thing</h3><ul><li>Set up a safe sleep space: firm flat mattress, nothing else in the crib.</li><li>Agree how you’ll share nights and who your “help” people are.</li><li>Save your doctor’s and health visitor’s numbers, and know the fever rule.</li><li>Consider an antenatal or newborn-care class.</li></ul>';
 modal(html,[{label:'Open learning journal',keep:true,fn:openJournal},{label:'Play again',primary:true,fn:()=>{const mm=S.meters; S=fresh(); S.meters=mm; S.started=true; weekIntro();}}]);
}

function openJournal(){
 const wasOpen=modalOpen, prev=wasOpen?$('sheet').innerHTML:null;
 const got=CARDS.filter(c=>S.cards.includes(c.id));
 const html='<div class="kicker">Learning journal</div><h2>'+got.length+' of '+CARDS.length+' cards</h2>'+
  CARDS.map(c=>S.cards.includes(c.id)?'<div class="cardx"><b>'+c.t+'</b>'+c.b+'<div class="src">Source: '+c.s+'</div></div>':'<div class="cardx locked">🔒 Keep caring to unlock</div>').join('')+
  '<p class="muted" style="font-size:12.5px">Summaries of public guidance for learning purposes. Not medical advice — always follow your own healthcare team.</p>';
 if(wasOpen&&S.inSummary){
  modal(html,[{label:'Back',primary:true,fn:()=>{S.inSummary=false; endDayReshow();}}]);
 }else modal(html,[{label:'Close',primary:true}]);
}
function endDayReshow(){Object.keys(S.ws).forEach(k=>S.total[k]-=S.ws[k]); if(S.finished){finale(); return;} endDay();}

function openMenu(){
 const html='<div class="kicker">Settings</div><h2>Options</h2>'+
  '<label class="toggle"><span>Easy mode: need meters & hints</span><input type="checkbox" id="mMeters"'+(S.meters?' checked':'')+'></label>'+
  '<h3>Testing</h3><p class="muted" style="font-size:13px">Jump ahead to try later weeks.</p>';
 const apply=()=>{const el=$('mMeters'); if(el) S.meters=el.checked; render(); save();};
 modal(html,[
  {label:'Done',primary:true,fn:apply},
  {label:'Skip to end of this day',fn:()=>{apply(); S.min=1440; S.dayOver=true; endDay();}},
  {label:'About & sources',keep:true,fn:()=>{apply(); openAbout();}},
  {label:'Restart from week 1',fn:()=>{apply(); startScreen();}},
 ]);
}
function openAbout(){
 const html='<div class="kicker">About</div><h2>First 12 Weeks</h2>'+
  '<p>An open-source, no-fail learning game for expecting parents and anyone curious about what the newborn months involve. Prototype v0.1.</p>'+
  '<h3>Design principles</h3><ul><li>Teach cue-reading, not button-mashing.</li><li>No failure state; wrong guesses explain the cue.</li><li>Honest about tiredness and crying, without punishing the player.</li><li>Parent wellbeing is part of the loop.</li></ul>'+
  '<h3>Content sources</h3><ul>'+
  '<li><a href="https://www.healthychildren.org" target="_blank" rel="noopener">American Academy of Pediatrics — HealthyChildren.org</a></li>'+
  '<li><a href="https://www.nhs.uk/conditions/baby/" target="_blank" rel="noopener">NHS — Baby</a></li>'+
  '<li><a href="https://www.cdc.gov/ncbddd/actearly/milestones/" target="_blank" rel="noopener">CDC — Developmental milestones</a></li>'+
  '<li><a href="https://dontshake.org" target="_blank" rel="noopener">National Center on Shaken Baby Syndrome</a></li>'+
  '<li><a href="https://www.thensf.org" target="_blank" rel="noopener">National Sleep Foundation</a></li></ul>'+
  '<p class="muted" style="font-size:12.5px">Educational only and not medical advice. Content pending clinical review. Always follow your midwife, doctor or health visitor.</p>';
 modal(html,[{label:'Close',primary:true}]);
}

/* ============ Wiring ============ */
$('actions').innerHTML=ACTIONS.map(a=>'<button class="act" data-k="'+a[0]+'" aria-label="'+a[2]+'"><span class="ic" aria-hidden="true">'+a[1]+'</span><span class="lb">'+a[2]+'</span></button>').join('');
document.querySelectorAll('.act').forEach(el=>el.onclick=()=>act(el.dataset.k));
$('bPause').onclick=()=>{S.paused=!S.paused; render(); save();};
$('bSpeed').onclick=()=>{S.speed=S.speed===1?2:S.speed===2?4:1; render(); save();};
$('bJournal').onclick=()=>{if(!modalOpen) openJournal();};
$('bMenu').onclick=()=>{if(!modalOpen) openMenu();};
$('bHealth').onclick=()=>{if(!modalOpen) openHealth();};
wide.addEventListener&&wide.addEventListener('change',()=>{lastHealth=''; render();});
$('aboutLink').onclick=e=>{e.preventDefault(); if(!modalOpen) openAbout();};

let ticks=0;
setInterval(()=>{
 if(!S.started||modalOpen) return;
 if(S.dayOver){ if(!S.inSummary) endDay(); return; }
 if(S.paused) return;
 const fast=(S.helper>0||(S.p.resting&&S.b.asleep))?4:1;
 const n=5*S.speed*fast;
 for(let i=0;i<n&&!S.dayOver;i++) stepMinute();
 if(S.dayOver) endDay();
 render();
 if(++ticks%5===0) save();
},1000);

render();
startScreen();
window.__F12={get S(){return S;},stepMinute,act,needs,top};
})();
