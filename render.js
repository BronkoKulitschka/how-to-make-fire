const canvas=document.querySelector("canvas"),g=canvas.getContext("2d");
const scene=document.querySelector(".scene"),caption=document.querySelector(".caption");
const image=new Image();image.src="woods.jpg";
const buttons=document.querySelector(".actions"),dialog=document.querySelector("dialog");
let activeKeys="", muted=false,ctx,windGain,filter,crackleGain,waver=0,lookX=0,lookY=0,camX=0,camY=0;
function audioStart(){
 if(muted||ctx)return;
 try{
 ctx=new AudioContext();const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);
 let last=0;for(let i=0;i<data.length;i++){last=(last+.12*(Math.random()*2-1))/1.07;data[i]=last*4}
 const src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;filter=ctx.createBiquadFilter();filter.type="lowpass";windGain=ctx.createGain();windGain.gain.value=0;src.connect(filter).connect(windGain).connect(ctx.destination);src.start();
 const pops=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),samples=pops.getChannelData(0);
 for(let i=0;i<samples.length;i++){samples[i]=(Math.random()<.004?Math.random()*.4:0)+(Math.random()-.5)*.012}
 const crackle=ctx.createBufferSource();crackle.buffer=pops;crackle.loop=true;crackleGain=ctx.createGain();crackleGain.gain.value=0;crackle.connect(crackleGain).connect(ctx.destination);crackle.start();
 }catch(e){ctx=null}
}
function sound(){if(!ctx)return;let t=ctx.currentTime, audible=!muted&&!document.hidden&&s.playing&&!dialog.open;
 windGain.gain.setTargetAtTime(audible?(weather()==="wind"?.24:weather()==="rain"?.15:.035):0,t,.17);
 filter.frequency.setTargetAtTime(weather()==="wind"?850+220*Math.sin(s.time):weather()==="rain"?2400:400,t,.3);
 crackleGain.gain.setTargetAtTime(audible&&s.done?.6:0,t,.15);
}
function run(id){audioStart();if(ctx?.state==="suspended")ctx.resume().catch(()=>{});act(id);update()}
function update(){
 let options=available(),keys=options.map(x=>x[0]).join(",");
 if(keys!==activeKeys){activeKeys=keys;buttons.replaceChildren(...options.map(([id,name],i)=>{let b=document.createElement("button"),k=document.createElement("b");k.textContent=i+1;b.append(k,document.createTextNode(name));b.onclick=()=>run(id);return b}))}
 document.querySelector(".intro").classList.toggle("small",s.playing);
 document.querySelector("#stock").textContent=s.playing?(s.done?"Das Holz brennt":s.matches+" / 3 Streichhölzer"):"Abenddämmerung";
 document.querySelector("#goal").textContent=s.done?"Es brennt.":s.playing?"Entzünde ein Feuer.":"Die Feuerstelle";
 let line=s.note;
 if(s.playing&&!s.done&&s.time-s.lastAction>7){
 line=s.visitor===2?"Eine Zigarette wartet.":s.matches===0&&!s.lighter?"Die Schachtel ist leer. In der Jacke klickt etwas.":weather()==="wind"?"Die Blätter rauschen.":weather()==="rain"?"Tropfen auf dem Laub.":"Die Äste stehen still.";
 }
 if(caption.textContent!==line)caption.textContent=line;
}
document.querySelector("#mute").onclick=()=>{muted=!muted;document.querySelector("#mute").textContent=muted?"Ton · aus":"Ton · an";if(!muted)audioStart();sound()};
document.querySelector("#again").onclick=()=>dialog.showModal();
document.querySelector("#reset").onclick=()=>{s=fresh();dialog.close();update()};
document.querySelector("#cancel").onclick=()=>dialog.close();
document.addEventListener("keydown",e=>{if(!dialog.open&&!e.repeat&&/^[1-9]$/.test(e.key)){let opt=available()[Number(e.key)-1];if(opt)run(opt[0])}});
scene.onpointermove=e=>{const r=scene.getBoundingClientRect();lookX=((e.clientX-r.left)/r.width-.5)*6;lookY=((e.clientY-r.top)/r.height-.5)*4};
scene.onpointerleave=()=>{lookX=0;lookY=0};
function poly(pts,col){g.fillStyle=col;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()}
function oval(x,y,rx,ry,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()}
function line(x,y,x2,y2,w,col){g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke()}
function flame(x,y,h,t,still){
 const dx=still?0:Math.sin(t*10)*h*.11;
 for(let k=0;k<3;k++){let size=h*(1-k*.23);g.fillStyle=["#e67d39","#ffbd56","#fff0af"][k];g.beginPath();g.moveTo(x,y-size);g.bezierCurveTo(x+dx+size*.13,y-size*.55,x+size*.44,y-size*.13,x,y);g.bezierCurveTo(x-size*.28,y,x-size*.22,y-size*.37,x+dx,y-size);g.fill()}
}
function shadow(alien){
 g.save();g.translate(935,575);g.transform(-1,.27,.33,1,0,0);g.fillStyle="#0c1719";
 g.beginPath();g.ellipse(-55,25,52,72,-.2,0,Math.PI*2);g.fill();poly([[-150,145],[-109,60],[-50,64],[30,112],[99,73],[109,83],[44,146],[-12,158],[-49,230]],"#0c1719");
 for(let i=0;i<(alien?6:4);i++){g.lineCap="round";line(100,90+i*.8,127+i*5,65+i*4,alien?4:6,"#0c1719")}
 g.restore();if(alien){line(841,672,811,669,5,"#c3b99f");line(812,669,809,669,4,"#8c785b")}
}
function draw(ts){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=rect.width,h=rect.height;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 if(!w||!h)return;
 const z=Math.max(w/1400,h/840)*1.025;camX+=(lookX-camX)*.06;camY+=(lookY-camY)*.06;
 const ox=(w-1400*z)/2+camX,oy=(h-840*z)*.67+camY;
 g.setTransform(dpr*z,0,0,dpr*z,ox*dpr,oy*dpr);if(image.complete&&image.naturalWidth)g.drawImage(image,0,0);
 const t=s.playing?s.time:ts;const night=Math.min(.36,s.time/145);
 g.fillStyle='rgba(14,25,43,'+night+')';g.fillRect(0,0,1400,840);
 if(s.playing){
 if(s.visitor===1||s.visitor===2||s.time<s.steadyUntil)shadow(s.visitor!==1);
 if(s.bottle){
 g.fillStyle="#626f67";g.beginPath();g.roundRect(848,560,47,84,12);g.fill();g.strokeStyle="#8e9a88";g.lineWidth=4;g.strokeRect(860,551,23,10);g.fillStyle="#a69c7c";g.fillRect(849,585,45,19);line(853,594,889,594,1.3,"#555a4c");
 }
 if(!s.paper){let p=s.time%10/10;let x=p<.3?390+p*960:p<.8?680+(p-.3)*125:742+(p-.8)*1400;let y=599+Math.sin(p*10)*11;poly([[x,y],[x+23,y-8],[x+39,y-3],[x+10,y+4]],"#ded6ac")}
 else {poly([[671,639],[718,629],[737,635],[693,648]],"#d9c69a");if(s.pinned)oval(702,636,12,5,"#747d6a")}
 for(let i=0;i<3-s.matches;i++){line(733+i*13,674+i*2,748+i*13,681+i*2,2,"#b59e77");oval(748+i*13,681+i*2,2,2,"#252e26")}
 // Matchbox on the ground, its contents physically visible.
 poly([[550,668],[604,661],[622,674],[565,683]],"#bc8155");poly([[565,683],[622,674],[622,681],[564,690]],"#725b47");
 poly([[541,675],[570,670],[582,678],[554,684]],"#d4bb91");
 for(let i=0;i<s.matches;i++){line(548+i*6,676-i,557+i*6,680-i,2,"#876e4c");oval(557+i*6,680-i,2.4,1.8,"#994e3a")}
 // A low branch gives the same wind cue before every strike.
 g.save();g.translate(410,394);g.rotate(weather()==="wind"?.07*Math.sin(t*4):.008*Math.sin(t));
 line(-85,-33,95,5,3,"#253b34");
 for(let i=0;i<17;i++){let x=-67+i*9, y=-27+i*1.7;let dir=i%2?1:-1;
 line(x,y,x+8,y+dir*9,1,"#344c3f");poly([[x+6,y+dir*8],[x+12,y+dir*15],[x+21,y+dir*13],[x+15,y+dir*8]],"#64745a")}
 g.restore();
 if(weather()==="wind"){
 for(let i=0;i<16;i++){let x=((t*(110+i*5)+i*116)%1460)-35,y=280+(i*47)%330+Math.sin(t*1.8+i)*18;poly([[x,y],[x+9,y-4],[x+15,y-3],[x+5,y+1]],i%2?"#aaa477":"#859576")}
 }else if(weather()==="rain"){
 for(let i=0;i<68;i++){let y=(t*245+i*109)%840,x=(i*139+y*.2)%1400;line(x,y,x+2,y+11,1,"#99afac")}
 }
 if(s.time<s.steadyUntil||s.time<s.flameUntil){
 let special=s.time<s.steadyUntil,fx=special?811:704,fy=special?667:619;
 poly([[fx+107,fy+143],[fx+55,fy+82],[fx+27,fy+46],[fx+18,fy+52],[fx+31,fy+80],[fx+16,fy+67],[fx+5,fy+55],[fx-3,fy+60],[fx+12,fy+89],[fx+39,fy+115],[fx+54,fy+151]],"#967f69");
 line(fx,fy,fx+18,fy+62,3,"#dbbd87");flame(fx,fy,29,t,special);
 if(special)oval(812,669,3,2,"#f89e4c");
 }
 if(s.done){
 let fireTime=ts;const glow=g.createRadialGradient(699,624,7,699,624,150);glow.addColorStop(0,"#ffad473f");glow.addColorStop(1,"#ffad4700");g.fillStyle=glow;g.fillRect(540,464,320,320);
 for(let i=0;i<13;i++)flame(650+i*8,636-Math.sin(i)*4,38+Math.sin(i*1.7+fireTime*4)*18+23*Math.sin(i/4),fireTime+i,false);
 for(let i=0;i<12;i++){let f=(fireTime*.34+i*.13)%1;oval(700+Math.sin(i*2+f*6)*26,609-f*95,1.3,2,"#edaf6b")}
 }
 }
}
let prev=performance.now();
function frame(ms){let dt=Math.max(0,Math.min(.12,(ms-prev)/1000));prev=ms;if(!dialog.open&&!document.hidden){tick(dt);waver+=dt;draw(waver);update()}sound();requestAnimationFrame(frame)}
document.addEventListener("visibilitychange",sound);update();requestAnimationFrame(frame);
