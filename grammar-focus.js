(() => {
const game=document.getElementById('gameScreen');
if(!game)return;
const sync=()=>{document.body.dataset.grammarFocus=String(!game.classList.contains('hidden'));};
new MutationObserver(sync).observe(game,{attributes:true,attributeFilter:['class']});
sync();
})();
