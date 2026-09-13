
const INITIAL_PRIORS = {"would_rather":[0.18,0.12,0.17],"inversion":[0.37,0.25,0.3],"third_conditional":[0.35,0.19,0.28],"allow_to":[0.45,0.3,0.34],"neednt_have":[0.25,0.16,0.2],"should_have":[0.28,0.18,0.23],"modal_deduction":[0.3,0.18,0.25],"wish_past":[0.88,0.79,0.78],"wish_present":[0.55,0.4,0.45],"mixed_conditional":[0.58,0.43,0.47],"causative":[0.14,0.08,0.15],"passive":[0.55,0.4,0.45],"backshift":[0.72,0.47,0.55],"past_perfect":[0.72,0.6,0.6],"unless":[0.24,0.12,0.24],"despite":[0.42,0.31,0.36],"so_such":[0.6,0.46,0.48],"too_enough":[0.55,0.4,0.44],"look_forward":[0.82,0.74,0.72],"get_used_to":[0.75,0.62,0.64],"used_to":[0.84,0.73,0.72],"make_bare":[0.84,0.74,0.73],"whose":[0.86,0.79,0.78],"second_conditional":[0.65,0.5,0.56],"had_better":[0.65,0.52,0.56]};
const APP_VERSION = "2.0";
const STORAGE_KEY = "adaptive_english_campaign1_v1";
const GLOBAL_LEVEL_KEY = "adaptive_english_global_level_v1";
const SESSION_SIZE = 15;
const TIME_LIMIT = 10;
const HISTORY_LIMIT = 6000;
const SESSION_HISTORY_LIMIT = 1000;
const VISUAL_SYSTEM=window.ADRIAN_VISUAL_SYSTEM||null;
const COLOR_BANDS_15=(VISUAL_SYSTEM?.ranks||["#2B1B18","#3A211D","#52231F","#6B2926","#84352C","#A34B2A","#B96B25","#9A8128","#6E8735","#3F8F4B","#278C70","#2D7FA3","#3F63B2","#6B4AB8","#E2B84B"]).map(x=>typeof x==="string"?x:x.color);
let CAMPAIGN=null, BANK=[], state=null, session=null, timerHandle=null, deadline=0, current=null, locked=false;
let audioCtx=null, soundOn=true, lastTickShown=TIME_LIMIT+1;

const $=id=>document.getElementById(id);
function applyVisualSystemTokens(){const r=document.documentElement;COLOR_BANDS_15.forEach((c,i)=>r.style.setProperty(`--rank-${i+1}`,c));r.style.setProperty("--reward-gold",COLOR_BANDS_15[14]);r.style.setProperty("--elite-violet",COLOR_BANDS_15[13]);r.style.setProperty("--negative-wine",COLOR_BANDS_15[3]);}
function storedGlobalLevel(){try{return Math.max(1,Math.floor(Number(localStorage.getItem(GLOBAL_LEVEL_KEY))||1));}catch(e){return 1;}}
function syncGlobalLevel(level){const n=Math.max(1,Math.floor(Number(level)||1),storedGlobalLevel());try{localStorage.setItem(GLOBAL_LEVEL_KEY,String(n));}catch(e){}return n;}
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const pct=x=>Math.round(x*100);
const fmtSec=ms=>(ms/1000).toFixed(1)+"s";
const stageNames=["Foundations","Control","Complex Grammar","Fluency","Automaticity","Mastery"];
const RATING_BANDS=[
  {min:0,key:"forest",name:"FOUNDATION"},
  {min:.35,key:"teal",name:"BUILDING"},
  {min:.50,key:"blue",name:"SOLID"},
  {min:.65,key:"indigo",name:"STRONG"},
  {min:.78,key:"amber",name:"ADVANCED"},
  {min:.88,key:"gold",name:"GOLD MASTERY"}
];
function ratingBand(r){
  let b=RATING_BANDS[0];
  for(const x of RATING_BANDS) if(r>=x.min)b=x;
  return b;
}
function applyRatingTheme(r){
  const b=ratingBand(r);
  document.body.dataset.ratingBand=b.key;
  const meta=document.querySelector('meta[name="theme-color"]');
  const colors={forest:'#10271d',teal:'#0f3030',blue:'#122b46',indigo:'#242849',amber:'#3a2b13',gold:'#49390d'};
  if(meta)meta.setAttribute('content',colors[b.key]||colors.forest);
}
function audioSupported(){return !!(window.AudioContext||window.webkitAudioContext);}
async function ensureAudio(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC){soundOn=false;refreshSoundButton();return false;}
    if(!audioCtx)audioCtx=new AC();
    if(audioCtx.state==='suspended')await audioCtx.resume();
    const ok=audioCtx.state==='running';if(!ok){soundOn=false;refreshSoundButton();}return ok;
  }catch(e){console.warn("Audio unavailable",e);soundOn=false;refreshSoundButton();return false;}
}
function tone(freq,dur=.035,gain=.018,type='sine',delay=0){
  if(!soundOn||!audioCtx||audioCtx.state!=='running')return;
  const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.01);
}
function playTick(strong=false,step=0){const f=strong?(step%2?1540:1260):(step%2?1280:980);tone(f,strong?.034:.026,strong?.026:.016,'square');}
function playCorrect(){const notes=[440,587.33,783.99,1046.5];notes.forEach((f,i)=>{tone(f,i===3?.11:.052,i===3?.024:.020,i%2?'sine':'triangle',i*.047);if(i>0)tone(f*2,.032,.007,'sine',i*.047+.012);});}
function playWrong(){tone(311.13,.050,.020,'triangle');tone(220,.070,.017,'sine',.042);}
function playComplete(){tone(392,.075,.022,'sine');tone(523.25,.085,.024,'triangle',.070);tone(659.25,.100,.026,'sine',.145);tone(783.99,.155,.028,'sine',.230);}
function playCountdownStep(n){tone(n===1?1046.5:783.99,.055,.018,'triangle');}
function playLevelClear(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>{tone(f,i===3?.18:.075,i===3?.029:.021,i%2?'sine':'triangle',i*.075);if(i===3)tone(1318.5,.11,.010,'sine',i*.075+.045);});}
function playLevelMiss(){tone(246.94,.075,.015,'triangle');tone(196,.095,.012,'sine',.065);}
function haptic(ok){
  try{if(navigator.vibrate)navigator.vibrate(ok?18:[24,16,42]);}catch(e){}
}
function pulseFeedback(ok){
  const cls=ok?"feedback-correct":"feedback-wrong";
  document.body.classList.remove("feedback-correct","feedback-wrong");
  void document.body.offsetWidth;
  document.body.classList.add(cls);
  setTimeout(()=>document.body.classList.remove(cls),430);
}
function burstParticles(anchor){
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const layer=$("particles");if(!layer)return;
  const r=anchor&&anchor.getBoundingClientRect?anchor.getBoundingClientRect():null;
  const cx=r?r.left+r.width/2:innerWidth/2,cy=r?r.top+r.height/2:innerHeight*.55;
  const colors=["#ffffff","#8fd7b0","#f4d35e","#79a9d1","#f3a56b"];
  for(let i=0;i<6;i++){
    const p=document.createElement("i"),a=(Math.PI*2*i/6)+(Math.random()-.5)*.28,d=26+Math.random()*42;
    p.className="particle";p.style.left=cx+"px";p.style.top=cy+"px";
    p.style.setProperty("--dx",Math.cos(a)*d+"px");p.style.setProperty("--dy",Math.sin(a)*d+"px");
    p.style.setProperty("--rot",Math.round((Math.random()-.5)*180)+"deg");p.style.setProperty("--size",(4+Math.random()*4)+"px");
    p.style.setProperty("--delay",Math.round(Math.random()*70)+"ms");p.style.setProperty("--particle-color",colors[i%colors.length]);
    layer.appendChild(p);setTimeout(()=>p.remove(),460);
  }
}
function refreshSoundButton(){const b=$("soundBtn");if(!b)return;if(!audioSupported()){soundOn=false;b.disabled=true;b.textContent='🔇';b.setAttribute('aria-label','Audio unavailable');b.title='Audio unavailable';return;}b.disabled=false;b.textContent=soundOn?'🔊':'🔇';b.setAttribute('aria-label',soundOn?'Sound on':'Sound off');b.title='';}

async function loadCampaign(){
  if(window.__AE_CAMPAIGN__) return window.__AE_CAMPAIGN__;
  const r=await fetch("./campaign-01.json");
  if(!r.ok) throw new Error("Cannot load campaign");
  return r.json();
}

