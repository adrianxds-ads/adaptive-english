async function loadLevelData(){
  const r=await fetch('./level.json?t='+Date.now(),{cache:'no-store'});
  if(!r.ok) throw new Error('Could not load level.json ('+r.status+')');
  const d=await r.json();
  if(!d||!Number.isInteger(d.level)||!Array.isArray(d.questions)) throw new Error('Invalid level.json');
  return d;
}
async function bootAdaptive(){
  const LEVEL_DATA=await loadLevelData();

const MAX_Q=15, LIMIT=10;
const CURRENT_LEVEL=Number(LEVEL_DATA.level);
const NEXT_LEVEL=Number(LEVEL_DATA.nextLevel ?? CURRENT_LEVEL+1);
const KEY=`adaptive_english_level${CURRENT_LEVEL}_v1`;
const NEW_CATS=new Set(["inversion","mixed_conditional","causative","reporting_verbs"]);
const SPACED_CATS=new Set(["wish_past","mustnt_have_to","third_conditional","whose","used_to","make_bare","look_forward"]);

const TEST_LEVEL=Number(LEVEL_DATA.testLevel);
const LEVEL_BG_SCALE=[
  [0,"#241317"],[10,"#2C1818"],[20,"#322018"],[30,"#17251F"],[40,"#163027"],
  [50,"#123337"],[60,"#142F43"],[70,"#182A50"],[80,"#24264F"],[90,"#332449"],[100,"#3B3218"]
];

function getLevelBackground(level){
  if(level>=100) return LEVEL_BG_SCALE[10][1];
  const band=Math.max(0,Math.min(9,Math.floor(level/10)));
  return LEVEL_BG_SCALE[band][1];
}

function applyLevelBackground(){
  const bg=getLevelBackground(TEST_LEVEL);
  document.documentElement.style.setProperty("--bg",bg);
  document.documentElement.style.setProperty("--bg-deep",bg);
  document.body.style.background=bg;
}


function renderLevelShell(){
  const tip=LEVEL_DATA.tip||{};
  const setText=(sel,text)=>{const n=document.querySelector(sel);if(n)n.textContent=text;};
  const setHtml=(sel,value)=>{const n=document.querySelector(sel);if(n)n.innerHTML=value||'';};
  setText('#startScreen .kicker',`LEVEL ${CURRENT_LEVEL} · B2 → C1`);
  setText('#startScreen h1',`LEVEL ${CURRENT_LEVEL} · Adaptive English`);
  setText('#tipsScreen .tip-kicker',`LEVEL ${CURRENT_LEVEL} · INITIAL TIP`);
  setHtml('#tipsScreen .test-level-value',`${TEST_LEVEL}<span>%</span>`);
  setText('.single-tip-title',tip.title||'INITIAL TIP');
  setHtml('.single-tip-rule',tip.ruleHtml);
  setHtml('.single-tip-formula',tip.formulaHtml);
  setHtml('.single-tip-example',tip.exampleHtml);
  setHtml('.single-tip-contrast',tip.contrastHtml);
  setText('#tipStartBtn',`START LEVEL ${CURRENT_LEVEL}`);
  setText('#endScreen .kicker',`LEVEL ${CURRENT_LEVEL} COMPLETE`);
  document.title=`Adaptive English · LEVEL ${CURRENT_LEVEL}`;
}
renderLevelShell();
applyLevelBackground();

const priors=LEVEL_DATA.priors;

const bank=LEVEL_DATA.questions;

const SHAPES_SVG = [
 '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,8 95,88 5,88" fill="white" stroke="rgba(0,0,0,.35)" stroke-width="4"/></svg>',
 '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,5 95,50 50,95 5,50" fill="white" stroke="rgba(0,0,0,.35)" stroke-width="4"/></svg>',
 '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="white" stroke="rgba(0,0,0,.35)" stroke-width="4"/></svg>',
 '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="10" y="10" width="80" height="80" fill="white" stroke="rgba(0,0,0,.35)" stroke-width="4"/></svg>'
];

const CAT_NAMES = {
  would_rather:"would rather + subject + past",
  allow_to:"allow + object + to-infinitive",
  so_such:"so / such / too / enough",
  modal_perfect:"modal perfects",
  backshift:"reported speech / backshift",
  past_perfect:"past perfect",
  despite:"despite / although",
  unless:"unless",
  look_forward:"look forward to + -ing",
  third_conditional:"third conditional",
  wish_past:"wish + past perfect",
  mustnt_have_to:"mustn't / don't have to",
  whose:"whose",
  used_to:"get used to + -ing",
  make_bare:"make + bare infinitive",
  inversion:"inversion",
  mixed_conditional:"mixed conditional",
  causative:"causative",
  reporting_verbs:"reporting verbs",
  collocation:"collocation",
  phrasal:"phrasal verbs",
  functional:"functional English"
};

let state = loadState();
let session = null;
let current = null;
let startStamp = 0;
let timeoutId = null;
let rafId = null;
let countdownIntervalId = null;
let soundOn = true;
let audioCtx = null;
let playMode = "focus";
let toastTimer = null;

function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem(KEY) || "{}");
    const metrics = {};
    for(const [cat,p] of Object.entries(priors)){
      const old = s.metrics?.[cat] || {};
      metrics[cat] = {
        k: old.k ?? p.k,
        a: old.a ?? p.a,
        t: old.t ?? p.t,
        lastSession: old.lastSession ?? -99,
        interval: old.interval ?? 1,
        domains: old.domains || {}
      };
    }
    return { metrics, sessions:s.sessions || 0, seen:s.seen || {}, history:s.history || [] };
  }catch(e){
    const metrics={};
    for(const [cat,p] of Object.entries(priors)){
      metrics[cat]={...p,lastSession:-99,interval:1,domains:{}};
    }
    return { metrics, sessions:0, seen:{}, history:[] };
  }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }

