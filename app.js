const streams={
  dj:{name:"DJ Perry Radio",url:"https://audio.cloudrad.io/ef8751af/live"},
  strobe:{name:"The Strobe Radio",url:"https://audio.cloudrad.io/ac7b42b9/live"},
  pulse:{name:"Pulse 107",url:"https://audio.cloudrad.io/c80559c5/live"}
};

const audio=document.getElementById("audio");
const playerBar=document.getElementById("playerBar");
const currentStation=document.getElementById("currentStation");
const playerStatus=document.getElementById("playerStatus");
const pauseButton=document.getElementById("pauseButton");
const buttons=[...document.querySelectorAll(".listen")];
let currentKey=null;

async function playStation(key){
  const station=streams[key];
  if(!station)return;

  if(currentKey===key && !audio.paused){
    audio.pause();
    playerStatus.textContent="Paused";
    pauseButton.textContent="▶";
    buttons.forEach(b=>b.classList.remove("playing"));
    return;
  }

  currentKey=key;
  audio.pause();
  audio.src=station.url;
  currentStation.textContent=station.name;
  playerStatus.textContent="Connecting…";
  playerBar.hidden=false;
  buttons.forEach(b=>b.classList.toggle("playing",b.dataset.station===key));

  try{
    await audio.play();
    playerStatus.textContent="Streaming live";
    pauseButton.textContent="❚❚";
    if("mediaSession" in navigator){
      navigator.mediaSession.metadata=new MediaMetadata({
        title:station.name,
        artist:"Live Stream",
        artwork:[
          {src:"icon-192.png",sizes:"192x192",type:"image/png"},
          {src:"icon-512.png",sizes:"512x512",type:"image/png"}
        ]
      });
    }
  }catch(err){
    console.error(err);
    playerStatus.textContent="Tap Listen Live again to retry";
    buttons.forEach(b=>b.classList.remove("playing"));
  }
}

buttons.forEach(b=>b.addEventListener("click",()=>playStation(b.dataset.station)));

pauseButton.addEventListener("click",async()=>{
  if(!currentKey)return;
  if(audio.paused){
    try{await audio.play();playerStatus.textContent="Streaming live";pauseButton.textContent="❚❚";
      buttons.forEach(b=>b.classList.toggle("playing",b.dataset.station===currentKey));
    }catch(e){playerStatus.textContent="Unable to resume";}
  }else{
    audio.pause();playerStatus.textContent="Paused";pauseButton.textContent="▶";
    buttons.forEach(b=>b.classList.remove("playing"));
  }
});

const drawer=document.getElementById("drawer"),scrim=document.getElementById("scrim");
function closeDrawer(){drawer.classList.remove("open");scrim.classList.remove("show");drawer.setAttribute("aria-hidden","true")}
document.getElementById("menuButton").onclick=()=>{drawer.classList.add("open");scrim.classList.add("show");drawer.setAttribute("aria-hidden","false")};
document.getElementById("closeMenu").onclick=closeDrawer;
scrim.onclick=closeDrawer;
document.querySelectorAll(".drawer a").forEach(a=>a.addEventListener("click",closeDrawer));

if("mediaSession" in navigator){
  navigator.mediaSession.setActionHandler("play",()=>currentKey&&playStation(currentKey));
  navigator.mediaSession.setActionHandler("pause",()=>{audio.pause();playerStatus.textContent="Paused";pauseButton.textContent="▶"});
}

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(console.error));
}
