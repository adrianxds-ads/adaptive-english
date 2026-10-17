(() => {
const game=document.getElementById('gameScreen');
if(!game)return;
// Reuse the engine-owned countdown nodes; the shared legacy renderer assumes
// Grammar is untimed and must not supply its elapsed-time presentation here.
const answers=document.getElementById('answers');
const clock=document.getElementById('focusTimerText');
const seconds=document.getElementById('focusSeconds');
if(answers&&clock&&seconds){
  const timer=document.createElement('section');timer.className='focus-native-timer';
  const head=document.createElement('div');head.className='focus-native-timer-head';
  const label=document.createElement('span');label.textContent='Tiempo para responder';
  head.append(label,clock);timer.append(head,seconds);answers.after(timer);
}
const sync=()=>{document.body.dataset.grammarFocus=String(!game.classList.contains('hidden'));};
new MutationObserver(sync).observe(game,{attributes:true,attributeFilter:['class']});
sync();
})();