const el = id => document.getElementById(id);

async function unlockAudio(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return false;

    if(!audioCtx){
      audioCtx=new AC();
    }

    if(audioCtx.state==="suspended"){
      await audioCtx.resume();
    }

    const buffer=audioCtx.createBuffer(1,1,22050);
    const source=audioCtx.createBufferSource();
    source.buffer=buffer;
    source.connect(audioCtx.destination);
    source.start(0);

    return audioCtx.state==="running";
  }catch(e){
    return false;
  }
}

function initAudio(){
  if(!audioCtx){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(AC) audioCtx=new AC();
  }
  if(audioCtx?.state==="suspended"){
    audioCtx.resume().catch(()=>{});
  }
}

function tone(freq,dur=.07,type="sine",gain=.07,delay=0,slideTo=null){
  if(!soundOn) return;
  initAudio();
  if(!audioCtx || audioCtx.state!=="running") return;

  const o=audioCtx.createOscillator();
  const g=audioCtx.createGain();

  o.type=type;
  o.frequency.setValueAtTime(freq,audioCtx.currentTime+delay);

  if(slideTo){
    o.frequency.exponentialRampToValueAtTime(
      Math.max(1,slideTo),
      audioCtx.currentTime+delay+dur
    );
  }

  g.gain.setValueAtTime(.0001,audioCtx.currentTime+delay);
  g.gain.exponentialRampToValueAtTime(
    Math.max(.0002,gain),
    audioCtx.currentTime+delay+.005
  );
  g.gain.exponentialRampToValueAtTime(
    .0001,
    audioCtx.currentTime+delay+dur
  );

  o.connect(g);
  g.connect(audioCtx.destination);

  o.start(audioCtx.currentTime+delay);
  o.stop(audioCtx.currentTime+delay+dur+.02);
}