function seedMetric(cat){
  const p=INITIAL_PRIORS[cat]||[.42,.28,.34];
  return {k:p[0],a:p[1],t:p[2],attempts:0,correct:0,automatic:0,lapses:0,streak:0,interval:1,lastLevel:-99,lastTs:0,intervalDays:1,domains:{},lastMs:0};
}
function newState(){
  const metrics={}; CAMPAIGN.skills.forEach(s=>metrics[s.id]=seedMetric(s.id));
  return {
    schemaVersion:1,campaignId:CAMPAIGN.campaignId,level:Math.max(CAMPAIGN.startingLevel||1,storedGlobalLevel()),sessions:0,totalAttempts:0,
    metrics,seen:{},templateLast:{},templateSeen:{},history:[],sessionHistory:[],finalAttempts:0,completed:false,contentRevision:3,
    dailyKey:{date:"",cat:""},keyring:[],keyJourneyStart:"",personalBestFluency:0,createdAt:Date.now(),updatedAt:Date.now()
  };
}
function validProgressState(s){
  return !!s&&typeof s==="object"&&s.campaignId===CAMPAIGN.campaignId&&s.schemaVersion===1&&
    s.metrics&&typeof s.metrics==="object"&&Number.isFinite(s.level)&&Number.isFinite(s.sessions)&&
    Number.isFinite(s.totalAttempts)&&(s.history==null||Array.isArray(s.history))&&
    (s.sessionHistory==null||Array.isArray(s.sessionHistory))&&(s.seen==null||typeof s.seen==="object");
}
function normaliseProgressState(s){
  s.level=syncGlobalLevel(s.level);
  for(const skill of CAMPAIGN.skills)if(!s.metrics[skill.id])s.metrics[skill.id]=seedMetric(skill.id);
  s.history=Array.isArray(s.history)?s.history.slice(-HISTORY_LIMIT):[];
  s.sessionHistory=Array.isArray(s.sessionHistory)?s.sessionHistory.slice(-SESSION_HISTORY_LIMIT):[];
  s.seen=s.seen&&typeof s.seen==="object"?s.seen:{};s.templateLast=s.templateLast&&typeof s.templateLast==="object"?s.templateLast:{};s.templateSeen=s.templateSeen&&typeof s.templateSeen==="object"?s.templateSeen:{};
  s.dailyKey=s.dailyKey&&typeof s.dailyKey==="object"?s.dailyKey:{date:"",cat:""};s.keyring=Array.isArray(s.keyring)?s.keyring.filter(x=>x&&typeof x.cat==="string").slice(0,25):[];const firstKeyDate=s.keyring.map(x=>x.firstDate).filter(Boolean).sort()[0]||s.dailyKey.date||"";s.keyJourneyStart=typeof s.keyJourneyStart==="string"&&s.keyJourneyStart?s.keyJourneyStart:firstKeyDate;s.keyring.forEach((x,i)=>x.number=i+1);const rebuildTemplateSeen=!Object.keys(s.templateSeen).length;
  for(const skill of CAMPAIGN.skills){const m=s.metrics[skill.id];if(!Number.isFinite(m.intervalDays))m.intervalDays=1;if(!Number.isFinite(m.lastTs))m.lastTs=0;}
  for(const r of s.history){const m=s.metrics[r.cat];if(m&&Number.isFinite(r.ts)&&r.ts>(m.lastTs||0))m.lastTs=r.ts;if(rebuildTemplateSeen&&r.templateId){const g=s.templateSeen[r.templateId]||(s.templateSeen[r.templateId]={count:0,lastTs:0,lastLevel:-99});g.count++;if((r.ts||0)>g.lastTs){g.lastTs=r.ts||0;g.lastLevel=r.level??g.lastLevel;}}}
  if((s.contentRevision||1)<2){
    const revisedCats=new Set(["despite","unless","whose"]),revisedFp=new Set(CAMPAIGN.questions.filter(q=>revisedCats.has(q.cat)).map(q=>q.fingerprint));
    for(const fp of Object.keys(s.seen))if(revisedFp.has(fp))delete s.seen[fp];
    for(const t of Object.keys(s.templateLast))if(t.startsWith("despite-")||t.startsWith("unless-")||t.startsWith("whose-"))delete s.templateLast[t];
    s.contentRevision=2;
  }
  if((s.contentRevision||2)<3){
    const revisedCats=new Set(["mixed_conditional","modal_deduction"]),revisedFp=new Set(CAMPAIGN.questions.filter(q=>revisedCats.has(q.cat)).map(q=>q.fingerprint));
    for(const fp of Object.keys(s.seen))if(revisedFp.has(fp))delete s.seen[fp];
    for(const t of Object.keys(s.templateLast))if(t.startsWith("mixed-")||t.startsWith("deduct-"))delete s.templateLast[t];
    for(const t of Object.keys(s.templateSeen))if(t.startsWith("mixed-")||t.startsWith("deduct-"))delete s.templateSeen[t];
    s.contentRevision=3;
  }
  return s;
}
function loadState(){
  try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");return validProgressState(s)?normaliseProgressState(s):newState();}
  catch(e){return newState();}
}
function save(){
  state.updatedAt=Date.now();state.history=state.history.slice(-HISTORY_LIMIT);state.sessionHistory=state.sessionHistory.slice(-SESSION_HISTORY_LIMIT);
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  catch(e){console.error("Progress save failed",e);state.history=state.history.slice(-3000);state.sessionHistory=state.sessionHistory.slice(-500);localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
}

function metricMastery(m){return .45*m.k+.35*m.a+.20*m.t;}
function recentRows(n=75){return state.history.slice(-n);}
function recentWrong(cat,n=20){
  const r=state.history.filter(x=>x.cat===cat).slice(-n);
  return r.length?r.filter(x=>!x.correct).length/r.length:0;
}
function recentFastWrong(cat,n=50){return state.history.slice(-n).filter(x=>x.cat===cat&&x.type==="fast-wrong").length;}
function elapsedDays(ts){return Number.isFinite(ts)&&ts>0?Math.max(0,(Date.now()-ts)/86400000):0;}
function skillTimeDue(m){
  if(!m||!m.attempts||!m.lastTs)return {due:false,overdue:0,elapsed:0};
  const elapsed=elapsedDays(m.lastTs),target=Math.max(.5,m.intervalDays||1);
  return {due:elapsed>=target,overdue:Math.max(0,elapsed-target),elapsed};
}
function catPriority(cat){
  const m=state.metrics[cat],weak=(1-m.k)*.42+(1-m.a)*.33+(1-m.t)*.25;
  const sessionDue=(state.level-m.lastLevel)>=m.interval,timeDue=skillTimeDue(m);
  const due=(sessionDue||timeDue.due)?.09:0;
  const sessionOver=Math.max(0,(state.level-m.lastLevel)-m.interval),timeOver=timeDue.overdue;
  const overdue=Math.min(.14,sessionOver*.012+timeOver*.035);
  const errors=recentWrong(cat)*.13,misconception=Math.min(.10,recentFastWrong(cat)*.025);
  return weak+due+overdue+errors+misconception;
}
function overallStats(){
  const metrics=Object.values(state.metrics),history=recentRows(75);
  const coverage=Object.keys(state.seen).length/CAMPAIGN.questions.length;
  const mastery=mean(metrics.map(metricMastery));
  const minSkill=Math.min(...metrics.map(metricMastery));
  const accuracy=history.length?history.filter(r=>r.correct).length/history.length:0;
  const auto=history.length?history.filter(r=>r.type==="automatic").length/history.length:0;
  const avgMs=history.length?Math.round(mean(history.map(r=>r.ms))):0;
  const speed=history.length?mean(history.map(r=>r.correct?r.speedScore:0)):0;
  const transfer=mean(metrics.map(m=>m.t));
  const fluency=history.length?clamp(.50*accuracy+.30*speed+.20*transfer):0;
  // AE Rating is the competence indicator. LEVEL remains the session number.
  const rating=history.length?clamp(.35*accuracy+.25*speed+.20*transfer+.20*mastery):0;
  const mastered=metrics.filter(m=>metricMastery(m)>=.80&&m.a>=.65&&m.attempts>=8).length;
  const keysUnlocked=Math.min(25,Array.isArray(state.keyring)?state.keyring.length:0);
  const eligible=coverage>=.999&&mastery>=.85&&minSkill>=.70&&keysUnlocked>=25;
  return {coverage,mastery,minSkill,accuracy,auto,avgMs,speed,transfer,fluency,rating,mastered,keysUnlocked,eligible};
}
function campaign2Readiness(){
  const st=overallStats(),metrics=Object.values(state.metrics),learning=learningScoreStats();
  const breadth=metrics.filter(m=>metricMastery(m)>=.55).length/metrics.length;
  const strong=metrics.filter(m=>metricMastery(m)>=.70).length/metrics.length;
  const weak=metrics.filter(m=>metricMastery(m)<.40).length;
  const evidence=clamp((state.totalAttempts||0)/2400),curve=clamp((learning.current??st.mastery*100)/100);
  const score=clamp(.30*st.coverage+.30*st.mastery+.15*breadth+.10*strong+.10*curve+.05*evidence);
  const gates={evidence:(state.totalAttempts||0)>=2200,coverage:st.coverage>=.65,mastery:st.mastery>=.62,breadth:breadth>=.70,weak:weak<=5,keys:st.keysUnlocked>=25};
  const ready=score>=.70&&Object.values(gates).every(Boolean);
  const stage=ready?"Campaign 2 recommended":score>=.60?"Approaching Campaign 2":score>=.45?"Building transfer":"Building foundation";
  const blockers=[];
  if(!gates.coverage)blockers.push(`${Math.max(0,1950-Object.keys(state.seen).length).toLocaleString()} more unique questions`);
  if(!gates.mastery)blockers.push(`mastery ${pct(st.mastery)}% → 62%`);
  if(!gates.breadth)blockers.push(`${Math.max(0,Math.ceil(metrics.length*.70)-Math.round(breadth*metrics.length))} more Keys above 55%`);
  if(!gates.evidence)blockers.push(`${Math.max(0,2200-(state.totalAttempts||0)).toLocaleString()} more answers of evidence`);
  if(!gates.weak)blockers.push(`reduce sub-40% Keys from ${weak} to 5 or fewer`);
  if(!gates.keys)blockers.push(`${25-st.keysUnlocked} more daily Keys to unlock`);
  return {score,ready,stage,breadth,strong,weak,evidence,curve,blockers};
}
function campaign2Brief(){
  const r=campaign2Readiness(),st=overallStats();
  return `Adaptive English recommends preparing Campaign 2. I will attach/export my Campaign 1 progress JSON. Use that export as the primary diagnostic. Build Campaign 2 as a separate 3,000-question bank that preserves Campaign 1 and the existing app architecture. Prioritize genuinely new C1 material plus targeted transfer for my remaining weak patterns; avoid duplicate questions and retain 15 questions per level, 10-second timing, adaptive selection, dynamic names, micro-lessons, AI Valoration and the long-term Learning Curve. Current handoff: readiness ${pct(r.score)}%, coverage ${pct(st.coverage)}%, mastery ${pct(st.mastery)}%, breadth ${pct(r.breadth)}%, weak Keys under 40%: ${r.weak}, Key Journey ${st.keysUnlocked}/25. First analyze my export and propose the Campaign 2 skill map before generating the new 3,000 questions.`;
}
function stageInfo(coverage){
  const seen=Object.keys(state.seen).length;
  const index=Math.min(5,Math.floor(Math.min(2999,seen)/500));
  return {index,name:stageNames[index],from:index*500,to:(index+1)*500,seen};
}

function outcomeType(ok,sec,target,timeout){
  if(timeout)return "timeout";
  const auto=Math.min(3.0,target*.85);
  const secure=Math.min(6.0,target*1.35);
  const fastWrong=Math.min(3.2,target*.9);
  if(ok&&sec<=auto)return "automatic";
  if(ok&&sec<=secure)return "secure";
  if(ok)return "slow-correct";
  if(sec<=fastWrong)return "fast-wrong";
  return "slow-wrong";
}
function updateMetric(q,ok,sec,type){
  const m=state.metrics[q.cat],target=q.targetTime||3.6;
  const speed=ok?clamp(target/Math.max(.8,sec),0,1):0;
  const newDomain=!m.domains[q.domain];
  const oldTemplate=state.templateLast[q.templateId]!=null;
  m.k=clamp(m.k*.86+(ok?1:0)*.14,.03,.99);
  m.a=clamp(m.a*.89+speed*.11,.03,.99);
  m.t=clamp(m.t*.90+(ok?(newDomain?1:(oldTemplate?.78:.9)):0)*.10,.03,.99);
  if(type==="fast-wrong"){m.k=clamp(m.k-.035,.03,.99);m.a=clamp(m.a-.05,.03,.99);}
  m.attempts++;if(ok)m.correct++;if(type==="automatic")m.automatic++;if(!ok)m.lapses++;
  m.streak=ok?m.streak+1:0;m.lastMs=Math.round(sec*1000);m.lastLevel=state.level;
  m.domains[q.domain]=(m.domains[q.domain]||0)+1;
  const sameDay=m.lastTs&&elapsedDays(m.lastTs)<.5,dayFactor=sameDay?1:1.0;
  if(type==="automatic"){m.interval=Math.min(40,Math.max(2,Math.round(m.interval*2.2+1)));m.intervalDays=sameDay?Math.max(1,m.intervalDays||1):Math.min(30,Math.max(2,Math.round((m.intervalDays||1)*2.2)));}
  else if(type==="secure"){m.interval=Math.min(28,Math.max(2,Math.round(m.interval*1.7+1)));m.intervalDays=sameDay?Math.max(1,m.intervalDays||1):Math.min(21,Math.max(1,Math.round((m.intervalDays||1)*1.7)));}
  else if(type==="slow-correct"){m.interval=Math.min(12,Math.max(1,Math.round(m.interval*1.25)));m.intervalDays=sameDay?Math.max(1,m.intervalDays||1):Math.min(10,Math.max(1,Math.round((m.intervalDays||1)*1.25)));}
  else {m.interval=1;m.intervalDays=1;}
  m.lastTs=Date.now();
  return speed;
}
function reviewIntervalDays(info,type){
  const prev=Math.max(1,info?.intervalDays||1),sameDay=info?.lastTs&&elapsedDays(info.lastTs)<.5;
  if(type==="timeout"||type==="fast-wrong"||type==="slow-wrong")return 1;
  if(sameDay)return prev;
  if(type==="automatic")return Math.min(30,Math.max(3,Math.round(prev*2.2)));
  if(type==="secure")return Math.min(21,Math.max(2,Math.round(prev*1.7)));
  return Math.min(10,Math.max(1,Math.round(prev*1.25)));
}
function seenInfo(q){return state.seen[q.fingerprint]||null;}
const DISPLAY_NAMES={
  Marta:{kind:"f",pool:["Ana","Eva","Mia","Zoe","Lea","Sara","Emma","Nora","Lisa","Luna","Amy","Ava","Ivy","May","Lia","Noa","Iris","Elsa","Alma","Lucy"]},
  Nina:{kind:"f",pool:["Ana","Eva","Mia","Zoe","Lea","Sara","Emma","Nora","Lisa","Luna","Amy","Ava","Ivy","May","Lia","Noa","Iris","Elsa","Alma","Lucy"]},
  Clara:{kind:"f",pool:["Ana","Eva","Mia","Zoe","Lea","Sara","Emma","Nora","Lisa","Luna","Amy","Ava","Ivy","May","Lia","Noa","Iris","Elsa","Alma","Lucy"]},
  Daniel:{kind:"m",pool:["Tom","Ben","Max","Ian","Dan","Eli","Hugo","Luca","Noah","Adam","Eric","Joel","Marc","Luke","Jack","Liam","Owen","Ryan","Paul","Nico"]},
  Leo:{kind:"m",pool:["Tom","Ben","Max","Ian","Dan","Eli","Hugo","Luca","Noah","Adam","Eric","Joel","Marc","Luke","Jack","Liam","Owen","Ryan","Paul","Nico"]},
  Alex:{kind:"n",pool:["Sam","Kim","Lee","Ari","Ash","Sky","Robin","Jules","Casey","Jamie","Remy","Riley"]}
};
function stableHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function visibleCard(q){
  const occurrence=(seenInfo(q)?.count||0)+1,all=[q.q,...(q.display||[])].join(" "),map={};
  for(const [original,def] of Object.entries(DISPLAY_NAMES))if(new RegExp(`\\b${original}\\b`).test(all)){
    const base=stableHash(`${q.fingerprint}|${original}`)%def.pool.length,used=session?.usedDisplayNames;let name=def.pool[(base+occurrence-1)%def.pool.length];
    if(used){for(let step=0;step<def.pool.length&&used.has(name);step++)name=def.pool[(base+occurrence+step)%def.pool.length];used.add(name);}
    map[original]=name;
  }
  const swap=text=>Object.entries(map).reduce((s,[from,to])=>s.replace(new RegExp(`\\b${from}\\b`,"g"),to),String(text));
  return {question:swap(q.q),options:(q.display||[]).map(swap),focus:(q.focus||[]).map(swap),names:map,occurrence};
}

function focusMarkup(text,answer,fragments=[]){
  text=String(text);const ranges=[];
  for(const frag of [...new Set(fragments.filter(Boolean))].sort((a,b)=>b.length-a.length)){
    const start=text.indexOf(frag);if(start>=0)ranges.push({start,end:start+frag.length,kind:"cue",text:frag});
  }
  const gap=text.indexOf("___");if(gap>=0)ranges.push({start:gap,end:gap+3,kind:"answer",text:String(answer)});
  ranges.sort((a,b)=>a.start-b.start||(a.kind==="answer"?-1:1));let cursor=0,html="";
  for(const r of ranges){if(r.start<cursor)continue;html+=escapeHtml(text.slice(cursor,r.start));html+=`<span class="grammar-${r.kind}">${escapeHtml(r.text)}</span>`;cursor=r.end;}
  return html+escapeHtml(text.slice(cursor));
}
function flashGrammarFocus(text,answer,fragments){
  const el=$("questionText");if(!el)return;el.innerHTML=focusMarkup(text,answer,fragments);el.classList.remove("focus-active");void el.offsetWidth;el.classList.add("focus-active");
}
function hideCorrectReveal(){const el=$("correctReveal");if(!el)return;el.className="correct-reveal";el.innerHTML="";}
function showCorrectReveal(answer,pos){
  const el=$("correctReveal");if(!el)return;const letter=String.fromCharCode(65+Math.max(0,Math.min(3,pos||0)));
  el.className=`correct-reveal show pos-${Math.max(0,Math.min(3,pos||0))+1}`;
  el.innerHTML=`<span class="correct-reveal-kicker"><i></i>CORRECT ANSWER · ${letter}</span><strong>${escapeHtml(answer)}</strong>`;
}

function qScore(q,sessionCats,sessionTemplates,mode){
  const info=seenInfo(q),isNew=!info,m=state.metrics[q.cat];
  let s=Math.random()*.10;
  if(mode==="focus")s+=catPriority(q.cat)*1.65;
  if(mode==="explore"){
    // Prefer skills with little evidence and those not sampled recently.
    s+=Math.max(0,.85-Math.min(.85,m.attempts/18));
    s+=Math.min(.55,Math.max(0,state.level-m.lastLevel)*.035);
  }
  if(mode==="review"){
    const overdue=Math.max(0,(state.level-m.lastLevel)-m.interval);
    s+=.45+Math.min(.75,overdue*.08)+catPriority(q.cat)*.55;
  }
  if(mode==="wild")s+=.28+Math.max(0,.45-m.attempts/40);
  if(isNew)s+=mode==="review"?.06:.62; else if(mode==="review")s+=.32;
  if(info){
    const ago=state.level-info.lastLevel,days=elapsedDays(info.lastTs),dueTs=info.nextDueTs||((info.lastTs||0)+(info.intervalDays||1)*86400000),timeDue=info.lastTs&&Date.now()>=dueTs;
    if(!timeDue){if(ago<4)s-=3.0;else if(ago<9)s-=1.15;else if(ago<16)s-=.35;if(days<.5)s-=1.35;else if(days<1)s-=.55;}
    else{s+=.55+Math.min(.85,Math.max(0,(Date.now()-dueTs)/86400000)*.12);}
    s-=Math.min(.65,Math.log1p(info.count)*.18);
    if(info.lastCorrect===false&&(ago>=4||timeDue))s+=Math.min(.85,.38+(info.lapses||1)*.12);
  }
  const ta=state.templateLast[q.templateId];
  if(ta!=null){
    const ago=state.level-ta;
    if(ago<4)s-=2.0;else if(ago<10)s-=.65;
  }
  const cc=sessionCats[q.cat]||0,tc=sessionTemplates[q.templateId]||0;
  if(cc>=2)s-=20; else if(cc===1)s-=.20;
  if(tc>=1)s-=12;
  if(!m.domains[q.domain])s+=.20;
  return s;
}
function chooseOne(pool,chosen,sessionCats,sessionTemplates,mode,allowedCats=null){
  const chosenFp=new Set(chosen.map(q=>q.fingerprint));
  let cand=pool.filter(q=>!chosenFp.has(q.fingerprint));
  if(allowedCats) cand=cand.filter(q=>allowedCats.has(q.cat));
  if(state.sessions<40){const short=cand.filter(q=>q.q.trim().split(/\s+/).length<=12);if(short.length)cand=short;}
  cand=cand.filter(q=>(sessionCats[q.cat]||0)<2 && (sessionTemplates[q.templateId]||0)<1);
  if(!cand.length)return null;
  cand.sort((a,b)=>qScore(b,sessionCats,sessionTemplates,mode)-qScore(a,sessionCats,sessionTemplates,mode));
  return cand[Math.floor(Math.random()*Math.min(5,cand.length))];
}
function buildTrainingPlan(){
  const chosen=[],cats={},temps={};
  const addQ=q=>{if(!q)return false;chosen.push(q);cats[q.cat]=(cats[q.cat]||0)+1;temps[q.templateId]=(temps[q.templateId]||0)+1;return true;};
  const newPool=BANK.filter(q=>!seenInfo(q)),reviewPool=BANK.filter(q=>!!seenInfo(q));
  const skills=CAMPAIGN.skills.map(s=>({id:s.id,m:state.metrics[s.id],priority:catPriority(s.id)}));

  // Deliberate interleaving: a weak pattern can never swallow the session.
  // Early sessions are deliberately broad diagnostics; later sessions consolidate more deeply.
  const surveyMode=state.sessions<8;
  const focusGoal=surveyMode?4:6, exploreGoal=surveyMode?7:4, reviewGoal=surveyMode?3:4;
  const focusCats=skills.slice().sort((a,b)=>b.priority-a.priority).slice(0,surveyMode?4:3).map(x=>x.id);
  let focusSlots=focusGoal;
  for(let round=0;round<2&&focusSlots>0;round++){
    for(const cat of focusCats){
      if(focusSlots<=0)break;
      const q=chooseOne(newPool.length?newPool:BANK,chosen,cats,temps,"focus",new Set([cat])) || chooseOne(BANK,chosen,cats,temps,"focus",new Set([cat]));
      if(addQ(q))focusSlots--;
    }
  }

  const exploreCats=skills.slice().sort((a,b)=>{
    const evidence=(a.m.attempts-b.m.attempts);
    if(evidence)return evidence;
    return a.m.lastLevel-b.m.lastLevel;
  }).map(x=>x.id);
  let exploreSlots=exploreGoal;
  for(const cat of exploreCats){
    if(exploreSlots<=0)break;
    if((cats[cat]||0)>0)continue;
    const q=chooseOne(newPool,chosen,cats,temps,"explore",new Set([cat]));
    if(addQ(q))exploreSlots--;
  }

  const dueCats=skills.filter(x=>x.m.attempts>0&&((state.level-x.m.lastLevel)>=x.m.interval||skillTimeDue(x.m).due))
    .sort((a,b)=>{const bt=skillTimeDue(b.m),at=skillTimeDue(a.m);return (bt.overdue-at.overdue)||(((state.level-b.m.lastLevel)-b.m.interval)-((state.level-a.m.lastLevel)-a.m.interval));})
    .map(x=>x.id);
  let reviewSlots=reviewGoal;
  for(const cat of dueCats){
    if(reviewSlots<=0)break;
    const q=chooseOne(reviewPool,chosen,cats,temps,"review",new Set([cat]));
    if(addQ(q))reviewSlots--;
  }
  while(reviewSlots>0){
    const q=chooseOne(reviewPool,chosen,cats,temps,"review");
    if(!q)break;addQ(q);reviewSlots--;
  }

  const wild=chooseOne(newPool.length?newPool:BANK,chosen,cats,temps,"wild");
  addQ(wild);

  while(chosen.length<SESSION_SIZE){
    const q=chooseOne(BANK,chosen,cats,temps,"explore");
    if(!q)break;addQ(q);
  }

  // Shuffle, then repair adjacent same-skill pairs when possible.
  for(let i=chosen.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[chosen[i],chosen[j]]=[chosen[j],chosen[i]];}
  for(let k=0;k<80;k++){
    let bad=-1;
    for(let i=1;i<chosen.length;i++)if(chosen[i].cat===chosen[i-1].cat){bad=i;break;}
    if(bad<0)break;
    const j=[...Array(chosen.length).keys()].find(x=>Math.abs(x-bad)>1&&chosen[x].cat!==chosen[bad].cat&&(x===0||chosen[x-1].cat!==chosen[bad].cat));
    if(j!=null)[chosen[bad],chosen[j]]=[chosen[j],chosen[bad]];else break;
  }
  return chosen.slice(0,SESSION_SIZE);
}
function buildFinalPlan(){
  const ranked=[...CAMPAIGN.skills].sort((a,b)=>catPriority(b.id)-catPriority(a.id)),result=[];
  for(const s of ranked){
    const pool=BANK.filter(q=>q.cat===s.id).sort((a,b)=>(seenInfo(a)?.lastLevel||-999)-(seenInfo(b)?.lastLevel||-999));
    if(pool[0])result.push(pool[0]);
  }
  while(result.length<30){const q=chooseOne(BANK,result,{},{},"review");if(!q)break;result.push(q);}
  return result.slice(0,30);
}
function shuffleOptions(q){
  const items=q.a.map((x,i)=>({x,ok:i===q.c})),correct=items.find(x=>x.ok),wrong=items.filter(x=>!x.ok);
  for(let i=wrong.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[wrong[i],wrong[j]]=[wrong[j],wrong[i]];}
  const seenCount=seenInfo(q)?.count||0,cycle=[0,3,1,2],start=stableHash(q.fingerprint)%4,targetPos=cycle[(start+seenCount)%4],arr=[];
  let wi=0;for(let i=0;i<4;i++)arr.push(i===targetPos?correct:wrong[wi++]);
  return {...q,display:arr.map(x=>x.x),correctPos:targetPos};
}
function currentStageText(){const s=stageInfo(overallStats().coverage);return `Stage ${s.index+1}/6 · ${s.name}`;}
function deltaText(value,goodUp=true,suffix=""){
  if(value==null||Number.isNaN(value))return '<span class="delta neutral">—</span>';
  const good=goodUp?value>0:value<0,bad=goodUp?value<0:value>0,arrow=value>0?"↑":value<0?"↓":"→";
  return `<span class="delta ${good?"good":bad?"bad":"neutral"}">${arrow} ${Math.abs(value).toFixed(1)}${suffix}</span>`;
}
function sparkline(values,format=v=>String(Math.round(v)),lowerBetter=false,refLine=null,refLabel="Avg"){
  values=Array.isArray(values)?values.filter(Number.isFinite):[];
  if(values.length<2)return '<div class="footerline">Complete a few levels to build this graph.</div>';
  const w=600,h=108,p=10,min=Math.min(...values),max=Math.max(...values),span=Math.max(.01,max-min);
  const pts=values.map((v,i)=>`${p+i*(w-2*p)/(values.length-1)},${h-p-(v-min)/span*(h-2*p)}`).join(" ");
  const current=values[values.length-1],best=lowerBetter?min:max;
  const lineColor=valueTextColor(current/100);
  const meanSvg=Number.isFinite(refLine)?`<line x1="${p}" y1="${h-p-(refLine-min)/span*(h-2*p)}" x2="${w-p}" y2="${h-p-(refLine-min)/span*(h-2*p)}" stroke="${valueTextColor(refLine/100)}" stroke-opacity=".72" stroke-width="2" stroke-dasharray="8 6" vector-effect="non-scaling-stroke"/>`:"";
  const meanMeta=Number.isFinite(refLine)?`<span style="color:${valueTextColor(refLine/100)}">${refLabel} ${format(refLine)}</span>`:`<span>${values.length} levels</span>`;
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="0" y1="${h-p}" x2="${w}" y2="${h-p}" stroke="rgba(255,255,255,.12)"/><line x1="0" y1="${p}" x2="${w}" y2="${p}" stroke="rgba(255,255,255,.07)"/>${meanSvg}<polyline points="${pts}" fill="none" stroke="${lineColor}" stroke-width="3" vector-effect="non-scaling-stroke"/></svg><div class="chartmeta"><span style="color:${lineColor}">Now ${format(current)}</span><span style="color:${valueTextColor(best/100)}">Best ${format(best)}</span>${meanMeta}</div>`;
}

function sessionScoreChart(rows,expanded=false){
  rows=(rows||[]).filter(x=>x.mode==="training"&&Number.isFinite(x.correct)&&Number.isFinite(x.ts));
  if(rows.length<2)return '<div class="footerline">Complete a few levels to build this graph.</div>';
  const colors=COLOR_BANDS_15;
  const mobile=!expanded&&window.innerWidth<=620;
  const w=mobile?360:(expanded?920:720),h=mobile?320:(expanded?520:310),L=mobile?40:58,R=mobile?12:22,T=mobile?24:28,B=mobile?42:44,maxY=15;
  const first=rows[0].ts,last=rows[rows.length-1].ts,span=Math.max(1,last-first);
  const xFor=(ts,i)=>rows.length===1?L+(w-L-R)/2:L+((last===first?i/(rows.length-1):(ts-first)/span)*(w-L-R));
  const yFor=c=>T+((maxY-c)/maxY)*(h-T-B),correct=r=>Math.max(0,Math.min(15,r.correct));
  const pts=rows.map((r,i)=>`${xFor(r.ts,i).toFixed(1)},${yFor(correct(r)).toFixed(1)}`).join(' ');
  const bands=colors.map((c,i)=>`<rect x="${L}" y="${yFor(i+1)}" width="${w-L-R}" height="${Math.max(1,yFor(i)-yFor(i+1))}" fill="${c}" fill-opacity=".30"/>`).join('');
  const grid=[...Array(16).keys()].map(v=>`<line x1="${L}" y1="${yFor(v)}" x2="${w-R}" y2="${yFor(v)}" stroke="rgba(255,255,255,${v===0||v===15?'.38':'.14'})"/><text x="${L-9}" y="${yFor(v)+3.5}" text-anchor="end" fill="#eef6f1" font-size="${expanded?12:(mobile?9:10)}" font-weight="850">${v}</text>`).join('');
  const shortSpan=(last-first)<=36*3600000,maxLabels=expanded?9:(mobile?5:6);
  let labels='';
  if(shortSpan){const count=Math.min(maxLabels,rows.length),idx=[...new Set(Array.from({length:count},(_,k)=>Math.round(k*(rows.length-1)/(count-1))))];labels=idx.map(i=>{const r=rows[i],d=new Date(r.ts),lab=d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});return `<text x="${xFor(r.ts,i)}" y="${h-13}" text-anchor="middle" fill="#c7d8ce" font-size="${mobile?10:12}" font-weight="800">${lab}</text>`;}).join('');}
  else{const dayMap=new Map();for(const r of rows){const d=new Date(r.ts),key=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;if(!dayMap.has(key))dayMap.set(key,{ts:new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),label:d.toLocaleDateString('es-ES',{day:'numeric',month:'short'})});}const days=[...dayMap.values()],step=Math.max(1,Math.ceil(days.length/maxLabels));labels=days.filter((_,i)=>i%step===0||i===days.length-1).map(d=>`<text x="${xFor(d.ts,0)}" y="${h-13}" text-anchor="middle" fill="#c7d8ce" font-size="${mobile?10:12}" font-weight="800">${d.label}</text>`).join('');}
  const dots=rows.map((r,i)=>{const d=new Date(r.ts),stamp=d.toLocaleString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}),targetTxt=Number.isFinite(r.target)?` · target ${r.target.toFixed(1)}`:"";return `<circle cx="${xFor(r.ts,i)}" cy="${yFor(correct(r))}" r="${expanded?3.8:2.7}" fill="#fff" stroke="#0a0f0c" stroke-width="1.8"><title>Nivel ${r.level}: ${correct(r)}/15 correctas${targetTxt} · ${stamp}</title></circle>`;}).join('');
  const targetRows=rows.map((r,i)=>({r,i})).filter(x=>Number.isFinite(x.r.target));
  const targetPts=targetRows.map(({r,i})=>`${xFor(r.ts,i).toFixed(1)},${yFor(Math.max(0,Math.min(15,r.target))).toFixed(1)}`).join(' ');
  const targetLine=targetRows.length>1?`<polyline points="${targetPts}" fill="none" stroke="#4dd0e1" stroke-width="${expanded?2.4:2}" stroke-dasharray="6 5" stroke-linejoin="round" stroke-linecap="round" opacity=".92" vector-effect="non-scaling-stroke"/>`:"";
  const targetDots=targetRows.map(({r,i})=>`<circle cx="${xFor(r.ts,i)}" cy="${yFor(r.target)}" r="${expanded?3.2:2.4}" fill="#4dd0e1" stroke="#0a0f0c" stroke-width="1.2"><title>Nivel ${r.level}: target ${r.target.toFixed(1)}</title></circle>`).join('');
  const lineShadow=`<polyline points="${pts}" fill="none" stroke="#050806" stroke-opacity=".78" stroke-width="${expanded?7:6}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  const line=`<polyline points="${pts}" fill="none" stroke="#ffffff" stroke-width="${expanded?3.6:3}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  return `<svg class="score-chart ${expanded?'expanded':''}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"><rect x="${L}" y="${T}" width="${w-L-R}" height="${h-T-B}" rx="8" fill="#101815"/>${bands}${grid}${targetLine}${targetDots}${lineShadow}${line}${dots}${labels}<text x="${L}" y="15" fill="#dfece5" font-size="${mobile?9:11}" font-weight="900">CORRECT / 15 · WHITE = YOU · CYAN = TARGET</text></svg>`;
}

function learningCurveBase(x){
  const mastery=x.mastery??0,coverage=x.coverage??0,automatic=x.automatic??0;
  return clamp(.65*mastery+.25*coverage+.10*automatic);
}
function learningCurveSeries(alpha=.15){
  const raw=state.sessionHistory.filter(x=>x.mode==="training").map(x=>learningCurveBase(x)*100);
  let ema=null;return raw.map(v=>{ema=ema==null?v:alpha*v+(1-alpha)*ema;return ema;});
}
function learningScoreStats(values=learningCurveSeries(),windowSize=8){
  if(!values.length)return {current:null,previous:null,delta:null,windowSize:0,start:null,gain:null};
  const current=values[values.length-1],start=values[0],n=Math.min(windowSize,Math.max(1,Math.floor(values.length/2)));
  if(values.length<2)return {current,previous:null,delta:null,windowSize:1,start,gain:0};
  const recent=mean(values.slice(-n)),previous=mean(values.slice(-2*n,-n));
  return {current,previous,delta:recent-previous,windowSize:n,start,gain:current-start};
}
function colorRgb(hex){const n=parseInt(hex.slice(1),16);return `${(n>>16)&255},${(n>>8)&255},${n&255}`;}
function mixHex(hex,target="#ffffff",amount=.34){const a=parseInt(hex.slice(1),16),b=parseInt(target.slice(1),16),ch=(n,s)=>Math.round(((a>>s)&255)*(1-n)+((b>>s)&255)*n);return `#${[ch(amount,16),ch(amount,8),ch(amount,0)].map(x=>x.toString(16).padStart(2,"0")).join("")}`;}
const AI_LEVELS=COLOR_BANDS_15.map((color,i)=>({level:i+1,color,rgb:colorRgb(color)}));
function aiValorationStats(){
  const st=overallStats(),learning=learningScoreStats();
  const learningBase=(learning.current??(st.rating*100))/100;
  const performance=clamp(.40*learningBase+.25*st.mastery+.15*st.accuracy+.10*st.auto+.10*st.coverage);
  const attemptEvidence=Math.sqrt(Math.min(1,(state.totalAttempts||0)/1500)),coverageEvidence=Math.sqrt(Math.min(1,st.coverage));
  const confidence=clamp(.35+.65*(.55*attemptEvidence+.45*coverageEvidence));
  const adjusted=clamp(.5+(performance-.5)*confidence),score=adjusted*100;
  return {level:valueLevel(score/100),score,confidence,performance:performance*100};
}
function applyAiTheme(ai=aiValorationStats()){
  const def=AI_LEVELS[ai.level-1]||AI_LEVELS[0];document.body.dataset.aiLevel=String(ai.level);
  document.documentElement.style.setProperty("--ai-color",def.color);document.documentElement.style.setProperty("--ai-rgb",def.rgb);return ai;
}
function aiLegendHtml(current){return AI_LEVELS.map(x=>`<div class="ai-legend-item ${x.level===current?"current":""}"><i style="--swatch:${x.color}"></i><b>${x.level}</b></div>`).join("");}
const AI_TEXT_COLORS=COLOR_BANDS_15.map(c=>mixHex(c,"#ffffff",.38));
function valueLevel(v){return Math.max(1,Math.min(15,Math.ceil(clamp(Number(v)||0)*15)));}
function valueColor(v){return AI_LEVELS[valueLevel(v)-1].color;}
function valueTextColor(v){return AI_TEXT_COLORS[valueLevel(v)-1];}
function paintText(id,v){const el=$(id);if(el)el.style.color=valueTextColor(v);}
function paintFill(id,v){const el=$(id);if(el)el.style.background=valueColor(v);}

function rankedSkills(){
  return CAMPAIGN.skills.map(s=>({...s,m:state.metrics[s.id],mastery:metricMastery(state.metrics[s.id])})).sort((a,b)=>b.mastery-a.mastery||b.m.attempts-a.m.attempts||a.name.localeCompare(b.name));
}
function skillLabel(cat){const s=CAMPAIGN.skills.find(x=>x.id===cat);return s?.name||cat;}
function coachPriority(cat){
  const m=state.metrics[cat],mastery=metricMastery(m),rows=state.history.filter(r=>r.cat===cat).slice(-30);
  const wrongRate=rows.length?rows.filter(r=>!r.correct).length/rows.length:1,autoRate=rows.length?rows.filter(r=>r.type==="automatic").length/rows.length:0;
  return .55*(1-mastery)+.35*wrongRate+.10*(1-autoRate);
}
function coachSkillStats(){
  return CAMPAIGN.skills.map(s=>{const m=state.metrics[s.id],mastery=metricMastery(m),rows=state.history.filter(r=>r.cat===s.id).slice(-30),wrong=rows.filter(r=>!r.correct).length,wrongRate=rows.length?wrong/rows.length:1;return {...s,m,mastery,rows,wrong,wrongRate,priority:coachPriority(s.id)};}).sort((a,b)=>b.priority-a.priority||a.mastery-b.mastery);
}
function typicalLearnerStats(){
  const actual=learningScoreStats().current,attempts=Math.max(0,state.totalAttempts||0);
  // Campaign-calibrated practice model: diminishing gains, not a population average.
  const typical=70-42*Math.exp(-attempts/4458),spread=5.0;
  const healthyMin=Math.max(0,typical-spread),strongPace=Math.min(100,typical+spread);
  const delta=actual==null?null:actual-typical;
  let band="Building evidence",label="Building evidence";
  if(delta!=null){if(actual>strongPace){band="Above strong pace";label="Clearly ahead";}else if(actual>=typical+2){band="Typical-high";label="Slightly ahead";}else if(actual>=typical-2){band="Typical range";label="On typical pace";}else if(actual>=healthyMin){band="Typical-low";label="Slightly behind typical pace";}else{band="Below healthy reference";label="Review strategy / consolidation";}}
  return {actual,typical,healthyMin,strongPace,delta,band,label,attempts};
}

function coachTrendSummary(){
  const rows=state.sessionHistory.filter(x=>x.mode==="training"),n=Math.min(8,Math.floor(rows.length/2));
  if(!n)return {window:0};
  const recent=rows.slice(-n),prior=rows.slice(-2*n,-n),avg=(a,k)=>mean(a.map(x=>Number(x[k])||0));
  return {window:n,accuracyDelta:(avg(recent,"accuracy")-avg(prior,"accuracy"))*100,timeDeltaMs:avg(recent,"avgMs")-avg(prior,"avgMs"),masteryDelta:(avg(recent,"mastery")-avg(prior,"mastery"))*100,autoDelta:(avg(recent,"automatic")-avg(prior,"automatic"))*100,ratingDelta:(avg(recent,"rating")-avg(prior,"rating"))*100};
}
function coachSkillMovement(limit=5){
  const out=[];for(const s of CAMPAIGN.skills){const rows=state.history.filter(r=>r.cat===s.id).slice(-40);if(rows.length<12)continue;const cut=Math.floor(rows.length/2),a=rows.slice(0,cut),b=rows.slice(cut);const acc=x=>x.length?x.filter(r=>r.correct).length/x.length:0;out.push({skill:s.name,delta:(acc(b)-acc(a))*100,recent:acc(b)*100,n:b.length});}
  return out.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,limit);
}
function coachPromptText(){
  const st=overallStats(),ai=aiValorationStats(),learning=learningScoreStats(),peer=typicalLearnerStats(),c2=campaign2Readiness(),focus=coachSkillStats().slice(0,5),mistakes=commonMistakeGroups(8),trend=coachTrendSummary(),moves=coachSkillMovement(),targetPerf=targetPerformanceStats();
  const firstTs=state.history.find(r=>Number.isFinite(r.ts))?.ts||state.createdAt||Date.now(),studySpanDays=Math.max(0,(Date.now()-firstTs)/86400000),dueQuestionCount=Object.values(state.seen).filter(x=>x?.lastTs&&Date.now()>=(x.nextDueTs||x.lastTs+(x.intervalDays||1)*86400000)).length;
  const snapshot={appVersion:APP_VERSION,campaign:CAMPAIGN.id,level:state.level,sessions:state.sessions,totalAnswers:state.totalAttempts,uniqueSeen:Object.keys(state.seen).length,bankSize:BANK.length,studySpanDays:+studySpanDays.toFixed(1),dueQuestionCount,coveragePct:+(st.coverage*100).toFixed(1),masteryPct:+(st.mastery*100).toFixed(1),recentAccuracyPct:+(st.accuracy*100).toFixed(1),recentAutomaticPct:+(st.auto*100).toFixed(1),avgResponseSec:+(st.avgMs/1000).toFixed(2),aeRating:+(st.rating*100).toFixed(1),learningScore:learning.current==null?null:+learning.current.toFixed(1),learningTrendDelta:learning.delta==null?null:+learning.delta.toFixed(1),aiLevel:ai.level,aiConfidencePct:+(ai.confidence*100).toFixed(1),typicalLearner:{you:peer.actual==null?null:+peer.actual.toFixed(1),healthyMin:+peer.healthyMin.toFixed(1),typical:+peer.typical.toFixed(1),strongPace:+peer.strongPace.toFixed(1),paceDelta:peer.delta==null?null:+peer.delta.toFixed(1),label:peer.label},campaign2ReadinessPct:+(c2.score*100).toFixed(1),targetPerformance:targetPerf.n?{levels:targetPerf.n,avgTarget:+targetPerf.avgTarget.toFixed(2),avgActual:+targetPerf.avgActual.toFixed(2),avgDelta:+targetPerf.avgDelta.toFixed(2),hitRatePct:+(targetPerf.hitRate*100).toFixed(1),abovePct:+(targetPerf.aboveRate*100).toFixed(1),exactPct:+(targetPerf.onRate*100).toFixed(1),belowPct:+(targetPerf.belowRate*100).toFixed(1)}:null,recentTrend:trend,focus:focus.map(x=>({skill:x.name,masteryPct:+(x.mastery*100).toFixed(1),recentErrorPct:+(x.wrongRate*100).toFixed(1),attempts:x.m.attempts||0})),skillMovement:moves.map(x=>({skill:x.skill,deltaAccuracyPts:+x.delta.toFixed(1),recentAccuracyPct:+x.recent.toFixed(1),recentN:x.n})),commonMistakes:mistakes.map(g=>({skill:skillLabel(g.cat),recentMisses:g.count,question:g.record.question||g.record.originalQuestion||"",yourAnswer:g.record.userAnswer||"",correct:g.record.correctAnswer||"",rule:g.record.rule||""})),allSkills:[...rankedSkills()].reverse().map(x=>({skill:x.name,masteryPct:+(x.mastery*100).toFixed(1),attempts:x.m.attempts||0}))};
  return `Analyze my Adaptive English Campaign 1 progress as my English coach. Tell me: (1) how I am progressing overall, (2) whether I am accelerating, plateauing or regressing, (3) my 3-5 highest-priority grammar targets and why, (4) which errors are conceptual versus automaticity/speed problems, (5) whether my pace is healthy relative to the app's model-based Typical Learner reference, and (6) what I should focus on for my next 5-10 levels. Also consider the real calendar study span and due-review count when judging retention. Be specific and compare trends, not just current scores. The Typical Learner figures are a synthetic model, not real population averages.

ADAPTIVE_ENGLISH_COACH_SNAPSHOT
${JSON.stringify(snapshot)}`;
}
function generateCoachPrompt(){const text=coachPromptText(),box=$("coachPromptBox"),area=$("coachPromptText");area.value=text;box.classList.remove("hidden");area.focus();area.select();}
async function copyCoachPrompt(){const text=$("coachPromptText").value||coachPromptText();try{await navigator.clipboard.writeText(text);$("coachPromptCopy").textContent="COPIED ✓";setTimeout(()=>$("coachPromptCopy").textContent="COPY PROMPT",1400);}catch(e){const a=$("coachPromptText");a.value=text;a.focus();a.select();document.execCommand("copy");}}

