(()=>{
  "use strict";
  function mount(){
    const nav=document.querySelector(".adrian-tools");
    if(!nav)return;
    const update=()=>document.documentElement.style.setProperty(
      "--nucleo-topbar-height",Math.ceil(nav.getBoundingClientRect().height)+"px"
    );
    update();
    if(typeof ResizeObserver!=="undefined")new ResizeObserver(update).observe(nav);
    window.addEventListener("orientationchange",update,{passive:true});
    if(window.visualViewport)window.visualViewport.addEventListener("resize",update,{passive:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});
  else mount();
})();