function noiseClick(delay=0,gain=.018){
  if(!soundOn) return;
  initAudio();
  if(!audioCtx || audioCtx.state!=="running") return;

  const duration=.018;
  const length=Math.max(1,Math.floor(audioCtx.sampleRate*duration));
  const buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate);
  const data=buffer.getChannelData(0);

  for(let i=0;i<length;i++){
    // short mechanical click: fast decay, no hiss tail
    const env=Math.pow(1-i/length,5);
    data[i]=(Math.random()*2-1)*env;
  }

  const source=audioCtx.createBufferSource();
  const filter=audioCtx.createBiquadFilter();
  const g=audioCtx.createGain();

  filter.type="bandpass";
  filter.frequency.value=2300;
  filter.Q.value=1.2;
  g.gain.value=gain;

  source.buffer=buffer;
  source.connect(filter);
  filter.connect(g);
  g.connect(audioCtx.destination);
  source.start(audioCtx.currentTime+delay);
}


function arcadeTone(freq,dur,type="square",gain=.045,delay=0){
  if(!soundOn || !audioCtx) return;
  const t=audioCtx.currentTime+delay;
  const o=audioCtx.createOscillator();
  const g=audioCtx.createGain();
  o.type=type;
  o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(gain,t);
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(t); o.stop(t+dur);
}
function sCorrect(){
  if(!soundOn || !audioCtx) return;
  arcadeTone(520,.07,"square",.05,0);
  arcadeTone(780,.07,"square",.05,.07);
  arcadeTone(1040,.11,"square",.045,.14);
}
function sWrong(){
  if(!soundOn || !audioCtx) return;
  arcadeTone(300,.08,"sawtooth",.05,0);
  arcadeTone(220,.09,"square",.045,.08);
  arcadeTone(150,.13,"square",.04,.17);
}

function sStart(){
  tone(480,.045,"sine",.045,0,620);
  tone(680,.060,"sine",.055,.045,820);
}

/* Cartoon-like positive pop: rising two-note "boing/ding" */


/* Cartoon-like negative wobble: descending "wah-wah" */


/* Quiet, dry mechanical tick. Last 3 seconds only slightly stronger. */
function sTick(strong=false){
  noiseClick(0,strong ? .026 : .014);
  tone(
    strong ? 1450 : 1250,
    .014,
    "square",
    strong ? .014 : .007
  );
}
function vibrate(pattern){ if(navigator.vibrate) navigator.vibrate(pattern); }


function setMode(mode){
  playMode=mode;
  document.body.classList.toggle("focus-mode", mode==="focus");
  document.body.classList.toggle("game-mode", mode==="game");
  el("focusModeBtn")?.classList.toggle("active", mode==="focus");
  el("gameModeBtn")?.classList.toggle("active", mode==="game");
  if(el("modeHint")){
    el("modeHint").textContent = mode==="focus"
      ? "Focus: quieter, flatter feedback and fewer visual effects."
      : "Game: slightly stronger sound and visual reinforcement.";
  }
}
setMode("focus");

function showToast(type){
  clearTimeout(toastTimer);
  const t=el("resultToast");
  t.className="result-toast";
  const label = type==="correct" ? "CORRECT!" : type==="incorrect" ? "INCORRECT!" : "TIME!";
  t.textContent=label;
  t.classList.add(type,"show");
  toastTimer=setTimeout(()=>t.classList.remove("show"), 960);
}

function buildTimeline(){
  const wrap = el("timeline");
  wrap.innerHTML = "";
  for(let i=0;i<MAX_Q;i++){
    const d = document.createElement("div");
    d.className = "seg";
    wrap.appendChild(d);
  }
}
buildTimeline();

function paintTimeline(){
  const segs=[...document.querySelectorAll(".seg")];
  segs.forEach((s,i)=>{
    s.className="seg";
    if(i<session.index) s.classList.add("done");
    if(i===session.index) s.classList.add("current");
  });
}