function commonMistakeGroups(limit=8){
  const groups={};for(const r of state.history.filter(x=>!x.correct).slice(-500)){const key=`${r.cat}|${r.templateId||r.qid||r.originalQuestion}`;const g=groups[key]||(groups[key]={cat:r.cat,templateId:r.templateId,count:0,record:r,lastTs:0});g.count++;if((r.ts||0)>=g.lastTs){g.record=r;g.lastTs=r.ts||0;}}
  return Object.values(groups).sort((a,b)=>b.count-a.count||b.lastTs-a.lastTs).slice(0,limit);
}
function skillRowsHtml(rows,ascending=false){const list=ascending?[...rows].reverse():rows;return list.map(x=>`<div class="skillrow"><div class="name">${escapeHtml(x.name)}</div><div class="track"><div class="fill mastery" style="width:${pct(x.mastery)}%;background:${valueColor(x.mastery)}"></div></div><div class="pct" style="color:${valueTextColor(x.mastery)}">${pct(x.mastery)}%</div></div>`).join("");}
function targetPerformanceStats(){
  const rows=state.sessionHistory.filter(x=>x.mode==="training"&&Number.isFinite(x.target)&&Number.isFinite(x.correct));
  if(!rows.length)return {n:0,avgTarget:null,avgActual:null,avgDelta:null,hitRate:null,aboveRate:null,onRate:null,belowRate:null};
  const avgTarget=mean(rows.map(x=>x.target)),avgActual=mean(rows.map(x=>x.correct)),avgDelta=mean(rows.map(x=>x.correct-x.target));
  const above=rows.filter(x=>x.correct>x.target).length,on=rows.filter(x=>x.correct===x.target).length,below=rows.length-above-on,hit=above+on;
  return {n:rows.length,avgTarget,avgActual,avgDelta,hitRate:hit/rows.length,aboveRate:above/rows.length,onRate:on/rows.length,belowRate:below/rows.length};
}
function renderStatsScreen(){
  const st=overallStats(),ai=aiValorationStats(),learning=learningScoreStats(),c2=campaign2Readiness(),peer=typicalLearnerStats(),trend=state.sessionHistory.filter(x=>x.mode==="training"),tgt=targetPerformanceStats();applyRatingTheme(st.rating);applyAiTheme(ai);
  $("statsAiLevel").textContent=`${ai.level} / 15`;paintText("statsAiLevel",ai.score/100);$("statsAiConfidence").textContent=`Evidence ${Math.round(ai.confidence*100)}%`;paintText("statsAiConfidence",ai.confidence);
  $("statsLearningScore").textContent=learning.current==null?"—":learning.current.toFixed(1);if(learning.current!=null)paintText("statsLearningScore",learning.current/100);const ld=$("statsLearningDelta");if(learning.delta==null){ld.className="learning-direction neutral";ld.textContent="→";}else{const up=learning.delta>.05,down=learning.delta<-.05;ld.className=`learning-direction ${up?"good":down?"bad":"neutral"}`;ld.textContent=`${up?"↑":down?"↓":"→"} ${learning.delta>=0?"+":""}${learning.delta.toFixed(1)}`;}$("statsLearningWindow").textContent=`Last ${learning.windowSize} vs previous ${learning.windowSize} levels`;
  [["statsCoverage",st.coverage,true],["statsMastery",st.mastery,true],["statsAccuracy",st.accuracy,true],["statsAutomatic",st.auto,true]].forEach(([id,v,pc])=>{$(id).textContent=pc?`${pct(v)}%`:String(v);paintText(id,v);});$("statsAvg").textContent=st.avgMs?fmtSec(st.avgMs):"—";$("statsTotal").textContent=(state.totalAttempts||0).toLocaleString();
  $("statsAccuracyChart").innerHTML=sessionScoreChart(trend,false);$("statsLearningChart").innerHTML=sparkline(learningCurveSeries(),v=>`${v.toFixed(1)}`,false,learning.start,"Start");$("statsSkills").innerHTML=skillRowsHtml(rankedSkills());
  if(tgt.n){$("targetAvg").textContent=tgt.avgTarget.toFixed(1);$("targetActualAvg").textContent=tgt.avgActual.toFixed(1);$("targetDeltaAvg").textContent=`${tgt.avgDelta>=0?"+":""}${tgt.avgDelta.toFixed(2)}`;$("targetHitRate").textContent=`${Math.round(tgt.hitRate*100)}%`;$("targetDeltaAvg").style.color=tgt.avgDelta>=0?"#82e6a9":"#ff7d8e";$("targetHitRate").style.color=tgt.hitRate>=.5?"#82e6a9":"#ff7d8e";$("targetBreakdown").textContent=`${tgt.n} target levels · Above ${Math.round(tgt.aboveRate*100)}% · Exact ${Math.round(tgt.onRate*100)}% · Below ${Math.round(tgt.belowRate*100)}%`; }else{$("targetBreakdown").textContent="Complete levels with TARGET to build this statistic.";}
  $("statsPeerYou").textContent=peer.actual==null?"—":peer.actual.toFixed(1);$("statsPeerHealthy").textContent=peer.healthyMin.toFixed(1);$("statsPeerExpected").textContent=peer.typical.toFixed(1);$("statsPeerStrong").textContent=peer.strongPace.toFixed(1);const peerText=peer.delta==null?"—":`${peer.delta>=0?"+":""}${peer.delta.toFixed(1)}`;$("statsPeerDelta").textContent=peerText;$("statsPeerDeltaMini").textContent=peerText;const pd=$("statsPeerDelta");pd.className=`peer-delta ${peer.delta==null||Math.abs(peer.delta)<2?"neutral":peer.delta>0?"good":"bad"}`;$("statsPeerLabel").textContent=`${peer.label} · Typical range ${peer.healthyMin.toFixed(1)}–${peer.strongPace.toFixed(1)} at ${peer.attempts.toLocaleString()} answers. Model-based reference, not measured users.`;
  $("statsCampaign2").textContent=`Campaign 2 readiness ${pct(c2.score)}% · ${c2.stage}${c2.ready?" · Recommended now":" · "+(c2.blockers[0]||"Keep consolidating")}`;
}
function renderCoachScreen(){
  const focus=coachSkillStats(),top=focus.slice(0,5),mistakes=commonMistakeGroups(8),worst=[...rankedSkills()].reverse();applyRatingTheme(overallStats().rating);applyAiTheme(aiValorationStats());
  const weak40=focus.filter(x=>x.mastery<.40).length;$("coachIntro").textContent=`Based on ${(state.totalAttempts||0).toLocaleString()} answers, your coach is prioritising ${top.map(x=>x.name).slice(0,3).join(", ")||"more evidence"}. ${weak40} key${weak40===1?"":"s"} are still below 40% mastery.`;
  $("coachFocus").innerHTML=top.map(x=>{const l=(window.AE_LESSONS||{})[x.id]||{},recent=x.rows.length?`${pct(x.wrongRate)}% errors in last ${x.rows.length} attempts`:"Not enough recent evidence";return `<div class="coach-card"><div class="coach-head"><h3>${escapeHtml(x.name)}</h3><span class="coach-score" style="color:${valueTextColor(x.mastery)}">${pct(x.mastery)}%</span></div><p>${escapeHtml(recent)} · ${x.m.attempts||0} total attempts</p><p>${escapeHtml(l.es||"Keep identifying the grammar pattern before choosing the form.")}</p>${l.formula?`<div class="formula">${escapeHtml(l.formula)}</div>`:""}${l.cue?`<p>💡 ${escapeHtml(l.cue)}</p>`:""}</div>`;}).join("")||'<p class="meta">Complete a few levels to build your study file.</p>';
  $("coachMistakes").innerHTML=mistakes.map(g=>{const r=g.record,l=(window.AE_LESSONS||{})[g.cat]||{};return `<div class="mistake-card"><b>${escapeHtml(skillLabel(g.cat))} · ${g.count} recent miss${g.count===1?"":"es"}</b><p>${escapeHtml(r.question||r.originalQuestion||"")}</p><div class="mistake-choice"><div><b>You</b><br>${escapeHtml(r.userAnswer)}</div><div class="correct"><b>Correct</b><br>${escapeHtml(r.correctAnswer)}</div></div><p><b>Rule:</b> ${escapeHtml(r.rule||l.es||"Review the structure and contrast it with the correct form.")}${l.cue?`<br><b>Coach:</b> ${escapeHtml(l.cue)}`:""}</p></div>`;}).join("")||'<p class="meta">No recurring mistakes yet.</p>';
  $("coachSkills").innerHTML=skillRowsHtml(worst);
}
function selectLevelLesson(records){
  const wrong=records.filter(r=>!r.correct);
  if(wrong.length){
    const groups={};
    for(const r of wrong){const g=groups[r.cat]||(groups[r.cat]={cat:r.cat,count:0,totalMs:0,maxMs:0,record:r});g.count++;g.totalMs+=r.ms||0;if((r.ms||0)>=g.maxMs){g.maxMs=r.ms||0;g.record=r;}}
    const g=Object.values(groups).sort((a,b)=>b.count-a.count||b.totalMs-a.totalMs||b.maxMs-a.maxMs)[0];
    return {kind:"error",count:g.count,record:g.record};
  }
  const record=[...records].sort((a,b)=>(b.ms||0)-(a.ms||0))[0];
  return record?{kind:"reinforce",count:0,record}:null;
}
function renderLevelLesson(records){
  const box=$("levelLesson"),pick=selectLevelLesson(records||[]);if(!box)return;
  if(!pick){box.classList.add("hidden");box.innerHTML="";return;}
  const r=pick.record,lesson=(window.AE_LESSONS||{})[r.cat]||{es:`La regla clave de este patr\u00f3n es: ${r.rule||"f\u00edjate en la estructura de la respuesta correcta."}`,en:r.rule||"Focus on the structure of the correct answer.",formula:r.correctAnswer||"",example:String(r.question||"").replace("___",r.correctAnswer||"___"),translation:"",cue:"Identifica primero el patr\u00f3n y despu\u00e9s completa la forma verbal."};
  const skill=CAMPAIGN.skills.find(s=>s.id===r.cat),title=skill?.name||r.skill||r.cat;
  const kicker=pick.kind==="error"?(pick.count>1?`ERROR DOMINANTE \u00b7 ${pick.count} FALLOS EN ESTE NIVEL`:"ERROR CLAVE DEL NIVEL"):"NIVEL PERFECTO \u00b7 TIP DE REFUERZO";
  const source=pick.kind==="error"?`<div class="lesson-choice"><div><b>Tu respuesta</b><br>${escapeHtml(r.userAnswer)}</div><div class="correct"><b>Respuesta correcta</b><br>${escapeHtml(r.correctAnswer)}</div></div>`:`<div class="lesson-choice"><div class="correct"><b>Respuesta que conviene automatizar</b><br>${escapeHtml(r.correctAnswer)}</div></div>`;
  box.innerHTML=`<div class="lesson-kicker">${kicker}</div><h2>${escapeHtml(title)}</h2><div class="lesson-source"><b>${pick.kind==="error"?"La pregunta en la que m\u00e1s conviene fijarse":"La pregunta m\u00e1s lenta del nivel"}:</b><br>${escapeHtml(r.question)}${source}</div><div class="lesson-languages"><div class="lesson-lang"><h3>ESPA\u00d1OL \u00b7 ENTI\u00c9NDELO</h3><p>${escapeHtml(lesson.es)}</p></div></div><div class="lesson-formula">${escapeHtml(lesson.formula)}</div><div class="lesson-example"><strong>${escapeHtml(lesson.example)}</strong>${lesson.translation?escapeHtml(lesson.translation):""}</div><div class="lesson-cue">\u{1F4A1} Para la pr\u00f3xima: ${escapeHtml(lesson.cue)}</div>`;
  box.classList.remove("hidden");
}

