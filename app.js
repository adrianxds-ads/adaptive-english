
const INITIAL_PRIORS = {"would_rather":[0.18,0.12,0.17],"inversion":[0.37,0.25,0.3],"third_conditional":[0.35,0.19,0.28],"allow_to":[0.45,0.3,0.34],"neednt_have":[0.25,0.16,0.2],"should_have":[0.28,0.18,0.23],"modal_deduction":[0.3,0.18,0.25],"wish_past":[0.88,0.79,0.78],"wish_present":[0.55,0.4,0.45],"mixed_conditional":[0.58,0.43,0.47],"causative":[0.14,0.08,0.15],"passive":[0.55,0.4,0.45],"backshift":[0.72,0.47,0.55],"past_perfect":[0.72,0.6,0.6],"unless":[0.24,0.12,0.24],"despite":[0.42,0.31,0.36],"so_such":[0.6,0.46,0.48],"too_enough":[0.55,0.4,0.44],"look_forward":[0.82,0.74,0.72],"get_used_to":[0.75,0.62,0.64],"used_to":[0.84,0.73,0.72],"make_bare":[0.84,0.74,0.73],"whose":[0.86,0.79,0.78],"second_conditional":[0.65,0.5,0.56],"had_better":[0.65,0.52,0.56]};
const APP_VERSION = "1.2";
const STORAGE_KEY = "adaptive_english_campaign1_v1";
const SESSION_SIZE = 15;
const TIME_LIMIT = 10;
let CAMPAIGN=null, BANK=[], state=null, session=null, timerHandle=null, deadline=0, current=null, locked=false;
let audioCtx=null, soundOn=true, lastTickShown=TIME_LIMIT+1;

const $=id=>document.getElementById(id);
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
async function ensureAudio(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    if(!audioCtx)audioCtx=new AC();
    if(audioCtx.state==='suspended')await audioCtx.resume();
    return audioCtx.state==='running';
  }catch(e){return false;}
}
function tone(freq,dur=.035,gain=.018,type='sine',delay=0){
  if(!soundOn||!audioCtx||audioCtx.state!=='running')return;
  const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.01);
}
function playTick(strong=false,step=0){const f=strong?(step%2?1540:1260):(step%2?1280:980);tone(f,strong?.034:.026,strong?.026:.016,'square');}
function playCorrect(){tone(523.25,.065,.030,'sine');tone(659.25,.075,.026,'triangle',.042);tone(783.99,.105,.024,'sine',.095);}
function playWrong(){tone(330,.065,.020,'triangle');tone(247,.090,.018,'sine',.055);}
function playComplete(){tone(392,.075,.022,'sine');tone(523.25,.085,.024,'triangle',.070);tone(659.25,.100,.026,'sine',.145);tone(783.99,.155,.028,'sine',.230);}
function refreshSoundButton(){const b=$("soundBtn");if(b){b.textContent=soundOn?'🔊':'🔇';b.setAttribute('aria-label',soundOn?'Sound on':'Sound off');}}

async function loadCampaign(){
  if(window.__AE_CAMPAIGN__) return window.__AE_CAMPAIGN__;
  const r=await fetch("./campaign-01.json");
  if(!r.ok) throw new Error("Cannot load campaign");
  return r.json();
}

function seedMetric(cat){
  const p=INITIAL_PRIORS[cat]||[.42,.28,.34];
  return {k:p[0],a:p[1],t:p[2],attempts:0,correct:0,automatic:0,lapses:0,streak:0,interval:1,lastLevel:-99,domains:{},lastMs:0};
}
function newState(){
  const metrics={}; CAMPAIGN.skills.forEach(s=>metrics[s.id]=seedMetric(s.id));
  return {
    schemaVersion:1,campaignId:CAMPAIGN.campaignId,level:CAMPAIGN.startingLevel||1,sessions:0,totalAttempts:0,
    metrics,seen:{},templateLast:{},history:[],sessionHistory:[],finalAttempts:0,completed:false,
    personalBestFluency:0,createdAt:Date.now(),updatedAt:Date.now()
  };
}
function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!s||s.campaignId!==CAMPAIGN.campaignId) return newState();
    for(const skill of CAMPAIGN.skills) if(!s.metrics[skill.id]) s.metrics[skill.id]=seedMetric(skill.id);
    s.history=Array.isArray(s.history)?s.history:[];
    s.sessionHistory=Array.isArray(s.sessionHistory)?s.sessionHistory:[];
    s.seen=s.seen||{}; s.templateLast=s.templateLast||{};
    return s;
  }catch(e){return newState();}
}
function save(){state.updatedAt=Date.now();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}

