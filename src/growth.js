/* First 12 Weeks — baby growth model.
 *
 * Data: WHO Child Growth Standards, "Simplified field tables", birth to 13 weeks, percentiles
 * (3rd, 15th, 50th, 85th, 97th), weight in kg, length and head circumference in cm.
 *   https://www.who.int/tools/child-growth-standards/standards/weight-for-age
 *   https://www.who.int/tools/child-growth-standards/standards/length-height-for-age
 *   https://www.who.int/tools/child-growth-standards/standards/head-circumference-for-age
 * Values are copied exactly as printed in the WHO tables. Index = age in weeks (0 = birth … 13).
 *
 * Game simplifications (say so if you change them):
 *  - Boys' and girls' tables are averaged, so the game makes no assumption about the baby's sex.
 *  - Each baby gets a fixed "channel" (a z-score) and follows it, with a small wobble, because healthy
 *    babies track along their own curve. Percentile = normal CDF of that z-score.
 *  - Week 1 shows a small dip below birth weight (most babies lose a little weight in the first days
 *    and are back at birth weight by about 2-3 weeks, per NHS). The size of the dip is a game choice.
 *  - Content status: pending clinical review (see CLAUDE.md).
 * Keep this file free of Math.random so the seeded balance test is not disturbed. */
(function(){
'use strict';
const K = ['p3','p15','p50','p85','p97'];
const Z = [-1.881, -1.036, 0, 1.036, 1.881]; // z-scores of the 3rd, 15th, 50th, 85th and 97th percentiles
const T = {
 weight:{
  boys:{
   p3:[2.5,2.6,2.8,3.1,3.4,3.6,3.8,4.1,4.3,4.4,4.6,4.8,4.9,5.1],
   p15:[2.9,3.0,3.2,3.5,3.8,4.1,4.3,4.5,4.7,4.9,5.1,5.3,5.5,5.6],
   p50:[3.3,3.5,3.8,4.1,4.4,4.7,4.9,5.2,5.4,5.6,5.8,6.0,6.2,6.4],
   p85:[3.9,4.0,4.3,4.7,5.0,5.3,5.6,5.9,6.2,6.4,6.6,6.8,7.0,7.2],
   p97:[4.3,4.5,4.9,5.2,5.6,5.9,6.3,6.5,6.8,7.1,7.3,7.5,7.7,7.9]},
  girls:{
   p3:[2.4,2.5,2.7,2.9,3.1,3.3,3.5,3.7,3.9,4.1,4.2,4.3,4.5,4.6],
   p15:[2.8,2.9,3.1,3.3,3.5,3.8,4.0,4.2,4.4,4.5,4.7,4.8,5.0,5.1],
   p50:[3.2,3.3,3.6,3.8,4.1,4.3,4.6,4.8,5.0,5.2,5.4,5.5,5.7,5.8],
   p85:[3.7,3.9,4.1,4.4,4.7,5.0,5.3,5.5,5.7,5.9,6.1,6.3,6.5,6.7],
   p97:[4.2,4.4,4.6,5.0,5.3,5.6,5.9,6.1,6.4,6.6,6.8,7.0,7.2,7.4]}},
 length:{
  boys:{
   p3:[46.3,47.5,48.8,49.8,50.7,51.7,52.5,53.4,54.1,54.9,55.6,56.3,56.9,57.6],
   p15:[47.9,49.1,50.4,51.4,52.4,53.3,54.2,55.0,55.8,56.6,57.3,58.0,58.7,59.3],
   p50:[49.9,51.1,52.3,53.4,54.4,55.3,56.2,57.1,57.9,58.7,59.4,60.1,60.8,61.4],
   p85:[51.8,53.1,54.3,55.4,56.4,57.4,58.3,59.1,60.0,60.7,61.5,62.2,62.9,63.5],
   p97:[53.4,54.7,55.9,57.0,58.0,59.0,59.9,60.8,61.6,62.4,63.2,63.9,64.6,65.2]},
  girls:{
   p3:[45.6,46.8,47.9,48.8,49.7,50.5,51.3,52.1,52.8,53.4,54.1,54.7,55.3,55.8],
   p15:[47.2,48.4,49.5,50.5,51.4,52.2,53.0,53.8,54.5,55.2,55.8,56.4,57.0,57.6],
   p50:[49.1,50.3,51.5,52.5,53.4,54.2,55.1,55.8,56.6,57.3,57.9,58.6,59.2,59.8],
   p85:[51.1,52.3,53.5,54.5,55.4,56.3,57.1,57.9,58.7,59.4,60.1,60.7,61.4,62.0],
   p97:[52.7,53.9,55.1,56.1,57.0,57.9,58.8,59.6,60.4,61.1,61.8,62.5,63.1,63.7]}},
 head:{
  boys:{
   p3:[32.1,32.9,33.7,34.3,34.9,35.4,35.9,36.3,36.7,37.0,37.4,37.7,38.0,38.3],
   p15:[33.1,33.9,34.7,35.3,35.9,36.4,36.8,37.3,37.7,38.0,38.4,38.7,39.0,39.3],
   p50:[34.5,35.2,35.9,36.5,37.1,37.6,38.1,38.5,38.9,39.2,39.6,39.9,40.2,40.5],
   p85:[35.8,36.4,37.1,37.7,38.3,38.8,39.3,39.7,40.1,40.5,40.8,41.1,41.4,41.7],
   p97:[36.9,37.5,38.1,38.7,39.3,39.8,40.3,40.7,41.1,41.4,41.8,42.1,42.4,42.7]},
  girls:{
   p3:[31.7,32.4,33.1,33.7,34.2,34.6,35.0,35.4,35.7,36.1,36.4,36.7,36.9,37.2],
   p15:[32.7,33.3,34.0,34.6,35.2,35.6,36.0,36.4,36.8,37.1,37.4,37.7,38.0,38.2],
   p50:[33.9,34.6,35.2,35.8,36.4,36.8,37.3,37.7,38.0,38.4,38.7,39.0,39.3,39.5],
   p85:[35.1,35.8,36.4,37.0,37.6,38.1,38.5,38.9,39.3,39.6,39.9,40.2,40.5,40.8],
   p97:[36.1,36.7,37.4,38.0,38.6,39.1,39.5,39.9,40.3,40.6,41.0,41.3,41.6,41.9]}},
};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,f)=>a+(b-a)*f;

// Sex-averaged percentile values at a (possibly fractional) week.
function quantiles(m,week){
 const w=clamp(week,0,13), i=Math.floor(w), j=Math.min(i+1,13), f=w-i, t=T[m];
 return K.map(k=>lerp((t.boys[k][i]+t.girls[k][i])/2,(t.boys[k][j]+t.girls[k][j])/2,f));
}
// Measurement at z-score z (piecewise linear between the table's percentile points).
function valueAt(m,week,z){
 const q=quantiles(m,week);
 const s=clamp(z<=Z[0]?0:z>=Z[4]?3:Z.findIndex((_,k)=>z>=Z[k]&&z<Z[k+1]),0,3);
 return lerp(q[s],q[s+1],(z-Z[s])/(Z[s+1]-Z[s]));
}
function zOf(m,week,value){
 const q=quantiles(m,week);
 const s=clamp(value<=q[0]?0:value>=q[4]?3:q.findIndex((_,k)=>value>=q[k]&&value<q[k+1]),0,3);
 return lerp(Z[s],Z[s+1],(value-q[s])/(q[s+1]-q[s]));
}
function erf(x){ // Abramowitz & Stegun 7.1.26
 const s=x<0?-1:1; x=Math.abs(x);
 const t=1/(1+0.3275911*x);
 const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);
 return s*y;
}
const percentile=z=>Math.round(clamp(50*(1+erf(z/Math.SQRT2)),1,99));
const ordinal=n=>{const r=n%100; if(r>=11&&r<=13) return n+'th'; return n+({1:'st',2:'nd',3:'rd'}[n%10]||'th');};

