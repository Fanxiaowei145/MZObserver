// Display clocks only: no wave prediction, automatic spawning or game-rule scheduler.
const HALF_DURATION_MS=25*60*1000;
let matchClock={halfElapsedMs:0,waveElapsedMs:0,paused:false,receivedAt:performance.now()};
function readMatchClock(){
 const delta=matchClock.paused?0:Math.min(Math.max(0,performance.now()-matchClock.receivedAt),Math.max(0,HALF_DURATION_MS-matchClock.halfElapsedMs));
 return {halfElapsedMs:Math.min(HALF_DURATION_MS,matchClock.halfElapsedMs+delta),waveElapsedMs:matchClock.waveElapsedMs+delta,paused:matchClock.paused};
}
function setMatchClock({halfElapsedMs,waveElapsedMs,paused=false}){
 if(!Number.isFinite(halfElapsedMs)||halfElapsedMs<0||!Number.isFinite(waveElapsedMs)||waveElapsedMs<0)throw Error('Invalid elapsed time');
 matchClock={halfElapsedMs:Math.min(HALF_DURATION_MS,halfElapsedMs),waveElapsedMs,paused:Boolean(paused),receivedAt:performance.now()};drawMatchClock();
}
function formatClock(ms,up=false){const t=(up?Math.floor:Math.ceil)(Math.max(0,ms)/1000);return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function drawMatchClock(){
 const c=readMatchClock();document.getElementById('wave-time').textContent=formatClock(c.waveElapsedMs,true);
 document.getElementById('half-time').textContent=formatClock(HALF_DURATION_MS-c.halfElapsedMs);
 document.querySelector('.wave-caption').textContent=c.paused?'本波已过 · 暂停':'本波已过';
}
MZUI.setMatchClock=setMatchClock;
MZUI.getMatchClock=readMatchClock;
MZUI.setMatchPaused=paused=>setMatchClock({...readMatchClock(),paused});
MZUI.resetWaveElapsed=()=>setMatchClock({...readMatchClock(),waveElapsedMs:0});
// Scene times are illustrative, not an inferred refresh schedule.
const baseSetScene=window.setScene;
window.setScene=function(n){const result=baseSetScene(n);setMatchClock({halfElapsedMs:({1:258000,2:269000,3:292000,4:300000,6:258000})[n]??0,waveElapsedMs:({1:78000,2:89000,3:112000,4:0,6:78000})[n]??0});return result;};
setMatchClock({halfElapsedMs:258000,waveElapsedMs:78000});
setInterval(drawMatchClock,100);