function renderCampaign2Readiness(){
  const r=campaign2Readiness(),score=pct(r.score),fill=$("campaign2Fill"),box=$("campaign2Box");
  if(box){$("campaign2Score").textContent=`${score}%`;paintText("campaign2Score",r.score);fill.style.width=`${score}%`;paintFill("campaign2Fill",r.score);$("campaign2Stage").textContent=r.stage;$("campaign2Status").textContent=r.ready?"Enough evidence to design the next 3,000 questions. Export Campaign 1 progress and send it to ChatGPT.":`${r.blockers.slice(0,2).join(" · ") || "Keep training to build stronger evidence."}`;$("campaign2Copy").classList.toggle("hidden",!r.ready);box.classList.toggle("ready",r.ready);}
  const end=$("campaign2End");if(end){const show=r.ready||r.score>=.60;end.classList.toggle("hidden",!show);if(show)end.textContent=r.ready?`CAMPAIGN 2 RECOMMENDED · Readiness ${score}% · Export progress and send it to ChatGPT.`:`CAMPAIGN 2 IS GETTING CLOSE · Readiness ${score}% · Keep consolidating Campaign 1.`;}
}
async function copyCampaign2Brief(){
  const text=campaign2Brief();
  try{await navigator.clipboard.writeText(text);alert("Campaign 2 handoff copied. Export your progress too and send both to ChatGPT.");}
  catch(e){const t=document.createElement("textarea");t.value=text;document.body.appendChild(t);t.select();document.execCommand("copy");t.remove();alert("Campaign 2 handoff copied. Export your progress too and send both to ChatGPT.");}
}
function localDateKey(ts=Date.now()){const d=new Date(ts),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}
function calendarDayNumber(dateKey){const [y,m,d]=String(dateKey).split("-").map(Number);return Math.floor(Date.UTC(y,m-1,d)/86400000);}
function addCalendarDays(dateKey,days){const [y,m,d]=String(dateKey).split("-").map(Number),dt=new Date(Date.UTC(y,m-1,d)+days*86400000),p=n=>String(n).padStart(2,"0");return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth()+1)}-${p(dt.getUTCDate())}`;}
function ensureDailyKey(){
  const today=localDateKey(),keys=window.AE_KEYS||{};let changed=false;
  const unique=[],used=new Set();for(const x of (Array.isArray(state.keyring)?state.keyring:[])){if(keys[x?.cat]&&!used.has(x.cat)){used.add(x.cat);unique.push(x);}}
  state.keyring=unique.slice(0,25);state.keyring.forEach((x,i)=>{if(x.number!==i+1){x.number=i+1;changed=true;}});
  if(!state.keyJourneyStart){state.keyJourneyStart=state.keyring.map(x=>x.firstDate).filter(Boolean).sort()[0]||state.dailyKey?.date||today;changed=true;}
  const elapsed=Math.max(0,calendarDayNumber(today)-calendarDayNumber(state.keyJourneyStart)),target=Math.min(25,Math.max(state.keyring.length,elapsed+1));
  while(state.keyring.length<target){
    const taken=new Set(state.keyring.map(x=>x.cat)),ranked=coachSkillStats().filter(x=>keys[x.id]&&!taken.has(x.id)),evidenced=ranked.filter(x=>(x.m.attempts||0)>=3),pick=(evidenced.length?evidenced:ranked)[0]||CAMPAIGN.skills.find(x=>keys[x.id]&&!taken.has(x.id));
    if(!pick)break;const n=state.keyring.length+1,unlockDate=addCalendarDays(state.keyJourneyStart,n-1);state.keyring.push({cat:pick.id,number:n,firstDate:unlockDate,lastDate:unlockDate,exposures:1});changed=true;
  }
  const active=state.keyring[Math.min(state.keyring.length,target)-1]||state.keyring[state.keyring.length-1];if(!active)return null;
  if(state.dailyKey?.date!==today||state.dailyKey?.cat!==active.cat){state.dailyKey={date:today,cat:active.cat};changed=true;}
  if(changed)save();return {...state.dailyKey,number:active.number||state.keyring.indexOf(active)+1,unlocked:state.keyring.length,start:state.keyJourneyStart};
}
function keySlideHtml(x){
  const key=(window.AE_KEYS||{})[x.cat],skill=CAMPAIGN.skills.find(s=>s.id===x.cat),m=state.metrics[x.cat],mastery=m?metricMastery(m):0,n=x.number||1;
  return `<article class="key-slide" data-key-number="${n}"><div class="key-slide-meta"><span>KEY ${n} / 25</span><small>${pct(mastery)}% MASTERY</small></div><button class="daily-key-card" type="button" aria-expanded="false"><div class="daily-key-face daily-key-front"><small>ESPAÑOL → INGLÉS</small><strong>${escapeHtml(key.front)}</strong><span>TOCA PARA REVELAR</span></div><div class="daily-key-face daily-key-back"><small>KEY ${n} UNLOCKED</small><strong>${escapeHtml(key.back)}</strong><b>${escapeHtml(key.formula)}</b><span>${escapeHtml(key.cue)}</span></div></button></article>`;
}
function renderDailyKey(){
  const host=$("dailyKeyHost"),journey=ensureDailyKey();if(!host||!journey)return;
  const unlocked=[...state.keyring].sort((a,b)=>(a.number||0)-(b.number||0)),lockedN=Math.min(25,unlocked.length+1);
  const marks=Array.from({length:25},(_,i)=>`<i class="${i<unlocked.length?"on":""}"></i>`).join("");
  const locked=unlocked.length<25?`<article class="key-slide key-slide-locked" data-key-number="${lockedN}"><div class="key-slide-meta"><span>KEY ${lockedN} / 25</span><small>LOCKED</small></div><div class="daily-key-card locked-card"><div class="daily-key-face"><small>NEXT SECRET</small><strong>◇</strong><b>KEY ${lockedN}</b><span>SE DESBLOQUEA CON EL PRÓXIMO DÍA</span></div></div></article>`:"";
  host.innerHTML=`<div class="daily-key-head"><div><span>KEY JOURNEY</span><b>${unlocked.length} / 25 UNLOCKED</b></div><em>${unlocked.length}/25</em></div><div class="key-marks" aria-label="${unlocked.length} of 25 Keys unlocked">${marks}</div><div id="keyCarousel" class="key-carousel">${unlocked.map(keySlideHtml).join("")}${locked}</div><div class="key-carousel-hint">DESLIZA ↔ · 1 TOQUE REVELA · 2º TOQUE AVANZA</div>`;
  const carousel=$("keyCarousel"),slides=[...carousel.querySelectorAll(".key-slide")],cards=[...carousel.querySelectorAll("button.daily-key-card")];
  const centerSlide=(slide,behavior="smooth")=>{if(!slide)return;const left=Math.max(0,slide.offsetLeft-(carousel.clientWidth-slide.clientWidth)/2);carousel.scrollTo({left,behavior});};
  cards.forEach((card,i)=>card.addEventListener("click",()=>{if(!card.classList.contains("revealed")){card.classList.add("revealed");card.setAttribute("aria-expanded","true");return;}centerSlide(slides[i+1]);}));
  requestAnimationFrame(()=>{const current=slides.find(x=>Number(x.dataset.keyNumber)===journey.number);centerSlide(current,"auto");});
}
function treeRand(seed=129){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296;};}
let TREE_PARTS_CACHE=null;
function growthTreeParts(){
  if(TREE_PARTS_CACHE)return TREE_PARTS_CACHE;
  const rnd=treeRand(20260912),branches=[],leaves=[];
  const grow=(x,y,len,ang,width,depth,dist)=>{
    const sway=(rnd()-.5)*.18,angle=ang+sway,x2=x+Math.cos(angle)*len,y2=y+Math.sin(angle)*len;
    const bend=(rnd()-.5)*10,mx=(x+x2)/2+Math.cos(angle+Math.PI/2)*bend,my=(y+y2)/2+Math.sin(angle+Math.PI/2)*bend;
    const score=dist+len*.58+depth*2+rnd()*2;
    branches.push({score,html:`<path d="M ${x.toFixed(1)} ${y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke-width="${Math.max(1.25,width).toFixed(2)}"/>`});
    if(depth>=4){const rot=Math.round((rnd()-.5)*90),rx=(5+rnd()*5).toFixed(1),ry=(2.8+rnd()*3).toFixed(1),green=["#607d3b","#769447","#8ca85a","#526f36"][Math.floor(rnd()*4)];leaves.push({score:score+8+rnd()*15,html:`<ellipse cx="${(x2+(rnd()-.5)*7).toFixed(1)}" cy="${(y2+(rnd()-.5)*6).toFixed(1)}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x2.toFixed(1)} ${y2.toFixed(1)})" fill="${green}"/>`});}
    if(depth>=6)return;
    const next=len*(.72+rnd()*.09),w=width*.72,spread=.35+rnd()*.20;
    grow(x2,y2,next,angle-spread,w,depth+1,dist+len);
    grow(x2,y2,next*(.92+rnd()*.12),angle+spread*(.88+rnd()*.22),w*.96,depth+1,dist+len);
  };
  grow(210,274,56,-Math.PI/2,12,0,0);
  const parts=[...branches.map(x=>({...x,kind:"branch"})),...leaves.map(x=>({...x,kind:"leaf"}))].sort((a,b)=>a.score-b.score||a.kind.localeCompare(b.kind)).slice(0,200);
  TREE_PARTS_CACHE=parts.map((x,i)=>({...x,stage:i+1}));return TREE_PARTS_CACHE;
}
function renderGrowthTree(){
  const host=$("growthTreeHost");if(!host)return;
  const level=syncGlobalLevel(state.level),stage=Math.min(200,Math.floor(level/50)),parts=growthTreeParts().slice(0,stage);
  const branch=parts.filter(x=>x.kind==="branch").map(x=>x.html).join(""),leaf=parts.filter(x=>x.kind==="leaf").map(x=>x.html).join("");
  host.innerHTML=`<div class="growth-tree-canvas" data-tree-stage="${stage}"><svg viewBox="0 0 420 300" role="img" aria-label="Practice tree, growth stage ${stage} of 200"><defs><linearGradient id="treeTrunk" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#5d3827"/><stop offset=".55" stop-color="#76503a"/><stop offset="1" stop-color="#957258"/></linearGradient></defs><ellipse class="tree-ground" cx="210" cy="282" rx="78" ry="7"/> <g class="tree-branches" fill="none" stroke="url(#treeTrunk)" stroke-linecap="round" stroke-linejoin="round">${branch}</g><g class="tree-leaves">${leaf}</g></svg></div><div class="growth-tree-count"><b>${level.toLocaleString()}</b><span>LEVEL</span></div>`;
}