function clamp(x){ return Math.max(.03, Math.min(.99, x)); }
function updateMetrics(q, ok, t){
  const m = state.metrics[q.cat];
  const speed = Math.max(0, 1-(t/LIMIT));

  m.k = clamp(m.k*.78 + (ok?1:0)*.22);
  m.a = clamp(m.a*.82 + (ok?Math.pow(speed,.75):0)*.18);

  const seenDomains = m.domains || {};
  const isNewDomain = !seenDomains[q.domain];
  const transferSignal = ok ? (isNewDomain ? 1 : 0.82) : 0;
  m.t = clamp(m.t*.86 + transferSignal*.14);
  seenDomains[q.domain] = (seenDomains[q.domain] || 0) + 1;
  m.domains = seenDomains;

  if(ok && t<=6) m.interval = Math.min(20, Math.max(1, Math.round(m.interval*1.8)));
  else m.interval = 1;

  m.lastSession = state.sessions;
}
function errType(ok,t,timeout=false){
  if(ok && t<=3) return "automatic";
  if(ok && t<=6) return "secure";
  if(ok) return "slow-correct";
  if(timeout) return "timeout";
  if(t<=3.2) return "fast-wrong";
  return "slow-wrong";
}
function categoryScore(cat){
  const m=state.metrics[cat];
  return (1-m.k)*.48 + (1-m.a)*.34 + (1-m.t)*.18;
}
function due(cat){
  const m=state.metrics[cat];
  return (state.sessions - m.lastSession) >= m.interval;
}
function unusedQuestion(cat, usedIds, preferNewDomain=false){
  const m=state.metrics[cat];
  let cand=bank.filter(q=>q.cat===cat && !usedIds.has(q.id));
  if(preferNewDomain){
    const nd=cand.filter(q=>!m.domains?.[q.domain]);
    if(nd.length) cand=nd;
  }
  cand.sort((a,b)=>(state.seen[a.id]||0)-(state.seen[b.id]||0));
  return cand.length ? cand[Math.floor(Math.random()*Math.min(2,cand.length))] : null;
}
function buildPlan(){
  // LEVEL 33: mixed task types for weak structures; preserve 10s while building accuracy before speed.
  return bank.slice(0,15);
}
function buildBalancedPositions(){
  const p=[]; while(p.length<MAX_Q) p.push(0,1,2,3);
  p.length=MAX_Q;
  for(let i=p.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [p[i],p[j]]=[p[j],p[i]];
  }
  return p;
}
function shuffleOptions(q,targetPos){
  const correctText=q.a[q.c];
  const others=q.a.filter((_,i)=>i!==q.c);
  for(let i=others.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [others[i],others[j]]=[others[j],others[i]];
  }
  const arr=[...others];
  arr.splice(targetPos,0,correctText);
  return {...q, display:arr, correctPos:targetPos};
}

function cancelTimers(){
  clearTimeout(timeoutId);
  cancelAnimationFrame(rafId);
  clearInterval(countdownIntervalId);
  countdownIntervalId=null;
}
function setMiniStatus(text="", show=false){
  const ms=el("miniStatus");
  ms.textContent=text || " ";
  ms.classList.toggle("empty", !show);
}

function startSession(){
  initAudio();
  const rawPlan=buildPlan();
  const positions=buildBalancedPositions();
  session={
    index:0,
    correct:0,
    answered:0,
    times:[],
    automatic:0,
    records:[],
    plan:rawPlan.map((q,i)=>shuffleOptions(q,positions[i]))
  };
  el("startScreen").classList.add("hidden");
  el("tipsScreen")?.classList.add("hidden");
  el("endScreen").classList.add("hidden");
  el("gameScreen").classList.remove("hidden");
  nextQuestion();
}
function nextQuestion(){
  if(session.index>=MAX_Q){ finish(); return; }
  current=session.plan[session.index];
  renderQuestion();
}

function setDynamicType(){
  const qLen=current.q.replace(/\s+/g," ").trim().length;

  let qSize;
  if(qLen<=40) qSize=23;
  else if(qLen<=58) qSize=22;
  else if(qLen<=76) qSize=21;
  else if(qLen<=96) qSize=20;
  else if(qLen<=118) qSize=19;
  else qSize=18;

  const longest=Math.max(
    ...current.display.map(x=>x.replace(/\s+/g," ").trim().length)
  );

  let aSize;
  if(longest<=10) aSize=19;
  else if(longest<=16) aSize=18;
  else if(longest<=24) aSize=17;
  else if(longest<=34) aSize=16;
  else if(longest<=48) aSize=15;
  else aSize=14;

  if(document.body.classList.contains("large")){
    qSize=Math.min(qSize+3,26);
    aSize=Math.min(aSize+3,22);
  }

  document.documentElement.style.setProperty("--question-size",qSize+"px");
  document.documentElement.style.setProperty("--answer-size",aSize+"px");
}

