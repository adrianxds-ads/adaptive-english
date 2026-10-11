/* Visual elapsed-time readout. No deadlines, engine updates, or storage writes. */
(()=>{
  'use strict';
  const game=document.getElementById('gameScreen');
  const header=game?.querySelector('.focus-topline');
  if(!header||document.getElementById('focusTimeDisplay'))return;
  const node=document.createElement('span');
  node.id='focusTimeDisplay';
  node.className='focus-time is-reading';
  node.setAttribute('role','timer');
  node.setAttribute('aria-label','Tiempo de respuesta transcurrido');
  node.setAttribute('aria-live','off');
  node.textContent='LEER';
  const pause=header.querySelector('#focusPauseBtn');
  if(pause)header.insertBefore(node,pause);
  else header.append(node);
  let marker='',fixed=null;
  function render(){
    if(game.classList.contains('hidden'))return;
    const key=document.getElementById('focusQuestionCounter')?.textContent||'';
    if(marker!==key){marker=key;fixed=null;}
    let elapsed=0;
    const started=typeof focusAnswerAt==='number'&&focusAnswerAt>0;
    const waiting=typeof focusAwaiting==='boolean'&&focusAwaiting;
    const paused=typeof focusPausedAt==='number'&&focusPausedAt>0;
    const stopped=typeof locked==='boolean'&&locked;
    if(!started||waiting){
      node.textContent='LEER';
      node.classList.add('is-reading');
      node.classList.remove('is-paused');
      return;
    }
    const now=paused?focusPausedAt:performance.now();
    elapsed=Math.max(0,(now-focusAnswerAt)/1000);
    if(stopped){
      if(fixed===null)fixed=elapsed;
      elapsed=fixed;
    }else{fixed=null;}
    node.textContent=elapsed.toFixed(1)+' s';
    node.classList.remove('is-reading');
    node.classList.toggle('is-paused',paused||stopped);
  }
  render();
  window.setInterval(render,100);
})();