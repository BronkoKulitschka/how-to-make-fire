function rng(seed){return()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296)}
const between=(r,a,b)=>a+(b-a)*r();
const colors=(r,list)=>list[Math.floor(r()*list.length)];
function log(m,a,b,r,seed){
 const rand=rng(seed),axis=unit(sub(b,a)),u=unit(cross(axis,[0,1,0])),v=cross(axis,u),tip=add(b,mul(axis,.002));
 m.rod(a,b,r*.90,r,'#69503a',11,'#cd9760');
 for(const [k,c] of [[.82,'#ad794b'],[.72,'#cf9a69'],[.53,'#b48654'],[.40,'#cfa16d'],[.18,'#845834']]){
   m.rod(tip,add(tip,mul(axis,(1-k)*.015)),r*k,r*k,c,11,c);
 }
 for(let i=0;i<21;i++){
   const angle=rand()*Math.PI*2,off=add(mul(u,Math.cos(angle)),mul(v,Math.sin(angle))),s=rand()*.5,e=Math.min(.99,s+.16+rand()*.5);
   const p=t=>add(add(a,mul(sub(b,a),t)),mul(off,r*(.94+.075*t)));
   m.rod(p(s),p(e),.011,.007,colors(rand,['#473b2c','#90714e','#584532','#9c7750']),3);
 }
}
function fir(m,x,z,h,w,seed,far){
 const r=rng(seed),trunk=far?'#5e6453':'#61533e';m.rod([x,0,z],[x+.06,h,z],w*.09,w*.014,trunk,6);
 const levels=far?4:6,sides=far?7:11;
 for(let j=0;j<levels;j++){
   let base=h*(.14+j*.12),radius=w*(1-j/(levels+.45));
   const crown=[x+.05,Math.min(h,base+h*(far?.48:.38)),z-.04],rim=[];
   for(let i=0;i<sides;i++){const a=(i+j*.23)*Math.PI*2/sides,rad=radius*(.78+r()*.35);
     rim.push([x+Math.cos(a)*rad,base+(i%2?h*.05:0)+r()*h*.025,z+Math.sin(a)*rad])}
   for(let i=0;i<sides;i++){const j=(i+1)%sides;
     m.tri(rim[j],rim[i],crown,far?colors(r,['#566e62','#6c8070','#718474']):colors(r,['#324b3e','#415941','#485f48','#526348','#394d3c']));
     if(!far)m.tri(rim[i],rim[j],[x,base+h*.055,z],'#2d4235');
   }
 }
}
function buildWorld(){
 const m=new Mesh(),r=rng(4429);
 const terrainY=(x,z)=>Math.min(.52,Math.max(0,Math.hypot(x,z)-2)*.033)*(1+.55*Math.sin(x*.71+z*.3))-.035;
 function shade(x,z,rx,rz,offset,color){
   const v=(x,z)=>[x,terrainY(x,z)+.014,z];
   for(let n=0;n<13;n++){const a=n*Math.PI*2/13,b=(n+1)*Math.PI*2/13;
     m.tri(v(x,z),v(x+rx*Math.cos(a)+offset*Math.sin(a),z+rz*Math.sin(a)),v(x+rx*Math.cos(b)+offset*Math.sin(b),z+rz*Math.sin(b)),color,true)}
 }

 // Alpine ridges silhouetted against the evening sky.
 for(let j=0;j<3;j++){
   let z=-48+j*9,prev;
   for(let i=-18;i<=18;i++){
     let x=i*3,peak=3.6+.9*Math.cos(i*.57+j)+1.3*Math.sin(i*.79+j*3)+r()*1.4;
     let p=[x,peak+j*.05,z];if(prev){m.quad(prev,p,[x,-1,z],[x-3,-1,z],['#94a29a','#83978a','#708475'][j],true)}
     prev=p;
   }
 }
 // A clearing of ochre grass. Individual triangles catch the low light.
 for(let j=-26;j<5;j++)for(let i=-19;i<19;i++){
   const size=1.46,x=i*size,z=j*size;
   const p=(x,z)=>[x,terrainY(x,z),z];
   const shade= Math.sin(x*.47+z*.83)+Math.sin(x*1.3-z*.23);
   const light=5*shade+6*Math.sin(x*.27+z*.4);
   const c='#'+[137,126,82].map(v=>Math.round(v+light).toString(16).padStart(2,'0')).join('');
   m.quad(p(x,z),p(x,z+size),p(x+size,z+size),p(x+size,z),c);
 }
 for(let i=0;i<125;i++){
   const x=between(r,-24,24),z=between(r,-30,-3);
   if(z>-12&&Math.abs(x)<2.9)continue;
   const h=between(r,3.2,8),w=between(r,.65,1.65);
   shade(x+.34,z+.83,w*.84,w*1.34,.46,'#676a4c');
   fir(m,x,z,h,w,i+47,z<-12);
 }
 // A few nearby trunks frame the opening instead of obstructing the player's view.
 fir(m,-3.5,-3.6,7.4,1.70,648,false);fir(m,4.2,-5.2,8.8,1.65,733,false);
 for(let i=0;i<1250;i++){
   const x=between(r,-8,8),z=between(r,-8,2.5);
   if(Math.hypot(x,z)<1.12)continue;
   let y=Math.min(.5,Math.max(0,Math.hypot(x,z)-2)*.033)*(1+.55*Math.sin(x*.71+z*.3))-.01;
   for(let k=0;k<3;k++){const dx=r()*.14,dz=r()*.09,h=between(r,.09,.34);
     m.tri([x+dx-.014,y,z+dz],[x+dx+.018,y,z+dz],[x+dx+.048,y+h,z+dz-.03],colors(r,['#777b4c','#b7a76b','#8a8d54','#c0ad73']))}
 }
 for(let i=0;i<115;i++){
   const x=between(r,-4.4,4.4),z=between(r,-4,2);
   if(Math.hypot(x,z)<1.07)continue;
   let y=Math.max(0,Math.hypot(x,z)-2)*.04;
   m.tri([x-.044,y+.011,z],[x+.046,y+.012,z+.017],[x+.006,y+.014,z+.048],colors(r,['#ad8654','#b69a62','#736d48']));
 }
 // Fallen needles, ochre leaves and pebbles break up the bare earth.
 for(let i=0;i<1600;i++){
   const x=between(r,-4,4),z=between(r,-5,2.4);
   const h=Math.min(.52,Math.max(0,Math.hypot(x,z)-2)*.033)*(1+.55*Math.sin(x*.71+z*.3))-.023;
   const size=between(r,.014,.067);
   m.tri([x-size,h,z],[x+size*.65,h+.008,z+.012],[x+size,h,z+size*.42],colors(r,['#755d40','#ac905d','#c3a06a','#8c7850','#aea171']));
 }
 for(const [x,z] of [[-1.67,-.56],[1.71,-.47],[-1.89,-1.76],[1.52,-2.93],[-2.3,.72]]){
   for(let j=0;j<7;j++){
     const angle=j*.9,ex=Math.cos(angle)*.39,ez=Math.sin(angle)*.39;
     for(let k=0;k<8;k++){
       const f=k/9,ax=x+ex*f,az=z+ez*f,ay=.04+.46*Math.sin(f*1.85),width=(1-f)*.095;
       for(const dir of [-1,1])m.tri([ax,ay,az],[ax+ez*dir*width,ay+.037,az-ex*dir*width],[ax+ex*.14+ez*dir*width,ay+.065,az+ez*.14-ex*dir*width],dir===1?'#83905c':'#647d51');
     }
   }
 }
 shade(-.66,.98,.36,.24,.05,'#685c43');
 shade(.04,.04,.90,.53,.09,'#63593f');
 // Two logs frame an open pocket. Both the shavings and the air gaps remain visible.
 m.object('logs',()=>{
   log(m,[-.48,.10,-.43],[-.42,.13,.24],.125,5);
   log(m,[.45,.10,-.45],[.44,.12,.21],.115,17);
 });
 m.object('twigs',()=>{
   for(let i=0;i<10;i++){
     const x=(i%2===0?-1:1)*between(r,.17,.35);
     m.rod([x,.025,between(r,-.08,.31)],[x*.12,.21+r()*.07,-.14+r()*.11],.022,.012,
       colors(r,['#a77f51','#997246','#c09563']),6);
   }
 });
 return m;
}
const boxPos=[-.72,.08,.96];
const shavings=[0,.08,.26];
const tinderRadius=[.245,.115,.185];
function touchesShavings(p){
 return p.reduce((d,v,i)=>d+((v-shavings[i])/tinderRadius[i])**2,0)<=1;
}
function matchTip(grip){
 // Grip stays at the fingers. Lower the burning head toward the fine wood.
 return add(grip,game.remaining>0?[-.09,-.077,-.025]:[-.115,-.012,-.01]);
}
function buildShavings(){
 const m=new Mesh(),r=rng(23);
 m.object('shavings',()=>{
   for(let i=0;i<29;i++){
     const x=shavings[0]+between(r,-.155,.155),z=shavings[2]+between(r,-.115,.115);
     const angle=between(r,0,Math.PI*2),width=between(r,.010,.018);
     const color=colors(r,['#f1cb88','#dab37a','#e3bd82','#edcc93']);
     let last;
     for(let j=0;j<9;j++){
       const t=j/8,along=.15*(t-.5)+Math.sin(t*5.2)*.026;
       const p=[x+along*Math.cos(angle),.02+(.019*i)%.044+.065*(1-Math.cos(t*5.2))*.5,z+along*Math.sin(angle)];
       const edge=add(p,[width*Math.sin(angle),.003,-width*Math.cos(angle)]);
       if(last)m.quad(last[0],last[1],edge,p,color);
       last=[p,edge];
     }
   }
 });
 return m;
}
function matchbox(m){
 const [x,y,z]=boxPos;
 m.object('box',()=>{
   m.box(x,y,z,.49,.14,.33,'#ba8b50');
   m.box(x,y+.077,z,.49,.018,.33,'#d7bd88');
   m.box(x,y+.089,z,.428,.008,.272,'#9c5036');
   // Printed sunrise emblem and narrow cream borders on the sleeve.
   m.box(x,y+.095,z-.10,.394,.004,.009,'#dfc794');
   m.box(x,y+.095,z+.10,.394,.004,.009,'#dfc794');
   m.rod([x-.083,y+.095,z],[x-.083,y+.100,z],.065,.065,'#efd09b',12);
   m.tri([x-.16,y+.102,z+.06],[x-.036,y+.102,z-.04],[x+.049,y+.102,z+.06],'#4b5746',true);
   for(let i=0;i<3;i++)m.box(x+.108,y+.098,z-.036+i*.028,.095-i*.013,.005,.008,'#e3c89a');
 });
 m.object('stripe',()=>{
   m.box(x,y,z+.168,.48,.103,.012,'#5d3a30');
   for(let i=0;i<12;i++)m.box(x-.213+i*.038,y,z+.175,.008,.07,.003,'#936844');
 });
 if(!game.box)return;
 m.object('box',()=>{m.box(x+.33,y-.006,z,.27,.065,.282,'#d2ac78');m.box(x+.33,y+.028,z,.24,.004,.242,'#8b694a')});
 m.object('match',()=>{for(let i=0;i<game.matches;i++){const mx=x+.255+i*.074;
   m.rod([mx,y+.052,z+.103],[mx,y+.052,z-.092],.013,.013,'#f0ce8b',5);
   m.rod([mx,y+.052,z-.079],[mx,y+.052,z-.108],.023,.022,'#ac462e',6)}
 });
}
function flame(m,p,h,t){
 const flicker=Math.sin(t*14)*h*.12;
 const tip=[p[0]+flicker,p[1]+h,p[2]],base=[p[0],p[1]+h*.22,p[2]];
 m.rod(p,base,h*.035,h*.17,'#f0a042',6);m.rod(base,tip,h*.17,0,'#ffd075',6);
 m.rod([p[0],p[1],p[2]+.018],[p[0],p[1]+h*.64,p[2]+.018],h*.094,0,'#fff1bd',5);
}
// The pads meet at pinch. Only the fingertips share the held object's hit area.
function drawHand(m,pinch,id,side){
 const offset=(x,y,z)=>add(pinch,[side*x,y,z]);

 const wrist=offset(.16,-.125,.10);
 const palm=offset(.077,-.058,.044);
 const sleeveEnd=offset(.19,-.15,.13);
 m.rod([side*.75,.62,2.86],sleeveEnd,.13,.082,'#525646',8);
 m.rod(sleeveEnd,wrist,.086,.074,'#746d55',8);
 m.rod(wrist,palm,.067,.049,'#b28664',8);
 const thumb=offset(.039,-.008,.027),index=offset(.047,.029,-.024);
 m.rod(palm,thumb,.030,.022,'#bd9171',7);
 m.rod(palm,index,.027,.020,'#c79b79',7);
 m.object(id,()=>{
   m.rod(thumb,pinch,.022,.012,'#bd9171',7);
   m.rod(index,pinch,.020,.011,'#c79b79',7);
 });
}
function dynamicWorld(t,grip){
 const m=new Mesh();
 matchbox(m);
 for(let i=0;i<game.spent;i++)m.rod([-.34+i*.08,.018,.76],[-.21+i*.08,.018,.81],.009,.008,'#504536',5);
 if(grip){
   const id=game.held?'heldMatch':null;
   drawHand(m,grip,id,1);
   if(game.held){
     const tip=matchTip(grip);
     m.object(id,()=>{
       m.rod(add(grip,[.034,.006,.004]),tip,.012,.009,'#dabc81',5);
       m.rod(add(tip,[.012,.002,0]),tip,.019,.016,game.remaining?'#624235':'#a14a34',7);
     });
     if(game.remaining)flame(m,tip,.045+.080*Math.min(1,game.remaining),t);
   }
 }
 if(game.heat>.20){
   const s=Math.min(1,game.heat/heatToIgnite);
   for(let i=0;i<5;i++){
     const x=(i-2)*.039,z=.26+Math.sin(i*2)*.052;
     m.rod([x,.068,z],[x+.032,.076,z+.008],.004+s*.006,.003,
       s>.7?'#e58d39':'#976045',5);
   }
 }
 if(game.stage!=='cold'){
   const spread=game.stage==='shavings'?0:game.stage==='twigs'?1:2;
   const grow=Math.min(1,(game.stageTime+.15)/2);
   const height=[.15,.32,.56][spread]*(.74+grow*.26);
   // Ember seams show which wood is now sustaining the fire.
   if(spread>=1){
     for(let i=0;i<6;i++){
       const x=(i%2?1:-1)*(.08+i*.015);
       m.rod([x,.083,.20],[x*.55,.158,.077],.008,.005,'#db7539',5);
     }
   }
   if(spread===2){
     for(const x of [-.42,.44]){
       for(let i=0;i<3;i++){
         const z=-.19+i*.14;
         m.rod([x-.038,.239,z],[x-.025,.244,z+.095],.009,.006,'#b35d30',5);
         flame(m,[x-.025,.245,z],grow*(.15+.07*Math.sin(t*5+i)),t+i);
       }
     }
   }
   for(let i=0;i<5+spread*3;i++){
     const a=i*2.4,reach=.095+spread*.124;
     flame(m,[Math.cos(a)*reach,.066+spread*.022,.26-spread*.10+Math.sin(a)*reach],
       height*(1+.21*Math.sin(t*6+i)),t+i);
   }
 }
 return m;
}
