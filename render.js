const canvas=document.querySelector('canvas'),caption=document.querySelector('#thought');
let draw=makeRenderer(canvas);
const fixed=buildWorld(),curls=buildShavings();
fixed.data=fixed.data.concat(curls.data);
fixed.hits=fixed.hits.concat(curls.hits);
const look=[0,0],targetLook=[0,0],rest=[.38,.455,1.41];
let cam,moving,drag=null,previous=0,clock=0,lastFrame=0;

function point(e){const b=canvas.getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top]}
function hitAt(x,y,omitHand=false){
 const objects=omitHand?{hits:moving.hits.filter(f=>f.id!=='heldMatch')}:moving;
 const direct=(dx,dy)=>intersect(x+dx,y+dy,cam,[objects,fixed]);
 const hit=direct(0,0);if(hit)return hit;
 const pad=matchMedia('(pointer: coarse)').matches?8:3;
 for(const [dx,dy] of [[pad,0],[-pad,0],[0,pad],[0,-pad]]){
   const nearby=direct(dx,dy);if(nearby)return nearby;
 }
 return null;
}
function handAt(x,y,depth){
 const ray=add(cam.f,add(mul(cam.r,(2*x/cam.w-1)/cam.fx),mul(cam.u,(1-2*y/cam.h)/cam.fy)));
 return add(cam.eye,mul(ray,Math.max(.1,depth-.025)));
}
function reachAt(x,y){
 const hit=hitAt(x,y,true);
 if(hit)return handAt(x,y,dot(sub(hit.point,cam.eye),cam.f));
 // Between the curls the ray can pass through a gap. Keep the hand at wood height.
 if(game.remaining){
   const ray=handAt(x,y,1.025);
   const dy=ray[1]-cam.eye[1];
   if(dy<-.18)return handAt(x,y,Math.min(4.2,(.14-cam.eye[1])/dy)+.025);
 }
 return handAt(x,y,drag.depth);
}
function updateScene(dt=0){
 const w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(1.55,devicePixelRatio||1);
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){
   canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
 }
 cam=camera(w,h,look);
 const reaching=drag&&moving&&(drag.id||game.held);
 let grip=reaching?reachAt(drag.lastX,drag.lastY):(game.held?rest:null);
 const flameInWood=Boolean(reaching&&game.remaining&&touchesShavings(add(matchTip(grip),[0,.048,0])));
 advance(dt,flameInWood);
 if(!reaching&&!game.held)grip=null;
 moving=dynamicWorld(clock,grip);
 const light={cold:game.heat*.021,shavings:.17,twigs:.42,logs:.79}[game.stage];
 draw(cam,fixed,moving,.22,light*(1+.10*Math.sin(clock*13)));
 if(caption.textContent!==game.note)caption.textContent=game.note;
 caption.style.opacity=game.note?'1':'0';
}
function wake(){game.awake=true;enableAudio();if(audio?.state==='suspended')audio.resume().catch(()=>{})}
function strokeAlongStripe(x,y){
 const tip=matchTip(reachAt(x,y)),[bx,by,bz]=boxPos;
 const onStripe=Math.abs(tip[0]-bx)<=.25&&Math.abs(tip[1]-by)<.064&&Math.abs(tip[2]-(bz+.17))<.048;
 if(!onStripe){drag.strokeStart=null;return}
 if(drag.strokeStart===null)drag.strokeStart=tip[0];
 if(Math.abs(tip[0]-drag.strokeStart)>=.083)strikeMatch();
}
canvas.addEventListener('pointerdown',e=>{
 if(drag||e.button>0)return;
 if(!cam)updateScene();
 wake();const [x,y]=point(e),hit=hitAt(x,y);
 drag={pointer:e.pointerId,x,y,lastX:x,lastY:y,id:hit?.id,depth:hit?dot(sub(hit.point,cam.eye),cam.f):2,
   moved:false,strokeStart:null};
 canvas.setPointerCapture(e.pointerId);
 if(drag.id==='match'&&!game.held)openOrTake();
 if(game.held&&!game.remaining)strokeAlongStripe(x,y);
 updateScene();
});
canvas.addEventListener('pointermove',e=>{
 if(!cam)return;
 const [x,y]=point(e);
 if(!drag){
   if(e.pointerType==='mouse'){
     targetLook[0]=(x/cam.w-.5)*1.3;targetLook[1]=(.5-y/cam.h)*.8;
     canvas.style.cursor=hitAt(x,y)?'grab':'default';
   }return;
 }
 if(e.pointerId!==drag.pointer)return;
 const dx=x-drag.lastX,dy=y-drag.lastY;
 if(Math.hypot(x-drag.x,y-drag.y)>5)drag.moved=true;
 if(drag.moved){
   if(!drag.id&&!game.held){
     targetLook[0]=Math.max(-1,Math.min(1,targetLook[0]-dx/cam.w*2.8));
     targetLook[1]=Math.max(-1,Math.min(1,targetLook[1]+dy/cam.h*2));
   }else if(!game.box&&(drag.id==='box'||drag.id==='stripe'))openOrTake();
   if(game.held&&!game.remaining){
     const steps=Math.min(60,Math.max(1,Math.ceil(Math.hypot(dx,dy)/4)));
     for(let i=1;i<=steps&&!game.remaining;i++)strokeAlongStripe(drag.lastX+dx*i/steps,drag.lastY+dy*i/steps);
   }
 }
 drag.lastX=x;drag.lastY=y;
});
function finish(e){
 if(!drag||drag.pointer!==e.pointerId)return;
 if(e.type==='pointerup'&&!drag.moved&&(drag.id==='box'||drag.id==='stripe'))openOrTake();
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
 if(!audio)return;
 const stamp=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();
 const pitch={box:160,strike:640,out:190}[sound]||120;
 o.type='triangle';o.frequency.setValueAtTime(pitch,stamp);o.frequency.exponentialRampToValueAtTime(pitch*.43,stamp+.14);
 g.gain.setValueAtTime(.0001,stamp);g.gain.exponentialRampToValueAtTime(.055,stamp+.012);g.gain.exponentialRampToValueAtTime(.0001,stamp+.24);o.connect(g).connect(audio.destination);o.start();o.stop(stamp+.25);
}
function ambient(){
 if(!audio||!windGain)return;
 const t=audio.currentTime,silent=document.hidden;
 windGain.gain.setTargetAtTime(silent?0:.035,t,.24);
 windFilter.frequency.setTargetAtTime(580,t,.24);
 const crackle={cold:0,shavings:.06,twigs:.22,logs:.44}[game.stage];
 fireGain.gain.setTargetAtTime(silent?0:crackle,t,.24);
}
document.addEventListener('visibilitychange',()=>{previous=0;ambient()});
function frame(ms){
 requestAnimationFrame(frame);
 if(document.hidden||ms-lastFrame<1000/40)return;
 const dt=previous?Math.min(.15,(ms-previous)/1000):0;previous=ms;lastFrame=ms;clock+=dt;
 look.forEach((n,i)=>{look[i]=Math.abs(targetLook[i]-n)<.001?targetLook[i]:n+(targetLook[i]-n)*.12});
 updateScene(dt);cue();ambient();
}
requestAnimationFrame(frame);
