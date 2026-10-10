'use strict';
// Uses a disposable Edge profile; never touches the user's Pixel/browser storage.
const {spawn}=require('child_process');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),port=9465;
const bin='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const url='file:///C:/Users/adria/adaptive-english/index.html';
const browser=spawn(bin,['--headless','--disable-gpu','--allow-file-access-from-files','--no-first-run','--remote-debugging-port='+port,'--user-data-dir='+process.env.TEMP+'\\grammar-quota-test-'+process.pid,url],{stdio:'ignore'});
async function main(){
 let page;
 for(let i=0;i<150;i++){try{const all=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();page=all.find(x=>x.type==='page'&&x.url.includes('adaptive-english/index.html'));if(page)break;}catch{}await sleep(150);}
 if(!page)throw Error('Browser page unavailable');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let n=0;const jobs=new Map();
 ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data),job=jobs.get(m.id);if(job){jobs.delete(m.id);job(m);}});
 const command=(method,params)=>new Promise(resolve=>{const id=++n;jobs.set(id,resolve);ws.send(JSON.stringify({id,method,params}));});
 const evalJS=async expression=>{const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.result?.exceptionDetails)throw Error(r.result.exceptionDetails.text);return r.result?.result?.value;};
 for(let i=0;i<150;i++){if(await evalJS('typeof state!=="undefined"&&!!state&&!!window.GrammarProgressDB'))break;await sleep(150);}
 const before=await evalJS('({ready:!!state,local:!!localStorage.getItem(STORAGE_KEY),indexed:!!window.GrammarProgressDB})');
 if(!before?.ready||!before?.indexed)throw Error('Boot or database library unavailable: '+JSON.stringify(before));
 const forced=await evalJS(`(async()=>{
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){if(this===localStorage&&k===STORAGE_KEY)throw new DOMException('test quota reached','QuotaExceededError');return original.call(this,k,v);};
  await new Promise(r=>setTimeout(r,50));
  state.level=77;state.sessions=5;state.history.push({qid:'indexed-only-verified',correct:true,ms:4200,ts:Date.now()});
  await save();
  const data=JSON.parse(await window.GrammarProgressDB.get(STORAGE_KEY));
  const local=JSON.parse(localStorage.getItem(STORAGE_KEY));
  return {dbLevel:data.level,dbSessions:data.sessions,dbMarker:data.history.at(-1).qid,localLevel:local.level,dbBytes:JSON.stringify(data).length};
 })()`);
 console.log('FORCED_QUOTA',JSON.stringify(forced));
 if(forced.dbLevel!==77||forced.dbMarker!=='indexed-only-verified'||forced.localLevel===77)throw Error('IndexedDB write/fallback not verified');
 const completion=await evalJS(`(async()=>{
  session={records:state.history.slice(-1).map(r=>({...r,correct:true,ms:6900,type:'correct'})),correct:15,automatic:3,mode:'training',target:11,rankBefore:skillRankPositions(),learningXp:160,bestCombo:15,recovered:0,masteredRewards:0};
  await finishSession();
  const written=JSON.parse(await window.GrammarProgressDB.get(STORAGE_KEY));
  return {dbLevel:written.level,dbSessions:written.sessions,lastLevel:written.sessionHistory.at(-1)?.level,marker:written.history.at(-1)?.qid};
 })()`);
 console.log('SESSION_UNDER_QUOTA',JSON.stringify(completion));
 if(completion.dbLevel!==78||completion.dbSessions!==6||completion.lastLevel!==77)throw Error('Finished session was not durably saved');
 await command('Page.reload',{ignoreCache:true});await sleep(500);
 for(let i=0;i<100;i++){if(await evalJS('typeof state!=="undefined"&&!!state&&state.level===78'))break;await sleep(130);}
 const restored=await evalJS('({level:state.level,sessions:state.sessions,marker:state.history.at(-1)?.qid,dbAvailable:!!window.GrammarProgressDB})');
 console.log('RELOAD',JSON.stringify(restored));
 if(restored.level!==78||restored.sessions!==6||restored.marker!=='indexed-only-verified')throw Error('Latest IndexedDB progress not restored');
 ws.close();console.log('PASS quota overflow persisted and restored without modifying localStorage progress');
}
main().catch(e=>{console.error('FAIL',e.stack||e);process.exitCode=1;}).finally(()=>{browser.kill();setTimeout(()=>process.exit(process.exitCode||0),400);});
