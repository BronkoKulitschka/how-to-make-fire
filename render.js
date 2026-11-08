const canvas=document.querySelector('canvas'),caption=document.querySelector('#thought');
let draw=makeRenderer(canvas);
const fixed=buildWorld(),look=[0,0],targetLook=[0,0];
let cam, moving,drag=null,previous=0,clock=0,lastFrame=0;
const rest=[.38,.455,1.41];
function updateScene(){
 const w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(1.55,devicePixelRatio||1);
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
 cam=camera(w,h,look);
 // Reproject from the active pointer using the camera that draws this frame.
 if(drag?.moved&&drag.id&&moving){
   const surface=hitAt(drag.lastX,drag.lastY,true);
   if(surface)drag.depth=dot(sub(surface.point,cam.eye),cam.f);
 }
 const reach=drag?.id?handAt(drag.lastX,drag.lastY,drag.depth):null;
 const holdsPaper=drag?.id==='paper'&&game.paper==='held';
 let grip=reach&&!holdsPaper?reach:(game.hand?rest:null);
 if(game.still)grip=sub([.38,.70,-.12],matchHeadOffset);
 moving=dynamicWorld(clock,grip,holdsPaper?reach:paperRest);
 const night=Math.min(.98,game.t/110),light=game.done?.78+.12*Math.sin(clock*15):0;
 draw(cam,fixed,moving,night,light);
 canvas.parentElement.style.setProperty('--dusk',String(Math.round(night*(game.done?.15:.34)*64)/64));
 const text=game.noteUntil>game.t?game.note:'';
 if(caption.textContent!==text)caption.textContent=text;
 caption.style.opacity=text?'1':'0';
}
function point(e){const b=canvas.getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top]}
function hitAt(x,y,omitHand=false){
 const skip=omitHand?new Set(['heldMatch','lighter',...(game.paper==='held'?['paper']:[])]):null;
 const active=skip?{hits:moving.hits.filter(f=>!skip.has(f.id))}:moving;
 const direct=(dx,dy)=>intersect(x+dx,y+dy,cam,[active,fixed]);
 const hit=direct(0,0);if(hit)return hit;
 const pad=matchMedia('(pointer: coarse)').matches?9:4;
 for(const [dx,dy] of [[pad,0],[-pad,0],[0,pad],[0,-pad]]){const h=direct(dx,dy);if(h)return h}
 return null;
}
function aim(x,y,omitHand=false){return hitAt(x,y,omitHand)?.id||null}
function handAt(x,y,depth){
 const dir=add(cam.f,add(mul(cam.r,(2*x/cam.w-1)/cam.fx),mul(cam.u,(1-2*y/cam.h)/cam.fy)));
 return add(cam.eye,mul(dir,Math.max(.1,depth-.025)));
}
function wake(){game.awake=true;enableAudio();if(audio?.state==='suspended')audio.resume().catch(()=>{})}
function perform(id){if(!id)return;touch(id);cue();updateScene()}
canvas.addEventListener('pointerdown',e=>{
 if(drag)return;
 if(!cam)updateScene();
 wake();const [x,y]=point(e),hit=hitAt(x,y);
 const id=hit?.id||null,depth=hit?dot(sub(hit.point,cam.eye),cam.f):1.82;
 drag={pointer:e.pointerId,x,y,lastX:x,lastY:y,id,depth,moved:false,taken:false,struck:false};
 canvas.setPointerCapture(e.pointerId);updateScene();
});
canvas.addEventListener('pointermove',e=>{
 if(!cam)return;
 const [x,y]=point(e);
 if(!drag){
   if(e.pointerType==='mouse'){
     targetLook[0]=(x/cam.w-.5)*1.3;targetLook[1]=(.5-y/cam.h)*.8;
     canvas.style.cursor=aim(x,y)?'grab':'default';
   }return;
 }
 if(e.pointerId!==drag.pointer)return;
 const dx=x-drag.lastX,dy=y-drag.lastY;
 if(Math.hypot(x-drag.x,y-drag.y)>5)drag.moved=true;
 if(drag.moved){
   if(!drag.id){
     targetLook[0]=Math.max(-1,Math.min(1,targetLook[0]-dx/cam.w*2.8));
     targetLook[1]=Math.max(-1,Math.min(1,targetLook[1]+dy/cam.h*2));
   }else{
     if(!drag.taken){
       if(drag.id==='box'&&!game.box)perform('box');
       if(drag.id==='match'&&game.hand!=='match')perform('match');
       if(drag.id==='paper'&&game.paper==='wind')perform('paper');
       if(drag.id==='pocket')perform('pocket');
       drag.taken=true;
     }
     const dist=Math.hypot(x-drag.x,y-drag.y);
     if(!game.lit&&!drag.struck&&game.hand==='match'&&dist>=11){
       const steps=Math.min(48,Math.max(1,Math.ceil(Math.hypot(dx,dy)/5)));
       for(let i=0;i<=steps;i++){
         if(aim(drag.lastX+dx*i/steps,drag.lastY+dy*i/steps,true)==='stripe'||drag.id==='stripe'){
           perform('stripe');drag.struck=true;break;
         }
       }
     }
   }
 }
 drag.lastX=x;drag.lastY=y;
});
function finish(e){
 if(!drag||drag.pointer!==e.pointerId)return;
 const [x,y]=point(e),gesture=drag;
 if(e.type==='pointerup'){
   if(!gesture.moved){
     const id=gesture.id;
     if(id==='heldMatch'&&game.lit){const under=aim(x,y,true);if(under)perform(under)}
     else perform(id);
   }else if(gesture.id){
     const dest=aim(x,y,true);
     if(gesture.id==='stone'&&(dest==='wood'||dest==='paper'))perform('stone');
     else if(dest==='wood'||(dest==='paper'&&game.paper==='placed'))perform('wood');
     else if(dest==='cig'||dest==='knee'||dest==='stone')perform(dest);
     else if(gesture.id==='lighter'&&!gesture.struck)perform('lighter');
   }
 }
 drag=null;updateScene();
}
canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
canvas.addEventListener('lostpointercapture',()=>{drag=null});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('webglcontextlost',e=>e.preventDefault());
canvas.addEventListener('webglcontextrestored',()=>{draw=makeRenderer(canvas)});
let audio,windGain,windFilter,fireGain;
function enableAudio(){
 if(audio)return;
 try{
   audio=new AudioContext();const noise=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=noise.getChannelData(0);
   let v=0;for(let i=0;i<data.length;i++){v=(v+.16*(Math.random()-.5))/1.065;data[i]=v*3}
   const src=audio.createBufferSource();src.buffer=noise;src.loop=true;
   windFilter=audio.createBiquadFilter();windFilter.type='lowpass';windGain=audio.createGain();windGain.gain.value=0;src.connect(windFilter).connect(windGain).connect(audio.destination);src.start();
   const crack=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),s=crack.getChannelData(0);
   for(let i=0;i<s.length;i++)s[i]=Math.random()<.006?(Math.random()-.4)*.55:(Math.random()-.5)*.01;
   const p=audio.createBufferSource();p.buffer=crack;p.loop=true;fireGain=audio.createGain();fireGain.gain.value=0;p.connect(fireGain).connect(audio.destination);p.start();
 }catch{audio=null}
}
function cue(){
 if(!game.sound)return;
 const sound=game.sound;game.sound='';
 if(!audio||sound==='fire')return;
 if(sound==='cough'){
   const at=audio.currentTime,buf=audio.createBuffer(1,Math.ceil(audio.sampleRate*.36),audio.sampleRate);
   const samples=buf.getChannelData(0);
   for(let i=0;i<samples.length;i++){const t=i/audio.sampleRate,burst=t<.16?t:t-.21;samples[i]=burst<0?0:(Math.random()-.5)*Math.exp(-burst*28)}
   const src=audio.createBufferSource(),band=audio.createBiquadFilter(),gain=audio.createGain();
   src.buffer=buf;band.type='bandpass';band.frequency.value=690;gain.gain.value=.47;src.connect(band).connect(gain).connect(audio.destination);src.start(at);return;
 }
 const stamp=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();
 const pitch={metal:440,box:160,strike:640,stone:90,out:190,step:68,cloth:125}[sound]||120;
 o.type=sound==='metal'?'sine':'triangle';o.frequency.setValueAtTime(pitch,stamp);o.frequency.exponentialRampToValueAtTime(pitch*.43,stamp+.14);
 g.gain.setValueAtTime(.0001,stamp);g.gain.exponentialRampToValueAtTime(.055,stamp+.012);g.gain.exponentialRampToValueAtTime(.0001,stamp+.24);o.connect(g).connect(audio.destination);o.start();o.stop(stamp+.25);
}
function ambient(){
 if(!audio||!windGain)return;
 const t=audio.currentTime,w=weather(),silent=document.hidden;
 windGain.gain.setTargetAtTime(silent?0:w==='wind'?.31:w==='rain'?.19:.055,t,.24);
 windFilter.frequency.setTargetAtTime(w==='wind'?1050+200*Math.sin(clock):w==='rain'?2600:580,t,.24);
 fireGain.gain.setTargetAtTime(game.done&&!silent?.45:0,t,.24);
}
document.addEventListener('visibilitychange',()=>{previous=0;ambient()});
function frame(ms){
 requestAnimationFrame(frame);
 if(document.hidden||ms-lastFrame<1000/40)return;
 const dt=previous?Math.min(.15,(ms-previous)/1000):0;previous=ms;lastFrame=ms;clock+=dt;
 look.forEach((n,i)=>{look[i]=Math.abs(targetLook[i]-n)<.001?targetLook[i]:n+(targetLook[i]-n)*.12});
 advance(dt);cue();updateScene();ambient();
}
requestAnimationFrame(frame);
