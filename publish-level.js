const fs=require('fs');
const cp=require('child_process');
const path=require('path');
const ROOT=__dirname;
const GIT='C:\\Program Files\\Git\\cmd\\git.exe';
const LEVEL_FILE=path.join(ROOT,'level.json');
const HISTORY_FILE=path.join(ROOT,'history.json');
const VERSION_FILE=path.join(ROOT,'version.json');
const LIVE='https://adrianxds-ads.github.io/adaptive-english/';
const VALIDATE_ONLY=process.argv.includes('--validate-only');
const stop=new Set('the a an and or but if to of in on at for with from by is are was were be been being this that these those i you he she it we they my your our their his her its do does did have has had will would can could should may might not'.split(' '));
function readJSON(p){return JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));}
function writeJSON(p,v){fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();}
function words(s){return new Set(norm(s).split(' ').filter(w=>w.length>2&&!stop.has(w)));}
function jaccard(a,b){const A=words(a),B=words(b);if(!A.size||!B.size)return 0;let i=0;for(const w of A)if(B.has(w))i++;return i/(A.size+B.size-i);}
function fail(msg){console.error('VALIDATION_FAILED: '+msg);process.exit(2);}
function git(args,opts={}){return cp.execFileSync(GIT,args,{cwd:ROOT,encoding:'utf8',maxBuffer:20*1024*1024,...opts}).trim();}
function stamp(){const d=new Date();const p=n=>String(n).padStart(2,'0');return `${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;}
async function sleep(ms){return new Promise(r=>setTimeout(r,ms));}async function main(){
  const data=readJSON(LEVEL_FILE);
  const history=fs.existsSync(HISTORY_FILE)?readJSON(HISTORY_FILE):{schemaVersion:1,questions:[]};
  if(!Number.isInteger(data.level)||data.level<1) fail('level must be a positive integer');
  if(data.nextLevel!==data.level+1) fail('nextLevel must equal level + 1');
  if(!Number.isInteger(data.testLevel)||data.testLevel<0||data.testLevel>100) fail('testLevel must be 0..100');
  if(!data.tip||!String(data.tip.title||'').trim()) fail('tip is missing');
  if(!data.priors||typeof data.priors!=='object') fail('priors are missing');
  if(!Array.isArray(data.questions)||data.questions.length!==15) fail('exactly 15 questions are required');
  const expected=new Set(Array.from({length:15},(_,i)=>data.level*100+i+1));
  const ids=new Set(); const texts=new Set();
  for(const q of data.questions){
    if(!Number.isInteger(q.id)||!expected.has(q.id)) fail(`unexpected question id ${q.id}`);
    if(ids.has(q.id)) fail(`duplicate id ${q.id}`); ids.add(q.id);
    const nq=norm(q.q); if(!nq) fail(`empty question ${q.id}`);
    if(texts.has(nq)) fail(`duplicate question text ${q.id}`); texts.add(nq);
    if(!q.cat||!q.domain||!q.rule||!q.trigger) fail(`metadata missing on ${q.id}`);
    if(!q.q.includes('___')) fail(`${q.id} must use a short cloze blank for the 10-second mobile format`);
    const qWords=q.q.trim().split(/\s+/).length;
    if(qWords>14) fail(`${q.id} question too long for 10 seconds: ${qWords} words (max 14)`);
    if(!Array.isArray(q.a)||q.a.length!==4) fail(`${q.id} must have four options`);
    const maxAnswerWords=Math.max(...q.a.map(x=>String(x).trim().split(/\s+/).length));
    if(maxAnswerWords>4) fail(`${q.id} answer option too long for mobile scanning: ${maxAnswerWords} words (max 4)`);
    if(new Set(q.a.map(norm)).size!==4) fail(`${q.id} has duplicate answer options`);
    if(!Number.isInteger(q.c)||q.c<0||q.c>3) fail(`${q.id} has invalid correct answer index`);
  }
  if(ids.size!==15||[...expected].some(x=>!ids.has(x))) fail('question ids must cover the full level range');
  const domains=new Set(data.questions.map(q=>norm(q.domain)));
  if(domains.size<12) fail(`insufficient context diversity: ${domains.size}/15 unique domains`);  const prior=(history.questions||[]).filter(h=>Number(h.level)<data.level);
  let closest={score:0,newQ:'',oldQ:'',oldLevel:null};
  for(const q of data.questions){
    for(const h of prior){
      if(norm(q.q)===norm(h.q)) fail(`historical exact repeat: ${q.q}`);
      const s=jaccard(q.q,h.q);
      if(s>closest.score) closest={score:s,newQ:q.q,oldQ:h.q,oldLevel:h.level};
      if(s>=0.50) fail(`question ${q.id} is too similar to LEVEL ${h.level}: ${(s*100).toFixed(0)}% overlap`);
    }
  }
  if(VALIDATE_ONLY){
    console.log(`VALIDATED_ONLY LEVEL ${data.level}: 15 questions, ${domains.size} domains, closest historical similarity ${(closest.score*100).toFixed(0)}%`);
    return;
  }
  const updatedHistory=(history.questions||[]).filter(h=>Number(h.level)!==data.level);
  for(const q of data.questions) updatedHistory.push({level:data.level,id:q.id,cat:q.cat,domain:q.domain,q:q.q});
  updatedHistory.sort((a,b)=>a.id-b.id);
  const now=new Date(); const day=now.toISOString().slice(0,10);
  data.schemaVersion=1; data.updated=day; data.build=`L${data.level}-${stamp()}`;
  history.schemaVersion=1; history.updated=day; history.questions=updatedHistory;
  writeJSON(LEVEL_FILE,data); writeJSON(HISTORY_FILE,history);
  writeJSON(VERSION_FILE,{build:data.build,level:data.level,test_level:data.testLevel,updated:day});
  console.log(`VALIDATED LEVEL ${data.level}: 15 questions, ${domains.size} domains`);
  console.log(`Closest historical similarity: ${(closest.score*100).toFixed(0)}% (LEVEL ${closest.oldLevel||'-'})`);
  git(['add','level.json','history.json','version.json']);
  let staged=''; try{staged=git(['diff','--cached','--name-only']);}catch{}
  if(!staged) fail('nothing staged to publish');
  git(['commit','-m',`Publish Adaptive English LEVEL ${data.level} (${data.build})`]);
  git(['push','origin','main']);
  console.log(`PUSHED ${data.build}`);  let ok=false;
  for(let attempt=1;attempt<=20;attempt++){
    try{
      const bust=Date.now();
      const [vr,lr]=await Promise.all([
        fetch(LIVE+'version.json?t='+bust,{cache:'no-store'}),
        fetch(LIVE+'level.json?t='+(bust+1),{cache:'no-store'})
      ]);
      if(vr.ok&&lr.ok){
        const v=await vr.json(), l=await lr.json();
        if(v.build===data.build&&v.level===data.level&&l.build===data.build&&l.level===data.level&&Array.isArray(l.questions)&&l.questions.length===15){
          ok=true;
          console.log(`LIVE VERIFIED attempt ${attempt}: LEVEL ${l.level}, TEST ${l.testLevel}%, BUILD ${l.build}`);
          break;
        }
      }
    }catch(e){}
    await sleep(3000);
  }
  if(!ok) fail('push succeeded, but live GitHub Pages verification did not complete in time');
  console.log('PUBLISH_COMPLETE');
}
main().catch(err=>{console.error(err);process.exit(1);});