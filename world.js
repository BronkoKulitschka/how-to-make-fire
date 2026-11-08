function rng(seed){return()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296)}
const between=(r,a,b)=>a+(b-a)*r();
const colors=(r,list)=>list[Math.floor(r()*list.length)];
function rock(m,x,z,w,h,d,color,y=0,seed=1){
  const r=rng(seed),a=[],b=[];
  for(let i=0;i<7;i++){let t=i*Math.PI*2/7,k=.85+r()*.25;
    a.push([x+w*k*Math.cos(t),y+.01,z+d*k*Math.sin(t)]);
    b.push([x+w*k*.71*Math.cos(t+.13),y+h*(.75+r()*.19),z+d*k*.71*Math.sin(t+.13)])}
  for(let i=0;i<7;i++){let j=(i+1)%7;m.quad(a[j],a[i],b[i],b[j],color);m.tri(b[j],b[i],[x-w*.17,y+h,z-d*.15],color)}
}
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
 shade(-.66,.98,.36,.24,.05,'#685c43');shade(.89,1.10,.41,.36,.09,'#5e5940');
 shade(.13,.14,1.11,.79,.14,'#63593f');
 // Dark earth and charcoal beneath an irregular ring of stones.
 rock(m,0,.04,.99,.032,.76,'#534836',.002,3);
 for(let i=0;i<15;i++){const t=i*Math.PI*2/15;rock(m,.91*Math.cos(t),.02+.70*Math.sin(t),between(r,.13,.21),between(r,.11,.24),between(r,.11,.19),colors(r,['#808574','#989784','#777b68','#a09a80']),.01,i+9)}
 m.object('wood',()=>{
   log(m,[-.57,.14,-.32],[.50,.18,.49],.16,5);
   log(m,[.60,.15,-.31],[-.36,.19,.49],.14,17);
   log(m,[-.34,.23,-.25],[.28,.33,.34],.115,36);
   for(let i=0;i<13;i++){let x=between(r,-.29,.29);m.rod([x,.20,.34],[x+between(r,-.17,.17),.26,between(r,-.2,.06)],.014,.010,'#bb9a69',5)}
 });
 // The jacket lies at the player's right knee, with its pocket seam facing upward.
 m.object('knee',()=>{
   rock(m,.84,1.07,.37,.25,.36,'#454e46',.018,141);
   // Folded canvas, a sleeve, its cuff, and two stitched seams.
   m.rod([1.11,.15,.94],[1.22,.13,1.32],.12,.094,'#59604f',8);
   m.rod([1.21,.13,1.28],[1.23,.13,1.36],.099,.099,'#737562',8);
   m.rod([.58,.16,1.08],[.72,.20,1.35],.085,.10,'#5b6252',7);
   for(let i=0;i<8;i++)m.box(.67+i*.052,.291,1.206,.024,.007,.007,'#96957d');
 });
 m.object('pocket',()=>{
   m.box(.86,.245,1.08,.42,.085,.29,'#5d6253');m.box(.86,.293,1.016,.42,.024,.115,'#737664');
   m.box(.86,.286,1.079,.33,.012,.017,'#292f2a');
   m.rod([.89,.304,1.06],[.89,.314,1.06],.026,.025,'#c4af79',9);
 });
 return m;
}
const boxPos=[-.72,.08,.96],woodPos=[0,.25,.25];
const paperRest=[-.38,.57,1.30];
const matchHeadOffset=[-.073,.116,-.052];
function paperPosition(t,pinch=paperRest){
 if(game.paper==='placed')return [0,.365,.44];
 if(game.paper==='held')return add(pinch,[.12,-.015,0]);
 const p=(t%14)/14;return [-1.55+3.10*p,.37+.15*Math.sin(p*7),.20+.26*Math.cos(p*6)];
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
function flame(m,p,h,t,still){
 const flicker=still?0:Math.sin(t*14)*h*.12;
 const tip=[p[0]+flicker,p[1]+h,p[2]],base=[p[0],p[1]+h*.22,p[2]];
 m.rod(p,base,h*.035,h*.17,'#f0a042',6);m.rod(base,tip,h*.17,0,'#ffd075',6);
 m.rod([p[0],p[1],p[2]+.018],[p[0],p[1]+h*.64,p[2]+.018],h*.094,0,'#fff1bd',5);
}
function visitor(m,t){
 const isAlien=game.visitor==='alien',departing=game.visitor==='leaving'&&game.lit&&game.still;
 if(game.visitor!=='person'&&!isAlien&&!departing)return;
 // Only the projected silhouette enters the clearing.
 const y=.043,ink='#343a31',shape=pts=>{for(let i=1;i<pts.length-1;i++)m.tri([pts[0][0],y,pts[0][1]],[pts[i][0],y,pts[i][1]],[pts[i+1][0],y,pts[i+1][1]],ink,true)};
 shape([[2.6,-1],[1.46,-.8],[1.23,-.63],[1.23,-.31],[1.62,.07],[2.6,.28]]);
 shape([[1.58,-.66],[1.06,-.94],[.57,-.54],[.43,-.60],[.98,-1.14],[1.62,-.89]]);
 if(isAlien||departing){for(let i=0;i<6;i++)shape([[.61,-.61],[.53,-.58],[.34-i*.019,-.61+i*.035],[.49,-.65+i*.011]]);
   m.object('cig',()=>{m.rod([.67,.73,-.18],[.38,.69,-.12],.025,.026,'#e4d7ad',8);m.rod([.68,.73,-.18],[.60,.72,-.16],.026,.026,'#ac7a48',8);if(departing)flame(m,[.38,.69,-.12],.046,t,true)});
 }
}
// The pads meet at pinch. Only the fingertips share the held object's hit area.
function drawHand(m,pinch,id,side,t){
 const offset=(x,y,z)=>add(pinch,[side*x,y,z]);
 const tremor=game.t>33&&!game.braced&&!game.still?Math.sin(t*9)*.012:0;
 const wrist=offset(.16+tremor,-.125,.10);
 const palm=offset(.077+tremor,-.058,.044);
 const sleeveEnd=offset(.19+tremor,-.15,.13);
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
function dynamicWorld(t,grip,paperGrip=paperRest){
 const m=new Mesh(),r=rng(886);
 matchbox(m);visitor(m,t);
 if(game.paper!=='wind'||t>=game.paperDelay){
   const [x,y,z]=paperPosition(t,paperGrip),w=.16,flap=game.paper==='wind'?Math.sin(t*4)*.038:.012;
   m.object('paper',()=>{m.quad([x-w,y,z+.11],[x+.02,y+.025,z+.10],[x+.04,y+.03,z-.12],[x-w*.8,y+flap,z-.08],'#f2dba0');
     m.quad([x+.02,y+.025,z+.10],[x+w,y+flap,z+.055],[x+w,y,z-.13],[x+.04,y+.03,z-.12],'#d8bd87');
     for(let k=0;k<3;k++)m.box(x-.058,y+.034,z-.044+.027*k,.10,.002,.005,'#928769')
   });
 }
 m.object('stone',()=>rock(m,game.pinned?.06:-.52,game.pinned?.45:.50,.12,.065,.11,'#b0ac90',game.pinned?.38:.06,6));
 for(let i=0;i<Math.min(3,game.fallen);i++)m.rod([-.34+i*.1,.049,.76],[-.21+i*.1,.047,.81],.009,.008,'#705c44',4);
 if(game.bottle){
   const x=1.01,z=-.16;
   m.object('tag',()=>{
     m.rod([x,.035,z],[x,.48,z],.16,.17,'#747e75',10);
     m.rod([x,.48,z],[x,.58,z],.17,.067,'#8c9888',10);
     m.box(x,.62,z,.10,.08,.075,'#a09064');m.box(x,.69,z,.16,.025,.032,'#b0b19b');
     m.box(x,.36,z+.164,.23,.145,.018,game.tag?'#b3aa89':'#d9c08e');
     for(let i=0;i<2;i++)m.box(x,.39-i*.044,z+.176,.14-i*.03,.008,.004,'#696754');
   });
 }
 if(game.pocket && game.hand!=='lighter'){
   m.object('lighter',()=>{m.box(.89,.34,1.03,.097,.09,.13,'#a96641');m.box(.89,.395,1.03,.093,.027,.10,'#c9bea4')});
 }
 if(game.paper==='held')drawHand(m,paperGrip,'paper',-1,t);
 if(grip){
   const heldId=game.hand==='match'?'heldMatch':game.hand==='lighter'?'lighter':null;
   drawHand(m,grip,heldId,1,t);
   if(game.hand){
     const tip=add(grip,game.hand==='match'?matchHeadOffset:[-.022,.090,-.008]);
     const [x,y,z]=tip;
     m.object(heldId,()=>{
       if(game.hand==='match'){
         m.rod(add(grip,[.025,-.043,.018]),tip,.013,.010,'#dabc81',5);
         m.rod([x+.01,y-.015,z],[x,y+.015,z],.022,.016,'#a14a34',6);
       }else{
         m.box(x+.03,y-.103,z,.114,.18,.068,'#a96b47');
         m.box(x+.03,y-.022,z,.113,.056,.069,'#c7bfaa');
         m.rod([x+.03,y+.009,z],[x+.069,y+.009,z],.022,.022,'#535850',7);
       }
     });
     if(game.lit)flame(m,[x,y+.016,z],.155,t,game.still);
   }
 }
 const wind=weather()==='wind';
 for(let i=0;i<12;i++){
   const x=((t*(wind?.96:.15)+r()*8)%8)-4,z=-3+r()*3;
   const y=.53+r()*.92+Math.sin(t+i)*.12;
   if(wind)m.tri([x,y,z],[x+.10,y+.018,z+.03],[x+.023,y+.037,z+.026],i%2?'#bc9a59':'#9a9455');
 }
 // Low hanging leaves sway above the clearing, even before the first strike.
 for(let j=0;j<2;j++){
   const start=[-1.55-j*.30,1.53+j*.38,-1.15],end=[-.76-j*.18,1.23+j*.37+(wind?.075:.012)*Math.sin(t*3+j),-1.34];
   m.rod([-3.5,1.12,-3.6],start,.087,.031,'#604f37',5);m.rod(start,end,.028,.012,'#60563c',5);
   for(let k=0;k<9;k++){
     const p=add(start,mul(sub(end,start),(k+1)/10)),s=k%2?1:-1;
     m.tri(p,add(p,[.075,.022,s*.12]),add(p,[.14,-.024,s*.18]),k%2?'#9d995f':'#baaa69');
   }
 }
 if(weather()==='rain'&&!game.done)for(let i=0;i<50;i++){
   let x=r()*5-2.5,z=r()*5-2.5,y=2.8-((r()*4+t*2.5)%3);
   m.tri([x,y,z],[x+.014,y-.11,z],[x+.018,y-.11,z],'#aab8a5',true);
 }
 if(game.done){
   for(let i=0;i<13;i++){const a=i*2.4,p=[Math.cos(a)*.24,.30,Math.sin(a)*.19];flame(m,p,.35+.20*Math.sin(t*5+i),t+i,false)}
   for(let i=0;i<12;i++){const f=(t*.36+i*.173)%1,x=Math.sin(i*2+f*5)*.13,y=.43+f*.8;m.tri([x,y,0],[x+.01,y+.018,0],[x+.015,y,0],'#ffce7e',true)}
 }
 return m;
}
