/* Grammar Quest: non-destructive typography controls · 3.36.13.
   New preference key is independent from all learning, bank and session storage. */
(()=>{'use strict';
const KEY='nucleo-grammar-font-scale-v1',STEPS=[100,115,130,145,160];
const root=document.documentElement,less=document.getElementById('grammarFontSmaller'),
more=document.getElementById('grammarFontLarger'),output=document.getElementById('grammarFontSize');
if(!less||!more||!output)return;
let selected=115;
try{const stored=Number(localStorage.getItem(KEY));if(STEPS.includes(stored))selected=stored;}catch(_){}
function apply(){
 root.style.setProperty('--gq-text-scale',String(selected/100));
 output.textContent=selected+'%';
 less.disabled=selected===STEPS[0];more.disabled=selected===STEPS[STEPS.length-1];
}
function change(by){
 const at=STEPS.indexOf(selected),next=STEPS[Math.max(0,Math.min(STEPS.length-1,at+by))];
 if(next===selected)return;selected=next;apply();
 try{localStorage.setItem(KEY,String(selected));}catch(_){}
}
less.addEventListener('click',()=>change(-1));
more.addEventListener('click',()=>change(1));
apply();
window.__GQ_FONT_AUDIT__=Object.freeze({size:()=>selected,key:KEY});
})();