function renderLevel25Countdown(){
  const box=el("level25Countdown");
  if(!box) return;
  box.innerHTML="";
  for(let i=0;i<10;i++){
    const s=document.createElement("div");
    s.className="level25-countdown-seg on";
    if(i===0) s.classList.add("current");
    box.appendChild(s);
  }
}

function updateLevel25Countdown(elapsedSec){
  const box=el("level25Countdown");
  if(!box) return;
  const segs=[...box.children];
  const step=Math.min(9, Math.max(0, Math.floor(elapsedSec)));
  const remaining=10-step;

  segs.forEach((s,i)=>{
    s.className="level25-countdown-seg";
    if(i<step) s.classList.add("past");
    else s.classList.add("on");

    if(i===step){
      s.classList.add("current");
      if(remaining<=3) s.classList.add("danger");
      else if(remaining<=6) s.classList.add("warn");
    }
  });
}

function renderQuestion(){
  renderLevel25Countdown();
  cancelTimers();
  paintTimeline();

  el("questionNumber").textContent=String(session.index+1);
  el("question").textContent=current.q;
  setMiniStatus("", false);
  setDynamicType();

  const wrap=el("answers");
  wrap.innerHTML="";
  current.display.forEach((txt,i)=>{
    const b=document.createElement("button");
    b.className="answer";
    b.innerHTML=`
      <span class="answer-shape">${SHAPES_SVG[i]}</span>
      <span class="answer-label">${txt}</span>
      <span class="answer-mark left"></span>
      <span class="answer-mark right"></span>
    `;
    b.onclick=()=>answer(i,false);
    wrap.appendChild(b);
  });

  const dial=el("timerDial");
  const ring=el("timerProgress");
  const timerNumber=el("timerNumber");

  dial.classList.remove("urgent","danger");
  timerNumber.textContent=String(LIMIT);

  ring.style.animationPlayState="running";
  ring.style.animation="none";
  ring.style.strokeDashoffset="0";
  void ring.getBoundingClientRect();
  ring.style.animation="";
  ring.classList.remove("running");
  void ring.getBoundingClientRect();
  ring.classList.add("running");

  startStamp=performance.now();
  timeoutId=setTimeout(()=>answer(-1,true),LIMIT*1000);

  let lastShown=LIMIT+1;

  const updateCountdown=()=>{
    const elapsed=(performance.now()-startStamp)/1000;
  updateLevel25Countdown(elapsed);
    const left=Math.max(0,LIMIT-elapsed);
    const shown=Math.ceil(left);

    timerNumber.textContent=String(shown);

    dial.classList.toggle("urgent",left<=3 && left>1.2);
    dial.classList.toggle("danger",left<=1.2);

    const segs=[...document.querySelectorAll(".progress-timeline .seg")].slice(0,10);
    const remaining=Math.max(0,Math.min(10,shown));
    segs.forEach((seg,idx)=>{
      seg.style.opacity="";
      seg.className="seg";
      if(idx<remaining){
        seg.style.background=idx===remaining-1
          ? "#fff"
          : "rgba(218,235,223,.32)";
      }else{
        seg.style.background="rgba(218,235,223,.13)";
      }
    });

    if(shown!==lastShown){
      if(shown>0 && shown<LIMIT){
        sTick(shown<=3);
      }
      lastShown=shown;
    }
  };

  updateCountdown();
  countdownIntervalId=setInterval(updateCountdown,160);
}
function flashFor(type, elapsed){
  const f=el("flash");
  const ok=["automatic","secure","slow-correct"].includes(type);
  el("flashIcon").textContent=ok ? "✓" : type==="timeout" ? "⏱" : "×";

  let title="", kind="", delay=800, showRule=false;
  if(type==="automatic"){ title=`Automatic · ${elapsed.toFixed(1)}s`; kind="FAST CORRECT"; delay=330; }
  if(type==="secure"){ title=`Secure · ${elapsed.toFixed(1)}s`; kind="CORRECT"; delay=520; }
  if(type==="slow-correct"){ title=`Correct · ${elapsed.toFixed(1)}s`; kind="NOT YET AUTOMATIC"; delay=1050; showRule=true; }
  if(type==="fast-wrong"){ title=`Fast error · ${elapsed.toFixed(1)}s`; kind="LIKELY MISCONCEPTION"; delay=1800; showRule=true; }
  if(type==="slow-wrong"){ title=`Not yet · ${elapsed.toFixed(1)}s`; kind="UNCERTAINTY"; delay=1550; showRule=true; }
  if(type==="timeout"){ title="Time"; kind="UNDER PRESSURE"; delay=1650; showRule=true; }

  el("flashTitle").textContent=title;
  el("flashAnswer").textContent=ok ? "" : `Correct: ${current.display[current.correctPos]}`;
  el("flashRule").textContent=showRule ? current.rule : "";
  el("flashTrigger").textContent=showRule ? current.trigger : "";
  el("flashType").textContent=kind;
  f.classList.add("show");
  setTimeout(()=>{
    f.classList.remove("show");
    session.index++;
    nextQuestion();
  }, delay);
}