function metricMastery(m){return .45*m.k+.35*m.a+.20*m.t;}
function recentRows(n=75){return state.history.slice(-n);}
function recentWrong(cat,n=20){
  const r=state.history.filter(x=>x.cat===cat).slice(-n);
  return r.length?r.filter(x=>!x.correct).length/r.length:0;
}
function recentFastWrong(cat,n=50){return state.history.slice(-n).filter(x=>x.cat===cat&&x.type==="fast-wrong").length;}
function catPriority(cat){
  const m=state.metrics[cat],weak=(1-m.k)*.42+(1-m.a)*.33+(1-m.t)*.25;
  const isDue=(state.level-m.lastLevel)>=m.interval;
  const due=isDue?.09:0;
  const overdue=Math.min(.10,Math.max(0,(state.level-m.lastLevel)-m.interval)*.015);
  const errors=recentWrong(cat)*.13,misconception=Math.min(.10,recentFastWrong(cat)*.025);
  // Weak skills matter, but no single skill is allowed to dominate a whole session.
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
  const eligible=coverage>=.999&&mastery>=.85&&minSkill>=.70;
  return {coverage,mastery,minSkill,accuracy,auto,avgMs,speed,transfer,fluency,rating,mastered,eligible};
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
  if(type==="automatic")m.interval=Math.min(40,Math.max(2,Math.round(m.interval*2.2+1)));
  else if(type==="secure")m.interval=Math.min(28,Math.max(2,Math.round(m.interval*1.7+1)));
  else if(type==="slow-correct")m.interval=Math.min(12,Math.max(1,Math.round(m.interval*1.25)));
  else m.interval=1;
  return speed;
}
function seenInfo(q){return state.seen[q.fingerprint]||null;}
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
    const ago=state.level-info.lastLevel;
    if(ago<4)s-=3.0;else if(ago<9)s-=1.15;else if(ago<16)s-=.35;
    s-=Math.min(.65,Math.log1p(info.count)*.18);
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

  const dueCats=skills.filter(x=>x.m.attempts>0&&(state.level-x.m.lastLevel)>=x.m.interval)
    .sort((a,b)=>((state.level-b.m.lastLevel)-b.m.interval)-((state.level-a.m.lastLevel)-a.m.interval))
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
  const arr=q.a.map((x,i)=>({x,ok:i===q.c}));
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return {...q,display:arr.map(x=>x.x),correctPos:arr.findIndex(x=>x.ok)};
}
function currentStageText(){const s=stageInfo(overallStats().coverage);return `Stage ${s.index+1}/6 · ${s.name}`;}
function deltaText(value,goodUp=true,suffix=""){
  if(value==null||Number.isNaN(value))return '<span class="delta neutral">—</span>';
  const good=goodUp?value>0:value<0,bad=goodUp?value<0:value>0,arrow=value>0?"↑":value<0?"↓":"→";
  return `<span class="delta ${good?"good":bad?"bad":"neutral"}">${arrow} ${Math.abs(value).toFixed(1)}${suffix}</span>`;
}
function sparkline(values,format=v=>String(Math.round(v)),lowerBetter=false){
  if(values.length<2)return '<div class="footerline">Complete a few levels to build this graph.</div>';
  const w=600,h=108,p=10,min=Math.min(...values),max=Math.max(...values),span=Math.max(.01,max-min);
  const pts=values.map((v,i)=>`${p+i*(w-2*p)/(values.length-1)},${h-p-(v-min)/span*(h-2*p)}`).join(" ");
  const current=values[values.length-1],best=lowerBetter?min:max;
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="0" y1="${h-p}" x2="${w}" y2="${h-p}" stroke="rgba(255,255,255,.12)"/><line x1="0" y1="${p}" x2="${w}" y2="${p}" stroke="rgba(255,255,255,.07)"/><polyline points="${pts}" fill="none" stroke="white" stroke-width="3" vector-effect="non-scaling-stroke"/></svg><div class="chartmeta"><span>Now ${format(current)}</span><span>Best ${format(best)}</span><span>${values.length} levels</span></div>`;
}
function topWeak(n=5){
  return CAMPAIGN.skills.map(s=>({...s,m:state.metrics[s.id],mastery:metricMastery(state.metrics[s.id]),p:catPriority(s.id)})).sort((a,b)=>b.p-a.p).slice(0,n);
}
function renderStart(){
  const st=overallStats(),sg=stageInfo(st.coverage),rb=ratingBand(st.rating);
  applyRatingTheme(st.rating);
  $("startKicker").textContent=`CAMPAIGN 1 · ${currentStageText()}`;
  $("startLevel").textContent=`LEVEL ${state.level}`;
  $("startBtn").textContent=state.sessions?`CONTINUE · LEVEL ${state.level}`:`START · LEVEL ${state.level}`;
  $("coverageText").textContent=`${Object.keys(state.seen).length.toLocaleString()} / ${BANK.length.toLocaleString()}`;
  $("coverageFill").style.width=pct(st.coverage)+"%";
  $("masteryText").textContent=pct(st.mastery)+"%";$("masteryFill").style.width=pct(st.mastery)+"%";
  $("startFluency").textContent=st.rating?pct(st.rating):"—";
  $("startAccuracy").textContent=st.accuracy?pct(st.accuracy)+"%":"—";
  $("startAvg").textContent=st.avgMs?fmtSec(st.avgMs):"—";
  $("startAuto").textContent=st.auto?pct(st.auto)+"%":"—";
  $("startMastered").textContent=`${st.mastered}/${CAMPAIGN.skills.length}`;
  $("startTotal").textContent=(state.totalAttempts||0).toLocaleString();
  let status=`AE RATING ${pct(st.rating)} · ${rb.name} · ${sg.name} · ${Math.max(0,sg.to-sg.seen)} new exercises until the next stage.`;
  if(st.coverage>=.999&&!st.eligible)status="All 3,000 exercises explored. Consolidation continues until mastery ≥85% and every skill ≥70%.";
  if(st.eligible&&!state.completed)status="FINAL CHALLENGE READY · Campaign requirements achieved.";
  if(state.completed)status="CAMPAIGN 1 COMPLETE · Free practice remains available, or load the next campaign later.";
  $("campaignStatus").textContent=status;
}
function showScreen(id){["startScreen","gameScreen","endScreen"].forEach(x=>$(x).classList.add("hidden"));$(id).classList.remove("hidden");}
function startSession(finalMode=false){
  applyRatingTheme(overallStats().rating);
  const raw=finalMode?buildFinalPlan():buildTrainingPlan();
  session={mode:finalMode?"final":"training",level:state.level,index:0,correct:0,automatic:0,times:[],records:[],plan:raw.map(shuffleOptions)};
  $("sessionLevel").textContent=finalMode?"FINAL":`L${state.level}`;
  showScreen("gameScreen");nextQuestion();
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
    $("timer").style.setProperty("--timer-cut",`${100-left/TIME_LIMIT*100}%`);
    renderSegments(left);
    if(shown<lastTickShown&&shown>0&&shown<TIME_LIMIT){playTick(shown<=3,shown);lastTickShown=shown;}
    if(left<=0){clearInterval(timerHandle);answer(-1,true);}
  },50);
}
function nextQuestion(){
  locked=false;
  if(session.index>=session.plan.length){finishSession();return;}
  current=session.plan[session.index];
  if(!current||!Array.isArray(current.display)||current.display.length!==4||!Number.isInteger(current.correctPos)||current.correctPos<0||current.correctPos>3){console.error("Skipping invalid question",current);session.index++;setTimeout(nextQuestion,0);return;}
  $("qIndex").textContent=session.index+1;$("qTotal").textContent="/ "+session.plan.length;
  $("questionText").textContent=current.q;
  const wrap=$("answers");wrap.innerHTML="";
  current.display.forEach((txt,i)=>{const b=document.createElement("button");b.className="answer";b.textContent=txt;b.onclick=()=>answer(i,false);wrap.appendChild(b);});
  $("timerText").textContent="10.0";renderSegments(10);startTimer();
}
function feedback(ok,type,sec,correct){
  const f=$("feedback");f.className="feedback "+(ok?"ok":"no");
  const label=ok?(type==="automatic"?"AUTOMATIC":type==="secure"?"CORRECT":"CORRECT · SLOW"):(type==="timeout"?"TIME":"INCORRECT");
  f.innerHTML=`${label}<small>${sec.toFixed(2)}s${ok?"":` · Correct: ${correct}`}</small>`;
  requestAnimationFrame(()=>f.classList.add("show"));
  setTimeout(()=>f.classList.remove("show"),ok?520:900);
}
function answer(pos,timeout=false){
  if(locked)return;locked=true;clearInterval(timerHandle);
  const sec=timeout?TIME_LIMIT:Math.max(.05,(TIME_LIMIT*1000-(deadline-performance.now()))/1000);
  const ok=pos===current.correctPos&&!timeout,type=outcomeType(ok,sec,current.targetTime||3.6,timeout);
  const buttons=[...$("answers").children];
  buttons.forEach((b,i)=>{b.disabled=true;b.classList.remove("good","bad","dim");if(i===current.correctPos)b.classList.add("good");else b.classList.add("dim");});
  if(!ok&&pos>=0){buttons[pos].classList.remove("dim");buttons[pos].classList.add("bad");}
  const previousSeen=state.seen[current.fingerprint]||null,speedScore=updateMetric(current,ok,sec,type),info=previousSeen||{count:0,lastLevel:-99};
  state.seen[current.fingerprint]={count:info.count+1,lastLevel:state.level,lastTs:Date.now()};state.templateLast[current.templateId]=state.level;
  const rec={level:state.level,qid:current.id,cat:current.cat,skill:current.skill,templateId:current.templateId,domain:current.domain,correct:ok,ms:Math.round(sec*1000),type,speedScore,review:!!previousSeen,gap:previousSeen?state.level-previousSeen.lastLevel:null,ts:Date.now(),question:current.q,userAnswer:pos>=0?current.display[pos]:"No answer",correctAnswer:current.display[current.correctPos],rule:current.rule};
  state.history.push(rec);state.history=state.history.slice(-12000);state.totalAttempts++;session.records.push(rec);session.times.push(sec);if(ok)session.correct++;if(type==="automatic")session.automatic++;
  const answeredIndex=session.index,delay=ok?650:1050;setTimeout(()=>{if(!session||session.index!==answeredIndex)return;session.index++;try{nextQuestion();}catch(e){console.error("Question advance recovered",e);locked=false;setTimeout(nextQuestion,120);}},delay);
  try{save();}catch(e){console.error("Progress save failed",e);}try{applyRatingTheme(overallStats().rating);}catch(e){console.error(e);}try{if(ok)playCorrect();else playWrong();}catch(e){console.error("Audio failed",e);}try{feedback(ok,type,sec,rec.correctAnswer);}catch(e){console.error("Feedback failed",e);}
}
function finishSession(){
  clearInterval(timerHandle);
  const completedLevel=state.level,n=session.records.length,accuracy=session.correct/n,avgMs=Math.round(mean(session.records.map(r=>r.ms))),auto=session.automatic/n;
  const before=state.sessionHistory.length?state.sessionHistory[state.sessionHistory.length-1]:null;
  state.sessions++;if(session.mode==="training")state.level++;
  let st=overallStats();
  const snap={level:completedLevel,ts:Date.now(),mode:session.mode,correct:session.correct,total:n,accuracy,avgMs,automatic:auto,mastery:st.mastery,coverage:st.coverage,fluency:st.fluency,rating:st.rating};
  state.sessionHistory.push(snap);
  state.personalBestFluency=Math.max(state.personalBestFluency||0,st.rating);
  if(session.mode==="final"){
    state.finalAttempts=(state.finalAttempts||0)+1;
    if(accuracy>=.85&&avgMs<=6000)state.completed=true;
  }
  save();playComplete();renderEnd(snap,before);showScreen("endScreen");
}
function renderEnd(s,before){
  const st=overallStats(),sg=stageInfo(st.coverage),rb=ratingBand(st.rating);
  applyRatingTheme(st.rating);
  $("endKicker").textContent=s.mode==="final"?"FINAL CHALLENGE":`LEVEL ${s.level} COMPLETE`;
  $("endScore").textContent=`${s.correct}/${s.total} · ${pct(s.accuracy)}%`;
  $("endSub").textContent=`AE RATING ${pct(st.rating)} · ${rb.name} · ${sg.name} · ${Object.keys(state.seen).length.toLocaleString()}/${BANK.length.toLocaleString()} explored`;
  $("eAvg").textContent=fmtSec(s.avgMs);$("eAuto").textContent=pct(s.automatic)+"%";$("eFluency").textContent=pct(st.rating);
  $("eCoverage").textContent=pct(st.coverage)+"%";$("eMastery").textContent=pct(st.mastery)+"%";$("eMastered").textContent=`${st.mastered}/${CAMPAIGN.skills.length}`;
  $("dAcc").innerHTML=before?deltaText((s.accuracy-before.accuracy)*100,true," pts"):'<span class="delta neutral">First level</span>';
  $("dTime").innerHTML=before?deltaText((s.avgMs-before.avgMs)/1000,false,"s"):'<span class="delta neutral">First level</span>';
  $("dFlu").innerHTML=before?deltaText((st.rating-(before.rating??before.fluency))*100,true," pts"):'<span class="delta neutral">First level</span>';
  const trend=state.sessionHistory.filter(x=>x.mode==="training");
  $("accuracyChart").innerHTML=sparkline(trend.map(x=>x.accuracy*100),v=>`${Math.round(v)}%`);
  $("timeChart").innerHTML=sparkline(trend.map(x=>x.avgMs/1000),v=>`${v.toFixed(1)}s`,true);
  const uniqueDone=Object.keys(state.seen).length;
  const repeated=Object.values(state.seen).reduce((n,x)=>n+Math.max(0,(x.count||1)-1),0);
  $("ePhrasesDone").textContent=uniqueDone.toLocaleString();
  $("eRepeats").textContent=repeated.toLocaleString();
  $("eBankTotal").textContent=BANK.length.toLocaleString();
  $("weakSkills").innerHTML=topWeak().map(x=>`<div class="skillrow"><div class="name">${x.name}</div><div class="track"><div class="fill mastery" style="width:${pct(x.mastery)}%"></div></div><div class="pct">${pct(x.mastery)}%</div></div>`).join("");
  const wrong=session.records.filter(r=>!r.correct);
  $("errorsBtn").textContent=`REVIEW ERRORS - ${wrong.length}`;
  $("errorsBtn").classList.toggle("hidden",wrong.length===0);
  $("errorsCount").textContent=wrong.length?`${wrong.length} ${wrong.length===1?"error":"errors"} in Level ${s.level}`:`No errors in Level ${s.level}`;
  $("errorsFull").innerHTML=wrong.length?wrong.map((r,i)=>`<details open><summary>${i+1}. ${escapeHtml(r.question)} - ${(r.ms/1000).toFixed(1)}s</summary><p><b>You:</b> ${escapeHtml(r.userAnswer)}<br><b>Correct:</b> ${escapeHtml(r.correctAnswer)}<br>${escapeHtml(r.rule)}</p></details>`).join(""):'<p class="meta">No errors in this level.</p>';
  $("continueBtn").textContent=state.completed?"KEEP TRAINING":`CONTINUE - LEVEL ${state.level}`;
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
  const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(s.campaignId!==CAMPAIGN.campaignId)throw Error();localStorage.setItem(STORAGE_KEY,JSON.stringify(s));state=loadState();renderStart();alert("Progress imported.");}catch(e){alert("This progress file is not valid for Campaign 1.");}};r.readAsText(file);
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
  CAMPAIGN=await loadCampaign();
  const before=CAMPAIGN.questions.length;
  CAMPAIGN.questions=CAMPAIGN.questions.filter(validQuestion);
  if(CAMPAIGN.questions.length!==before)console.warn(`Adaptive English skipped ${before-CAMPAIGN.questions.length} invalid question(s) with duplicate/broken options.`);
  BANK=CAMPAIGN.questions;state=loadState();save();
  const seg=$("segments");for(let i=0;i<10;i++){const d=document.createElement("div");d.className="seg";seg.appendChild(d);}
  $("startBtn").onclick=async()=>{await ensureAudio();startSession(false);};
  $("continueBtn").onclick=async()=>{await ensureAudio();if(state.completed){renderStart();showScreen("startScreen");}else startSession(false);};
  $("finalBtn").onclick=async()=>{await ensureAudio();startSession(true);};
  $("soundBtn").onclick=async()=>{soundOn=!soundOn;if(soundOn){await ensureAudio();tone(760,.06,.025,'sine');}refreshSoundButton();};
  refreshSoundButton();
  $("exportBtn").onclick=exportProgress;$("importBtn").onclick=()=>$("importFile").click();
  $("importFile").onchange=e=>e.target.files[0]&&importProgress(e.target.files[0]);
  $("resetBtn").onclick=resetProgress;$("homeBtn").onclick=()=>{renderStart();showScreen("startScreen");};
  $("errorsBtn").onclick=()=>showScreen("errorsScreen");
  $("errorsBackBtn").onclick=()=>showScreen("endScreen");
  renderStart();showScreen("startScreen");
}
boot().catch(err=>{console.error(err);document.body.innerHTML='<div style="padding:30px;color:white;font-family:system-ui"><h1>Adaptive English</h1><p>Could not load Campaign 1.</p></div>';});