function defaultRng(){
 try{const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]/4294967296;}
 catch(e){return (Date.now()%100003)/100003;}
}
// A baby's growth profile: a z-score channel for each measurement plus a wobble phase.
function newBaby(rng){
 rng=rng||defaultRng;
 const zw=(rng()-0.5)*2;                              // weight channel: about 16th to 84th percentile
 const zl=clamp(0.5*zw+(rng()-0.5),-1.2,1.2);         // length loosely follows weight
 const zh=clamp(0.4*zw+(rng()-0.5),-1.2,1.2);
 return {zw,zl,zh,pw:rng()*6.28,pl:rng()*6.28,ph:rng()*6.28};
}
const WOBBLE=0.12;
const DIP=0.96; // game choice: week-1 weight is 96% of birth weight (see header)
const r1=v=>Math.round(v*10)/10, r2=v=>Math.round(v*100)/100;

function one(m,week,z){
 const q=quantiles(m,week);
 return {z,pct:percentile(z),lo:q[0],mid:q[2],hi:q[4]};
}
// Measurements for a baby at a given age in weeks (0 = birth, 1…12 = game weeks).
function measure(baby,week){
 const zw=baby.zw+WOBBLE*Math.sin(1.3*week+baby.pw);
 const zl=baby.zl+WOBBLE*Math.sin(1.1*week+baby.pl);
 const zh=baby.zh+WOBBLE*Math.sin(1.5*week+baby.ph);
 const w=one('weight',week,zw), l=one('length',week,zl), h=one('head',week,zh);
 w.v=r2(valueAt('weight',week,zw)); l.v=r1(valueAt('length',week,zl)); h.v=r1(valueAt('head',week,zh));
 w.dip=false;
 if(week===1){ w.v=r2(measure(baby,0).weight.v*DIP); w.dip=true; }
 return {week,weight:w,length:l,head:h};
}
const lbOz=kg=>{let oz=Math.round(kg*35.274), lb=Math.floor(oz/16); oz-=lb*16; return {lb,oz};};
const inches=cm=>Math.round(cm/2.54*10)/10;

window.F12_GROWTH={T,K,Z,quantiles,valueAt,zOf,percentile,ordinal,newBaby,measure,lbOz,inches};
})();
