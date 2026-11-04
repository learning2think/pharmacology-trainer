(function(root){
 'use strict';
 const METHODS=new Set(['test','rx-template','self']);
 function shuffle(values,rng=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
 function cycle(pool,order,previousId,rng=Math.random){
  const unique=[...new Map(pool.map(c=>[c.id,c])).values()];
  if(order==='sequential')return unique.map((c,i)=>({c,i})).sort((a,b)=>((a.c.sequence??a.c.ticket)-(b.c.sequence??b.c.ticket))||a.i-b.i).map(x=>x.c);
  const a=shuffle(unique,rng);if(a.length>1&&a[0].id===previousId)[a[0],a[1]]=[a[1],a[0]];return a;
 }
 function move(s){s.index++;if(s.index<s.queue.length)return true;if(!s.infinite)return false;const last=s.queue[s.queue.length-1]?.id;s.round++;s.queue=cycle(s.pool,s.order,last);s.index=0;return true}
 function validProgress(v){
  if(!v||v.version!==1||!v.cards||Array.isArray(v.cards)||typeof v.cards!=='object'||!Array.isArray(v.history))return false;
  return Object.values(v.cards).every(c=>c&&Number.isInteger(c.attempts)&&c.attempts>=0&&Number.isInteger(c.correct)&&c.correct>=0&&c.correct<=c.attempts&&Number.isInteger(c.streak)&&c.streak>=0&&typeof c.lastOK==='boolean'&&Number.isFinite(c.due)&&Number.isFinite(c.last))&&v.history.every(h=>h&&typeof h.id==='string'&&typeof h.ok==='boolean'&&Number.isFinite(h.at)&&METHODS.has(h.method));
 }
 function totalsFrom(history){return history.reduce((a,r)=>{const k=r.method==='self'?'self':'objective';a[k]++;if(r.ok)a[k+'Correct']++;return a},{objective:0,objectiveCorrect:0,self:0,selfCorrect:0})}
 function validTotals(t){return t&&['objective','objectiveCorrect','self','selfCorrect'].every(k=>Number.isSafeInteger(t[k])&&t[k]>=0)&&t.objectiveCorrect<=t.objective&&t.selfCorrect<=t.self}
 function normalizeState(v){const s=validProgress(v)?v:{version:1,cards:{},history:[],notes:{}};s.totals=validTotals(s.totals)?s.totals:totalsFrom(s.history);const key=new Date().toDateString();if(!s.day||s.day.key!==key||!Number.isSafeInteger(s.day.answers)||s.day.answers<0)s.day={key,answers:s.history.filter(r=>new Date(r.at).toDateString()===key).length};s.history=s.history.slice(-5000);return s}
 function addHistory(s,r){const key=new Date(r.at).toDateString();if(s.day.key!==key)s.day={key,answers:0};s.day.answers++;const k=r.method==='self'?'self':'objective';s.totals[k]++;if(r.ok)s.totals[k+'Correct']++;s.history.push(r);if(s.history.length>5000)s.history.splice(0,s.history.length-5000)}
 function snapshot(s){return {infinite:true,poolIds:s.pool.map(c=>c.id),queueIds:s.queue.map(c=>c.id),index:s.index,round:s.round,order:s.order,format:s.format,title:s.title,answered:s.answered,completed:s.completed,correct:s.correct,self:s.self,objective:s.objective,selfCorrect:s.selfCorrect,objectiveCorrect:s.objectiveCorrect,results:s.results.slice(-500),updated:Date.now()}}
 function restore(saved,lookup){
  if(!saved||saved.infinite!==true||!['sequential','random'].includes(saved.order)||!['choice','recall'].includes(saved.format)||!Array.isArray(saved.poolIds)||!Array.isArray(saved.queueIds)||typeof saved.title!=='string')return null;
  const pool=saved.poolIds.map(lookup),queue=saved.queueIds.map(lookup);if(!pool.length||pool.some(x=>!x)||queue.some(x=>!x)||new Set(pool.map(c=>c.id)).size!==pool.length||queue.length!==pool.length||new Set(queue.map(c=>c.id)).size!==pool.length||queue.some(c=>!saved.poolIds.includes(c.id)))return null;
  if(!['index','round','completed','correct','self','objective','selfCorrect','objectiveCorrect'].every(k=>Number.isSafeInteger(saved[k])&&saved[k]>=0)||saved.index>=queue.length||saved.round<1||typeof saved.answered!=='boolean'||saved.completed!==saved.self+saved.objective||saved.correct!==saved.selfCorrect+saved.objectiveCorrect||saved.selfCorrect>saved.self||saved.objectiveCorrect>saved.objective)return null;
  const s={...saved,pool,queue,results:Array.isArray(saved.results)?saved.results.filter(r=>r&&typeof r.id==='string'&&typeof r.ok==='boolean'&&METHODS.has(r.method)).slice(-500):[],answered:false,revealed:false,options:null,finished:false};
  if(saved.answered)move(s);return s;
 }
 root.PharmaEngine={cycle,move,validProgress,normalizeState,addHistory,snapshot,restore,totalsFrom};
})(typeof window!=='undefined'?window:globalThis);