function renderStart(){
  ensureDailyKey();
  const st=overallStats(),sg=stageInfo(st.coverage),rb=ratingBand(st.rating),ai=aiValorationStats();
  applyRatingTheme(st.rating);applyAiTheme(ai);
  $("startAiLevel").textContent=`${ai.level} / 15`;paintText("startAiLevel",ai.score/100);
  $("startAiConfidence").textContent=`AI Valoration · evidencia ${Math.round(ai.confidence*100)}%`;paintText("startAiConfidence",ai.confidence);
  $("startKicker").textContent=`CAMPAIGN 1 · ${currentStageText()}`;
  $("startLevel").textContent=`LEVEL ${state.level}`;
  $("startBtn").textContent=state.sessions?`CONTINUE · LEVEL ${state.level}`:`START · LEVEL ${state.level}`;
  $("coverageText").textContent=`${Object.keys(state.seen).length.toLocaleString()} / ${BANK.length.toLocaleString()}`;
  $("coverageFill").style.width=pct(st.coverage)+"%";paintFill("coverageFill",st.coverage);paintText("coverageText",st.coverage);
  $("masteryText").textContent=pct(st.mastery)+"%";$("masteryFill").style.width=pct(st.mastery)+"%";paintFill("masteryFill",st.mastery);paintText("masteryText",st.mastery);
  $("startFluency").textContent=st.rating?pct(st.rating):"—";paintText("startFluency",st.rating);
  $("startAccuracy").textContent=st.accuracy?pct(st.accuracy)+"%":"—";paintText("startAccuracy",st.accuracy);
  $("startAvg").textContent=st.avgMs?fmtSec(st.avgMs):"—";
  $("startAuto").textContent=st.auto?pct(st.auto)+"%":"—";paintText("startAuto",st.auto);
  $("startMastered").textContent=`${st.mastered}/${CAMPAIGN.skills.length}`;paintText("startMastered",st.mastered/CAMPAIGN.skills.length);
  $("startTotal").textContent=(state.totalAttempts||0).toLocaleString();
  const peer=typicalLearnerStats(),spd=$("startPeerDelta");spd.textContent=peer.delta==null?"—":`${peer.delta>=0?"+":""}${peer.delta.toFixed(1)}`;spd.className=`peer-delta ${peer.delta==null||Math.abs(peer.delta)<2?"neutral":peer.delta>0?"good":"bad"}`;$("startPeerStatus").textContent=`${peer.label} · typical ${peer.typical.toFixed(1)} · range ${peer.healthyMin.toFixed(1)}–${peer.strongPace.toFixed(1)}`;
  let status=`AE RATING ${pct(st.rating)} · ${rb.name} · ${sg.name} · ${Math.max(0,sg.to-sg.seen)} new exercises until the next stage.`;
  if(st.coverage>=.999&&!st.eligible){const knowledgeReady=st.mastery>=.85&&st.minSkill>=.70;status=knowledgeReady&&st.keysUnlocked<25?`Knowledge gates achieved. KEY JOURNEY ${st.keysUnlocked}/25 · Campaign remains locked until all 25 Keys are collected.`:`All 3,000 exercises explored. Consolidation continues until mastery ≥85%, every Key ≥70%, and KEY JOURNEY reaches 25/25.`;}
  if(st.eligible&&!state.completed)status="FINAL CHALLENGE READY · Campaign requirements achieved.";
  if(state.completed)status="CAMPAIGN 1 COMPLETE · Free practice remains available, or load the next campaign later.";
  $("campaignStatus").textContent=status;
  renderCampaign2Readiness();
  renderDailyKey();
  renderGrowthTree();
}
function showScreen(id){["startScreen","statsScreen","coachScreen","gameScreen","endScreen","errorsScreen"].forEach(x=>$(x).classList.toggle("hidden",x!==id));window.scrollTo(0,0);}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function missionOverlay(show=true){const el=$("missionOverlay");if(!el)return null;el.classList.toggle("hidden",!show);el.setAttribute("aria-hidden",show?"false":"true");return el;}
async function showLevelIntro(finalMode,target){
  const el=missionOverlay(true),last=state.sessionHistory.filter(x=>x.mode==="training").slice(-1)[0];if(!el)return;
  el.className="mission-overlay intro";const rank=finalMode?14:valueLevel((target||0)/15);el.style.setProperty("--mission-accent",valueColor(rank/15));
  const lastDelta=last&&Number.isFinite(last.target)?last.correct-last.target:null,lastLine=last?`LAST ${last.correct}/15${lastDelta==null?"":` · ${lastDelta>=0?"+":""}${lastDelta.toFixed(1)} VS TARGET`}`:"FIRST LEVEL";
  $("missionBody").innerHTML=`<div class="mission-eyebrow">${finalMode?"FINAL CHALLENGE":`LEVEL ${state.level}`}</div><div class="mission-title">${finalMode?"FINAL RUN":"TARGET"}</div><div class="mission-score" style="color:${finalMode?valueTextColor(13/15):valueTextColor((target||0)/15)}">${finalMode?"READY":`${target.toFixed(1)}<small>/15</small>`}</div><div class="mission-meta">${lastLine}</div><div class="mission-rules">15 QUESTIONS · 10s</div>`;
  for(const n of [3,2,1]){$("missionCount").textContent=String(n);$("missionCount").classList.remove("pop");void $("missionCount").offsetWidth;$("missionCount").classList.add("pop");playCountdownStep(n);await wait(820);}
  $("missionCount").textContent="GO";tone(1318.5,.09,.022,"sine");await wait(320);missionOverlay(false);
}
async function showLevelResolution(s,before){
  const el=missionOverlay(true);if(!el)return;const finalClear=s.mode==="final"&&s.accuracy>=.85&&s.avgMs<=6000,hit=s.mode==="final"?finalClear:s.target!=null&&s.correct>=s.target;
  el.className=`mission-overlay resolution ${hit?"hit":"miss"}`;el.style.setProperty("--mission-accent",hit?COLOR_BANDS_15[14]:COLOR_BANDS_15[3]);
  const d=s.target==null?null:s.correct-s.target,aiChange=before&&Number.isFinite(before.aiLevel)&&before.aiLevel!==s.aiLevel?`<div class="mission-change" style="color:${valueTextColor(s.aiLevel/15)}">AI RANK ${before.aiLevel} → ${s.aiLevel}</div>`:"";
  $("missionBody").innerHTML=`<div class="mission-eyebrow">${s.mode==="final"?(hit?"FINAL CLEARED":"FINAL NOT CLEARED"):(hit?"TARGET CLEARED":"TARGET MISSED")}</div><div class="mission-score">${s.correct}<small>/${s.total}</small></div>${s.target==null?"":`<div class="mission-targetline">TARGET ${s.target.toFixed(1)} · <b>${d>=0?"+":""}${d.toFixed(1)}</b></div>`}<div class="mission-meta">${s.mode==="training"?`LEVEL ${s.level} → ${state.level}`:`${Math.round(s.accuracy*100)}% · ${fmtSec(s.avgMs)}`}</div>${aiChange}`;
  $("missionCount").textContent=hit?"CLEAR":"REVIEW";hit?playLevelClear():playLevelMiss();await wait(2850);missionOverlay(false);
}
function adaptiveLevelTarget(plan){
  if(!Array.isArray(plan)||!plan.length)return null;
  const training=state.sessionHistory.filter(x=>x.mode==="training"&&Number.isFinite(x.correct)&&Number.isFinite(x.total)).slice(-8),recentExpected=training.length?mean(training.map(x=>15*x.correct/x.total)):15*(state.history.length?overallStats().accuracy:.50),globalAcc=state.history.length?overallStats().accuracy:.50;
  const expected=plan.reduce((sum,q)=>{const m=state.metrics[q.cat],rows=state.history.filter(r=>r.cat===q.cat).slice(-20),recent=rows.length?rows.filter(r=>r.correct).length/rows.length:null;let p=recent!=null&&rows.length>=5?.55*recent+.45*metricMastery(m):.68*metricMastery(m)+.32*globalAcc;const info=seenInfo(q);if(!info)p-=.045;else if(info.lastCorrect===false)p-=.055;else if(info.lastCorrect===true)p+=.02;return sum+clamp(p,.12,.92);},0);
  const planExpected=15*expected/plan.length,baseline=.58*planExpected+.42*recentExpected,stretch=training.length>=4?.55:.35;
  return clamp(Math.round((baseline+stretch)*2)/2,3.5,14.5);
}
async function startSession(finalMode=false){
  applyRatingTheme(overallStats().rating);
  const raw=finalMode?buildFinalPlan():buildTrainingPlan();
  const target=finalMode?null:adaptiveLevelTarget(raw);
  session={mode:finalMode?"final":"training",level:state.level,index:0,correct:0,automatic:0,times:[],records:[],usedDisplayNames:new Set(),target,plan:raw.map(shuffleOptions)};
  $("sessionLevel").innerHTML=finalMode?"FINAL":`L${state.level}<small class="level-target">TARGET ${target.toFixed(1)}</small>`;
  await showLevelIntro(finalMode,target);showScreen("gameScreen");nextQuestion();
}
function renderSegments(left){
  const n=Math.ceil(left);
  [...$("segments").children].forEach((e,i)=>e.classList.toggle("on",i<n));
}
function startTimer(){
  clearInterval(timerHandle);deadline=performance.now()+TIME_LIMIT*1000;lastTickShown=TIME_LIMIT+1;
  timerHandle=setInterval(()=>{
    const left=Math.max(0,(deadline-performance.now())/1000),shown=Math.ceil(left);
    $("timerText").textContent=left.toFixed(1);
    $("timer").style.setProperty("--timer-cut",`${100-left/TIME_LIMIT*100}%`);$("timer").classList.toggle("urgent",left<=3);
    renderSegments(left);
    if(shown<lastTickShown&&shown>0&&shown<TIME_LIMIT){playTick(shown<=3,shown);lastTickShown=shown;}
    if(left<=0){clearInterval(timerHandle);answer(-1,true);}
  },50);
}
function nextQuestion(){
  locked=false;hideCorrectReveal();
  if(session.index>=session.plan.length){finishSession();return;}
  current=session.plan[session.index];
  if(!current||!Array.isArray(current.display)||current.display.length!==4||!Number.isInteger(current.correctPos)||current.correctPos<0||current.correctPos>3){console.error("Skipping invalid question",current);session.index++;setTimeout(nextQuestion,0);return;}
  $("qIndex").textContent=session.index+1;$("qTotal").textContent="/ "+session.plan.length;
  const view=visibleCard(current);current.visibleQuestion=view.question;current.visibleOptions=view.options;current.visibleFocus=view.focus;current.visibleNames=view.names;
  $("questionText").textContent=view.question;
  const wrap=$("answers");wrap.innerHTML="";
  current.display.forEach((txt,i)=>{const b=document.createElement("button");b.className="answer";b.textContent=view.options[i];b.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse"){e.preventDefault();answer(i,false);}});b.addEventListener("click",()=>answer(i,false));wrap.appendChild(b);});
  $("timerText").textContent="10.0";$("timer").classList.remove("urgent");renderSegments(10);startTimer();
}
function feedback(ok,type,sec,correct,appearance,patternAppearance){
  const f=$("feedback");f.className="feedback "+(ok?"ok":"no");
  const label=ok?(type==="automatic"?"AUTOMATIC":type==="secure"?"CORRECT":"CORRECT · SLOW"):(type==="timeout"?"TIME":"INCORRECT");
  const exposure=appearance===1?"NEW":appearance+"\u00aa VEZ";
  f.innerHTML=`<div class="feedback-question">${exposure}</div><div class="feedback-label">${label}<small>${sec.toFixed(2)}s${ok?"":` · Correct: ${escapeHtml(correct)}`}</small></div><div class="appearance"><small class="pattern-appearance">PATTERN ${patternAppearance}ª VEZ</small></div>`;
  requestAnimationFrame(()=>f.classList.add("show"));
  const hold=ok?980:(type==="fast-wrong"?1540:type==="timeout"?1390:1340);setTimeout(()=>f.classList.remove("show"),hold);
}
function answer(pos,timeout=false){
  if(locked)return;locked=true;clearInterval(timerHandle);
  const sec=timeout?TIME_LIMIT:Math.max(.05,(TIME_LIMIT*1000-(deadline-performance.now()))/1000);
  const ok=pos===current.correctPos&&!timeout,type=outcomeType(ok,sec,current.targetTime||3.6,timeout);
  const buttons=[...$("answers").children];
  buttons.forEach((b,i)=>{b.disabled=true;b.classList.remove("good","bad","dim");if(i===current.correctPos)b.classList.add("good");else b.classList.add("dim");});
  if(!ok&&pos>=0){buttons[pos].classList.remove("dim");buttons[pos].classList.add("bad");}
  const previousSeen=state.seen[current.fingerprint]||null,previousTemplate=state.templateSeen[current.templateId]||null,speedScore=updateMetric(current,ok,sec,type),info=previousSeen||{count:0,lastLevel:-99,lapses:0};
  const appearance=info.count+1,patternAppearance=(previousTemplate?.count||0)+1,lapses=(info.lapses||0)+(ok?0:1);
  const now=Date.now(),intervalDays=reviewIntervalDays(previousSeen,type);
  state.seen[current.fingerprint]={count:appearance,lastLevel:state.level,lastTs:now,lastCorrect:ok,lapses,intervalDays,nextDueTs:now+intervalDays*86400000};state.templateLast[current.templateId]=state.level;state.templateSeen[current.templateId]={count:patternAppearance,lastLevel:state.level,lastTs:now};
  const shownQuestion=current.visibleQuestion||current.q,shownOptions=current.visibleOptions||current.display;
  const rec={level:state.level,qid:current.id,cat:current.cat,skill:current.skill,templateId:current.templateId,domain:current.domain,correct:ok,ms:Math.round(sec*1000),type,speedScore,occurrence:appearance,patternOccurrence:patternAppearance,review:!!previousSeen,gap:previousSeen?state.level-previousSeen.lastLevel:null,ts:Date.now(),question:shownQuestion,originalQuestion:current.q,userAnswer:pos>=0?shownOptions[pos]:"No answer",correctAnswer:shownOptions[current.correctPos],rule:current.rule};
  if(!ok)showCorrectReveal(rec.correctAnswer,current.correctPos);else hideCorrectReveal();
  try{flashGrammarFocus(shownQuestion,rec.correctAnswer,current.visibleFocus||current.focus||[]);}catch(e){console.error("Grammar focus flash failed",e);}
  state.history.push(rec);state.history=state.history.slice(-12000);state.totalAttempts++;session.records.push(rec);session.times.push(sec);if(ok)session.correct++;if(type==="automatic")session.automatic++;
  const answeredIndex=session.index,delay=ok?1100:(type==="fast-wrong"?1650:type==="timeout"?1500:1450);setTimeout(()=>{if(!session||session.index!==answeredIndex)return;session.index++;try{nextQuestion();}catch(e){console.error("Question advance recovered",e);locked=false;setTimeout(nextQuestion,120);}},delay);
  try{save();}catch(e){console.error("Progress save failed",e);}try{applyRatingTheme(overallStats().rating);}catch(e){console.error(e);}try{if(ok)playCorrect();else playWrong();}catch(e){console.error("Audio failed",e);}try{haptic(ok);pulseFeedback(ok);if(ok&&pos>=0)burstParticles(buttons[pos]);}catch(e){console.error("Tactile feedback failed",e);}try{feedback(ok,type,sec,rec.correctAnswer,appearance,patternAppearance);}catch(e){console.error("Feedback failed",e);}
}
async function finishSession(){
  clearInterval(timerHandle);
  const completedLevel=state.level,n=session.records.length,accuracy=session.correct/n,avgMs=Math.round(mean(session.records.map(r=>r.ms))),auto=session.automatic/n;
  const before=state.sessionHistory.length?state.sessionHistory[state.sessionHistory.length-1]:null;
  state.sessions++;if(session.mode==="training"){state.level++;syncGlobalLevel(state.level);}
  let st=overallStats();
  const snap={level:completedLevel,ts:Date.now(),mode:session.mode,correct:session.correct,total:n,accuracy,avgMs,automatic:auto,mastery:st.mastery,coverage:st.coverage,fluency:st.fluency,rating:st.rating,target:session.target,targetDelta:session.target==null?null:session.correct-session.target,targetHit:session.target==null?null:session.correct>=session.target};
  state.sessionHistory.push(snap);
  const aiNow=aiValorationStats();snap.aiScore=aiNow.score;snap.aiLevel=aiNow.level;snap.aiConfidence=aiNow.confidence;
  state.personalBestFluency=Math.max(state.personalBestFluency||0,st.rating);
  if(session.mode==="final"){
    state.finalAttempts=(state.finalAttempts||0)+1;
    if(accuracy>=.85&&avgMs<=6000)state.completed=true;
  }
  save();renderEnd(snap,before);await showLevelResolution(snap,before);showScreen("endScreen");
}
function renderEnd(s,before){
  const st=overallStats(),sg=stageInfo(st.coverage),rb=ratingBand(st.rating),ai=aiValorationStats();
  applyRatingTheme(st.rating);applyAiTheme(ai);
  $("endAiLevel").textContent=`${ai.level} / 15`;paintText("endAiLevel",ai.score/100);
  $("endAiConfidence").textContent=`AI Valoration · evidencia ${Math.round(ai.confidence*100)}%`;paintText("endAiConfidence",ai.confidence);
  $("aiLegend").innerHTML=aiLegendHtml(ai.level);
  renderCampaign2Readiness();
  $("endKicker").textContent=s.mode==="final"?"FINAL CHALLENGE":`LEVEL ${s.level} COMPLETE`;
  const targetHit=s.target==null?null:s.correct>=s.target,targetDelta=s.target==null?null:s.correct-s.target;
  $("endScore").textContent=`${s.correct}/${s.total} · ${pct(s.accuracy)}%`;$("endScore").style.color=targetHit==null?valueTextColor(s.accuracy):(targetHit?"#82e6a9":"#ff7d8e");
  const targetEl=$("endTarget");if(targetEl){targetEl.className=`target-result ${targetHit==null?"hidden":targetHit?"hit":"miss"}`;targetEl.innerHTML=targetHit==null?"":`<span>TARGET ${s.target.toFixed(1)}</span><b>${targetDelta>=0?"+":""}${targetDelta.toFixed(1)}</b><small>${targetHit?"TARGET BEATEN":"TARGET MISSED"}</small>`;}
  $("endSub").textContent=`AE RATING ${pct(st.rating)} · ${rb.name} · ${sg.name} · ${Object.keys(state.seen).length.toLocaleString()}/${BANK.length.toLocaleString()} explored`;
  $("eAvg").textContent=fmtSec(s.avgMs);$("eAuto").textContent=pct(s.automatic)+"%";paintText("eAuto",s.automatic);$("eFluency").textContent=pct(st.rating);paintText("eFluency",st.rating);
  $("eCoverage").textContent=pct(st.coverage)+"%";paintText("eCoverage",st.coverage);$("eMastery").textContent=pct(st.mastery)+"%";paintText("eMastery",st.mastery);$("eMastered").textContent=`${st.mastered}/${CAMPAIGN.skills.length}`;paintText("eMastered",st.mastered/CAMPAIGN.skills.length);
  $("dAcc").innerHTML=before?deltaText((s.accuracy-before.accuracy)*100,true," pts"):'<span class="delta neutral">First level</span>';
  $("dTime").innerHTML=before?deltaText((s.avgMs-before.avgMs)/1000,false,"s"):'<span class="delta neutral">First level</span>';
  $("dFlu").innerHTML=before?deltaText((st.rating-(before.rating??before.fluency))*100,true," pts"):'<span class="delta neutral">First level</span>';
  const learning=learningScoreStats();
  $("learningScore").textContent=learning.current==null?"—":learning.current.toFixed(1);if(learning.current!=null){$("learningScore").style.color=valueTextColor(learning.current/100);$("learningScore").closest(".learning-score-box").style.borderColor=valueColor(learning.current/100);}
  const ld=$("learningScoreDelta");
  if(learning.delta==null){ld.className="learning-direction neutral";ld.textContent="→ Primera media";}
  else {const up=learning.delta>.05,down=learning.delta<-.05;ld.className=`learning-direction ${up?"good":down?"bad":"neutral"}`;ld.textContent=`${up?"↑":down?"↓":"→"} ${learning.delta>=0?"+":""}${learning.delta.toFixed(1)}`;}
  $("learningScoreWindow").textContent=`Curva longitudinal · ${learning.windowSize} vs ${learning.windowSize} niveles`;
  renderLevelLesson(session.records);
  const trend=state.sessionHistory.filter(x=>x.mode==="training");
  $("accuracyChart").innerHTML=sessionScoreChart(trend,false);
  $("learningTrendChart").innerHTML=sparkline(learningCurveSeries(),v=>`${v.toFixed(1)}`,false,learning.start,"Start");
  const uniqueDone=Object.keys(state.seen).length;
  const repeated=Object.values(state.seen).reduce((n,x)=>n+Math.max(0,(x.count||1)-1),0);
  $("ePhrasesDone").textContent=uniqueDone.toLocaleString();paintText("ePhrasesDone",st.coverage);
  $("eRepeats").textContent=repeated.toLocaleString();
  $("eBankTotal").textContent=BANK.length.toLocaleString();
  $("weakSkills").innerHTML=rankedSkills().map(x=>`<div class="skillrow"><div class="name">${escapeHtml(x.name)}</div><div class="track"><div class="fill mastery" style="width:${pct(x.mastery)}%;background:${valueColor(x.mastery)}"></div></div><div class="pct" style="color:${valueTextColor(x.mastery)}">${pct(x.mastery)}%</div></div>`).join("");
  const wrong=session.records.filter(r=>!r.correct);
  $("errorsBtn").textContent=`REVIEW ERRORS - ${wrong.length}`;
  $("errorsBtn").classList.toggle("hidden",wrong.length===0);
  $("errorsCount").textContent=wrong.length?`${wrong.length} ${wrong.length===1?"error":"errors"} in Level ${s.level}`:`No errors in Level ${s.level}`;
  $("errorsFull").innerHTML=wrong.length?wrong.map((r,i)=>`<details open><summary>${i+1}. ${escapeHtml(r.question)} - ${(r.ms/1000).toFixed(1)}s</summary><p><b>You:</b> ${escapeHtml(r.userAnswer)}<br><b>Correct:</b> ${escapeHtml(r.correctAnswer)}<br>${escapeHtml(r.rule)}</p></details>`).join(""):'<p class="meta">No errors in this level.</p>';
  $("continueBtn").textContent=state.completed?"KEEP TRAINING":`NEXT LEVEL · ${state.level}`;
  $("finalBtn").classList.toggle("hidden",!(st.eligible&&!state.completed));
  if(s.mode==="final"&&!state.completed)$("endSub").textContent=`Final challenge not passed yet · ${pct(s.accuracy)}% · ${fmtSec(s.avgMs)}`;
  if(state.completed)$("endSub").textContent="CAMPAIGN 1 COMPLETE";
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function exportProgress(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`adaptive-english-progress-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
}
function importProgress(file){
  const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(!validProgressState(s))throw Error("Invalid progress schema");state=normaliseProgressState(s);save();renderStart();alert("Progress imported.");}catch(e){console.error("Progress import rejected",e);alert("This progress file is not valid for Campaign 1.");}};r.readAsText(file);
}
function resetProgress(){
  if(confirm("Reset all Campaign 1 progress? Export a backup first if you want to keep it.")){localStorage.removeItem(STORAGE_KEY);state=newState();save();renderStart();}
}

function validQuestion(q){
  const opts=q?.a;
  if(!Array.isArray(opts)||opts.length!==4||!Number.isInteger(q.c)||q.c<0||q.c>=opts.length)return false;
  const norm=opts.map(x=>String(x).trim().toLocaleLowerCase("en"));
  return new Set(norm).size===norm.length;
}

async function boot(){
  applyVisualSystemTokens();
  CAMPAIGN=await loadCampaign();
  const before=CAMPAIGN.questions.length;
  CAMPAIGN.questions=CAMPAIGN.questions.filter(validQuestion);
  if(CAMPAIGN.questions.length!==before)console.warn(`Adaptive English skipped ${before-CAMPAIGN.questions.length} invalid question(s) with duplicate/broken options.`);
  BANK=CAMPAIGN.questions;state=loadState();save();
  const seg=$("segments");for(let i=0;i<10;i++){const d=document.createElement("div");d.className="seg";seg.appendChild(d);}
  $("startBtn").onclick=async()=>{await ensureAudio();await startSession(false);};
  $("statsBtn").onclick=()=>{renderStatsScreen();showScreen("statsScreen");};
  $("scoreExpandBtn").onclick=()=>{const rows=state.sessionHistory.filter(x=>x.mode==="training");$("scoreExpandedChart").innerHTML=sessionScoreChart(rows,true);$("scoreModal").classList.remove("hidden");};
  $("scoreCloseBtn").onclick=()=>$("scoreModal").classList.add("hidden");
  $("scoreModal").onclick=e=>{if(e.target===$("scoreModal"))$("scoreModal").classList.add("hidden");};
  $("coachBtn").onclick=()=>{renderCoachScreen();showScreen("coachScreen");};
  $("statsBackBtn").onclick=()=>{renderStart();showScreen("startScreen");};
  $("coachGenerateBtn").onclick=generateCoachPrompt;$("coachPromptCopy").onclick=copyCoachPrompt;$("coachBackBtn").onclick=()=>{renderStart();showScreen("startScreen");};
  $("continueBtn").onclick=async()=>{await ensureAudio();if(state.completed){renderStart();showScreen("startScreen");}else await startSession(false);};
  $("finalBtn").onclick=async()=>{await ensureAudio();await startSession(true);};
  $("soundBtn").onclick=async()=>{soundOn=!soundOn;if(soundOn){await ensureAudio();tone(760,.06,.025,'sine');}refreshSoundButton();};
  refreshSoundButton();
  $("exportBtn").onclick=exportProgress;$("importBtn").onclick=()=>$("importFile").click();
  $("importFile").onchange=e=>e.target.files[0]&&importProgress(e.target.files[0]);
  $("resetBtn").onclick=resetProgress;$("campaign2Copy").onclick=copyCampaign2Brief;$("homeBtn").onclick=()=>{renderStart();showScreen("startScreen");};
  $("errorsBtn").onclick=()=>showScreen("errorsScreen");
  $("errorsBackBtn").onclick=()=>showScreen("endScreen");
  renderStart();showScreen("startScreen");
}
boot().catch(err=>{console.error(err);document.body.innerHTML='<div style="padding:30px;color:white;font-family:system-ui"><h1>Adaptive English</h1><p>Could not load Campaign 1.</p></div>';});