function answer(pos, timeout=false){
  const elapsed=Math.min(LIMIT,(performance.now()-startStamp)/1000);
  cancelTimers();
  const remaining=Math.max(0,LIMIT-elapsed);
  if(el("timerNumber")) el("timerNumber").textContent=String(Math.ceil(remaining));
  if(el("timerProgress")) el("timerProgress").style.animationPlayState="paused";
  const ok = pos===current.correctPos;
  const type=errType(ok, elapsed, timeout);

  const buttons=[...document.querySelectorAll(".answer")];
  buttons.forEach((b,i)=>{
    b.disabled=true;

    if(i===current.correctPos){
      b.classList.add("result-correct");
    }else{
      b.classList.add("result-dim");
    }

    if(i===pos && !ok && pos!==-1){
      b.classList.remove("result-dim");
      b.classList.add("result-wrong");
    }
  });

  if(ok && pos!==-1 && buttons[pos]){
    buttons[pos].classList.add("result-correct");
  }
  if(timeout && buttons[current.correctPos]){
    buttons[current.correctPos].classList.remove("result-dim");
  }

  session.answered++;
  if(ok) session.correct++;
  session.times.push(elapsed);
  if(type==="automatic") session.automatic++;

  updateMetrics(current, ok, elapsed);
  state.seen[current.id]=(state.seen[current.id]||0)+1;
  const rec={session:state.sessions,qid:current.id,cat:current.cat,domain:current.domain,correct:ok,ms:Math.round(elapsed*1000),type,ts:Date.now(),question:current.q,userAnswer:pos===-1?"No answer":current.display[pos],correctAnswer:current.display[current.correctPos],rule:current.rule,trigger:current.trigger};
  session.records.push(rec);
  state.history.push(rec);
  if(state.history.length>1200) state.history=state.history.slice(-1200);
  save();

  if(ok){
    sCorrect();
    if(playMode==="game") vibrate(18);
    showToast("correct");
  }else if(timeout){
    if(playMode==="game") sWrong();
    if(playMode==="game") vibrate([28,22,28]);
    showToast("timeout");
  }else{
    sWrong();
    if(playMode==="game") vibrate(type==="fast-wrong" ? [44,24,44] : [32,24,32]);
    showToast("incorrect");
  }

  const delay = 1040;

  const zone=document.querySelector(".question-zone");
  setTimeout(()=>zone?.classList.add("fade-out"), Math.max(0,delay-85));
  setTimeout(()=>{
    zone?.classList.remove("fade-out");
    session.index++;
    nextQuestion();
  }, delay);
}

