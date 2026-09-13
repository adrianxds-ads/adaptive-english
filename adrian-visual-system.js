/* Adrián Visual System · AVS 1.0
   Canonical reusable colour language for apps, agents and games. */
window.ADRIAN_VISUAL_SYSTEM=Object.freeze({
  version:"1.0",
  scale:15,
  ranks:Object.freeze([
    Object.freeze({level:1,name:"Umber",color:"#2B1B18",meaning:"critical"}),
    Object.freeze({level:2,name:"Mahogany",color:"#3A211D",meaning:"very-low"}),
    Object.freeze({level:3,name:"Oxblood",color:"#52231F",meaning:"low"}),
    Object.freeze({level:4,name:"Wine",color:"#6B2926",meaning:"weak"}),
    Object.freeze({level:5,name:"Rust",color:"#84352C",meaning:"building"}),
    Object.freeze({level:6,name:"Copper",color:"#A34B2A",meaning:"transition"}),
    Object.freeze({level:7,name:"Amber",color:"#B96B25",meaning:"developing"}),
    Object.freeze({level:8,name:"Olive",color:"#9A8128",meaning:"midpoint"}),
    Object.freeze({level:9,name:"Moss",color:"#6E8735",meaning:"competent"}),
    Object.freeze({level:10,name:"Emerald",color:"#3F8F4B",meaning:"good"}),
    Object.freeze({level:11,name:"Teal",color:"#278C70",meaning:"very-good"}),
    Object.freeze({level:12,name:"Blue",color:"#2D7FA3",meaning:"strong"}),
    Object.freeze({level:13,name:"Indigo",color:"#3F63B2",meaning:"advanced"}),
    Object.freeze({level:14,name:"Violet",color:"#6B4AB8",meaning:"elite"}),
    Object.freeze({level:15,name:"Gold",color:"#E2B84B",meaning:"maximum"})
  ]),
  semantics:Object.freeze({negative:"1-4",transition:"5-8",positive:"9-13",elite:14,maximum:15,reward:15})
});
