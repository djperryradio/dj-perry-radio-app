const STREAM_URL="https://audio.cloudrad.io/ef8751af/live";
const audio=document.getElementById("radioAudio"),playButton=document.getElementById("playButton"),drawerListen=document.getElementById("drawerListen"),statusText=document.getElementById("statusText"),drawer=document.getElementById("drawer"),scrim=document.getElementById("scrim");
let initialized=false;
async function toggleStream(){if(!initialized){audio.src=STREAM_URL;initialized=true}if(audio.paused){statusText.textContent="Connecting…";try{await audio.play();playButton.textContent="❚❚ PAUSE";statusText.textContent="Streaming live";if("mediaSession"in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:"DJ Perry Radio",artist:"Live Stream",artwork:[{src:"icon-192.png",sizes:"192x192",type:"image/png"},{src:"icon-512.png",sizes:"512x512",type:"image/png"}]})}}catch(e){statusText.textContent="Unable to start the stream. Tap again to retry."}}else{audio.pause();playButton.textContent="▶ LISTEN LIVE";statusText.textContent="Paused"}}
function closeDrawer(){drawer.classList.remove("open");scrim.classList.remove("show")}
document.getElementById("menuButton").onclick=()=>{drawer.classList.add("open");scrim.classList.add("show")};
document.getElementById("closeMenu").onclick=closeDrawer;scrim.onclick=closeDrawer;
playButton.onclick=toggleStream;drawerListen.onclick=()=>{toggleStream();closeDrawer()};
document.querySelectorAll(".drawer a").forEach(a=>a.onclick=closeDrawer);
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));