function averageMetric(key){
  const cats=[...new Set(session.records.map(r=>r.cat))];
  if(!cats.length) return 0;
  return cats.reduce((s,c)=>s+state.metrics[c][key],0)/cats.length;
}
function setBar(id,val){ el(id).style.width=`${Math.round(val*100)}%`; }

function escapeHTML(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function finish(){
  cancelTimers();
  state.sessions++;
  save();

  el("gameScreen").classList.add("hidden");
  el("endScreen").classList.remove("hidden");

  const pct=Math.round(session.correct/MAX_Q*100);
  const avg=session.times.reduce((a,b)=>a+b,0)/Math.max(1,session.times.length);

  el("endTitle").textContent=`${session.correct}/15 · ${pct}%`;
  el("finalScore").textContent=`${session.correct}/15`;
  el("avgTime").textContent=`${avg.toFixed(1)}s`;
  el("autoCount").textContent=session.automatic;

  const cats=[...new Set(session.records.map(r=>r.cat))];
  const weak=cats
    .map(c=>({c,m:state.metrics[c],score:categoryScore(c)}))
    .sort((x,y)=>y.score-x.score)
    .slice(0,3);

  const wrong=session.records.filter(r=>!r.correct);
  const slowCorrect=session.records.filter(r=>r.correct && r.ms>3000);
  const fastWrong=session.records.filter(r=>r.type==="fast-wrong");

  const primary=weak[0];
  const primaryName=primary ? (CAT_NAMES[primary.c]||primary.c) : "maintenance";
  const secondaryName=weak[1] ? (CAT_NAMES[weak[1].c]||weak[1].c) : null;

  let focusText=`Prioritise <b>${escapeHTML(primaryName)}</b>`;
  if(secondaryName) focusText+=` and <b>${escapeHTML(secondaryName)}</b>`;
  if(fastWrong.length) focusText+=`. ${fastWrong.length} fast error${fastWrong.length===1?"":"s"} may indicate a wrongly automated pattern`;
  if(slowCorrect.length) focusText+=`. ${slowCorrect.length} correct answer${slowCorrect.length===1?" was":"s were"} still slower than automatic`;
  focusText+=".";
  el("nextFocusCompact").innerHTML=focusText;

  if(wrong.length){
    el("compactErrors").innerHTML=wrong.map((r,i)=>`
      <div class="error-row">
        <span class="error-q">${i+1}. ${escapeHTML(r.question)}</span>
        <div class="error-line"><b>You:</b> ${escapeHTML(r.userAnswer)} · <b>Correct:</b> ${escapeHTML(r.correctAnswer)} · ${(r.ms/1000).toFixed(1)}s</div>
        <div class="error-why">${escapeHTML(r.rule || "")}</div>
      </div>
    `).join("");
  }else{
    el("compactErrors").innerHTML=`<div class="error-why">No errors in this round.</div>`;
  }

  const focusLines=weak.length
    ? weak.map(x=>`- ${CAT_NAMES[x.c]||x.c}: knowledge ${Math.round(x.m.k*100)}%, automaticity ${Math.round(x.m.a*100)}%, transfer ${Math.round(x.m.t*100)}%`).join("\n")
    : "- General maintenance";

  const errorLines=wrong.length
    ? wrong.map((r,i)=>`${i+1}. ${r.question}
   My answer: ${r.userAnswer}
   Correct: ${r.correctAnswer}
   Time: ${(r.ms/1000).toFixed(1)}s
   Pattern: ${CAT_NAMES[r.cat]||r.cat}
   Rule: ${r.rule}`).join("\n")
    : "No incorrect answers.";

  const slowLines=slowCorrect.length
    ? slowCorrect.slice(0,6).map(r=>`- ${CAT_NAMES[r.cat]||r.cat}: correct in ${(r.ms/1000).toFixed(1)}s`).join("\n")
    : "None.";

  const prompt=`AE RESULT · L${CURRENT_LEVEL}
SCORE ${session.correct}/15 (${pct}%)
AVG ${avg.toFixed(1)}s
AUTO ${session.automatic}/15
TEST_LEVEL ${TEST_LEVEL}%

PRIORITY
${focusLines}

ERRORS
${errorLines}

SLOW
${slowLines}

CREATE + PUBLISH LEVEL ${NEXT_LEVEL}`;

  el("handoffPrompt").value=prompt;
}

async function copyHandoffPrompt(){
  const box=el("handoffPrompt");
  const status=el("copyStatus");
  const text=box.value;

  let copied=false;

  // 1) Modern Clipboard API when the origin/browser permits it.
  try{
    if(navigator.clipboard && typeof navigator.clipboard.writeText==="function"){
      await navigator.clipboard.writeText(text);
      copied=true;
    }
  }catch(e){}

  // 2) Android/local-file fallback: copy from a temporary editable textarea.
  if(!copied){
    try{
      const temp=document.createElement("textarea");
      temp.value=text;
      temp.setAttribute("aria-hidden","true");
      temp.style.position="fixed";
      temp.style.left="-9999px";
      temp.style.top="0";
      temp.style.width="1px";
      temp.style.height="1px";
      temp.style.opacity="0";
      temp.style.fontSize="16px";
      document.body.appendChild(temp);

      temp.focus({preventScroll:true});
      temp.select();
      temp.setSelectionRange(0,temp.value.length);

      copied=document.execCommand("copy")===true;
      temp.remove();
    }catch(e){}
  }

  if(copied){
    status.textContent="Copied ✓";
    setTimeout(()=>status.textContent="",1600);
    return;
  }

  // 3) Last-resort local-file behaviour:
  // select the visible text so Android's native Copy action can be used.
  try{
    box.removeAttribute("readonly");
    box.focus({preventScroll:false});
    box.select();
    box.setSelectionRange(0,box.value.length);
    box.setAttribute("readonly","");
    status.textContent="Selected — tap Copy";
  }catch(e){
    status.textContent="Long-press the result and choose Copy";
  }
}

async function shareHandoffPrompt(){
  const text=el("handoffPrompt").value;
  const status=el("copyStatus");

  if(navigator.share){
    try{
      await navigator.share({
        title:`Adaptive English · Level ${CURRENT_LEVEL} Result`,
        text
      });
      status.textContent="Shared ✓";
      setTimeout(()=>status.textContent="",1600);
      return;
    }catch(e){}
  }

  // If Share is unavailable, fall back to the copy routine.
  copyHandoffPrompt();
}

el("focusModeBtn").onclick=()=>setMode("focus");
el("gameModeBtn").onclick=()=>setMode("game");
function showTips(){
  el("startScreen").classList.add("hidden");
  el("endScreen").classList.add("hidden");
  el("gameScreen").classList.add("hidden");
  el("tipsScreen").classList.remove("hidden");
}

el("startBtn").onclick=async()=>{
  await unlockAudio();
  sStart();
  showTips();
};

el("tipStartBtn").onclick=async()=>{
  await unlockAudio();
  sStart();
  el("tipsScreen").classList.add("hidden");
  startSession();
};

el("againBtn").onclick=async()=>{
  await unlockAudio();
  sStart();
  el("endScreen").classList.add("hidden");
  showTips();
};
el("copyPromptBtn").onclick=copyHandoffPrompt;
el("sharePromptBtn").onclick=shareHandoffPrompt;
el("copyPromptBtn").textContent=`Copy Level ${CURRENT_LEVEL} result`;
el("againBtn").textContent=`Repeat Level ${CURRENT_LEVEL}`;
el("resetBtn").onclick=()=>{
  localStorage.removeItem(KEY);
  state=loadState();
  alert("Progress reset.");
};
el("soundBtn").onclick=async()=>{
  soundOn=!soundOn;
  el("soundBtn").classList.toggle("off",!soundOn);
  if(soundOn){
    await unlockAudio();
    tone(720,.08,"sine",.07);
  }
};

}
bootAdaptive().catch(err=>{
  console.error(err);
  document.body.innerHTML='<main style="padding:24px;color:white;font-family:system-ui"><h1>Adaptive English</h1><p>Could not load the current level. Reopen the app or check your connection.</p></main>';
});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').then(r=>r.update()).catch(()=>{}));
}
