// Facettierte Weltgeometrie. Dieselben Dreiecke dienen der Darstellung und der Trefferauswahl.
const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(v,k)=>v.map(n=>n*k), dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=v=>mul(v,1/(Math.hypot(...v)||1));
const palette=new Map();
function rgb(hex){if(!palette.has(hex))palette.set(hex,[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255));return palette.get(hex)}
const sun=unit([-1,.95,-1.6]);
class Mesh{
  constructor(){this.data=[];this.hits=[];this.id=null}
  tri(a,b,c,color,flat=false){
    const n=unit(cross(sub(b,a),sub(c,a))),light=flat?1:.76+.27*Math.max(0,dot(n,sun))+.09*Math.abs(n[1]);
    const col=mul(rgb(color),light);
    for(const p of [a,b,c])this.data.push(...p,...col);
    if(this.id)this.hits.push({id:this.id,a,b,c});
  }
  quad(a,b,c,d,color,flat=false){this.tri(a,b,c,color,flat);this.tri(a,c,d,color,flat)}
  box(x,y,z,w,h,d,color){
    const v=[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]].map(([a,b,c])=>[x+a*w/2,y+b*h/2,z+c*d/2]);
    for(const f of [[4,7,6,5],[3,2,6,7],[0,4,5,1],[0,3,7,4],[1,5,6,2],[0,1,2,3]])this.quad(...f.map(i=>v[i]),color);
  }
  rod(a,b,r1,r2,color,sides=7,cap=color){
    const axis=unit(sub(b,a)),u=unit(cross(axis,Math.abs(axis[1])>.94?[1,0,0]:[0,1,0])),v=cross(axis,u);
    let low=[],high=[];
    for(let i=0;i<sides;i++){const angle=i*2*Math.PI/sides,offset=add(mul(u,Math.cos(angle)),mul(v,Math.sin(angle)));low.push(add(a,mul(offset,r1)));high.push(add(b,mul(offset,r2)))}
    for(let i=0;i<sides;i++){const j=(i+1)%sides;this.quad(low[i],low[j],high[j],high[i],color);if(r2)this.tri(b,high[i],high[j],cap);if(r1)this.tri(a,low[j],low[i],cap)}
  }
  object(id,fn){const old=this.id;this.id=id;fn();this.id=old}
}
function camera(w,h,look){
  const eye=[look[0]*.055,1.84+look[1]*.025,3.27],target=[look[0]*.26,.68+look[1]*.22,-.62];
  const f=unit(sub(target,eye)),r=unit(cross(f,[0,1,0])),u=cross(r,f);
  const focal=Math.min(h*.99,w*1.08);
  return {eye,f,r,u,w,h,fx:2*focal/w,fy:2*focal/h};
}
function project(p,c){
  const v=sub(p,c.eye),z=dot(v,c.f);
  return [(1+dot(v,c.r)*c.fx/z)*c.w/2,(1-dot(v,c.u)*c.fy/z)*c.h/2,z];
}
function intersect(x,y,cam,meshes){
  const dir=unit(add(cam.f,add(mul(cam.r,(2*x/cam.w-1)/cam.fx),mul(cam.u,(1-2*y/cam.h)/cam.fy))));
  let nearest=Infinity,id=null;
  for(const mesh of meshes)for(const face of mesh.hits){
    const ab=sub(face.b,face.a),ac=sub(face.c,face.a),normal=cross(ab,ac),den=dot(normal,dir);
    if(Math.abs(den)<1e-8)continue;
    const t=dot(normal,sub(face.a,cam.eye))/den;if(t<=0||t>=nearest)continue;
    const p=add(cam.eye,mul(dir,t));
    if([[face.a,face.b],[face.b,face.c],[face.c,face.a]].every(([a,b])=>dot(normal,cross(sub(b,a),sub(p,a)))>=( -1e-7 * dot(normal,normal) ))){nearest=t;id=face.id}
  }return id?{id,point:add(cam.eye,mul(dir,nearest))}:null;
}
function makeRenderer(canvas){
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
  if(!gl)return software(canvas);
  const vertex='attribute vec3 p,col;uniform vec3 eye,rt,up,fw;uniform vec2 scale;uniform float night,fire;varying vec3 tint;void main(){vec3 v=p-eye;float z=dot(v,fw);gl_Position=vec4(dot(v,rt)*scale.x,dot(v,up)*scale.y,z*1.001-.09,z);float fog=clamp((z-7.)/43.,0.,.83);vec3 lit=col*vec3(1.-night*.22,1.-night*.18,1.-night*.08);lit+=vec3(.37,.14,.024)*fire/(1.+2.5*dot(p-vec3(0.,.3,0.),p-vec3(0.,.3,0.)));tint=mix(lit,vec3(.59,.62,.55),fog);}';
  const fragment='precision mediump float;varying vec3 tint;void main(){gl_FragColor=vec4(tint,1.);}';
  const prog=gl.createProgram();
  for(const [kind,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const sh=gl.createShader(kind);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(prog,sh)}
  gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);
  const attr=['p','col'].map(k=>gl.getAttribLocation(prog,k));attr.forEach(i=>gl.enableVertexAttribArray(i));
  const U=Object.fromEntries(['eye','rt','up','fw','scale','night','fire'].map(k=>[k,gl.getUniformLocation(prog,k)]));
  const fixedBuffer=gl.createBuffer(),movingBuffer=gl.createBuffer();let previous;
  gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
  return (c,fixed,moving,night,fire)=>{
    gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    for(const [key,val] of [['eye',c.eye],['rt',c.r],['up',c.u],['fw',c.f]])gl.uniform3fv(U[key],val);
    gl.uniform2f(U.scale,c.fx,c.fy);gl.uniform1f(U.night,night);gl.uniform1f(U.fire,fire);
    for(const [mesh,buffer] of [[fixed,fixedBuffer],[moving,movingBuffer]]){
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      if(mesh===moving||fixed!==previous)gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.data),mesh===fixed?gl.STATIC_DRAW:gl.DYNAMIC_DRAW);
      attr.forEach((a,i)=>gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,i*12));
      gl.drawArrays(gl.TRIANGLES,0,mesh.data.length/6);
    }previous=fixed;
  }
}
// Perspective software path for browsers with WebGL disabled.
function software(canvas){
  const ctx=canvas.getContext('2d'),surface=document.createElement('canvas'),small=surface.getContext('2d');
  let key='',background,baseDepth,frame,depth;
  function raster(mesh,c,night,fire,pixels,zbuf){
    const w=surface.width,h=surface.height,d=mesh.data;
    for(let i=0;i<d.length;i+=18){
      const tri=[];
      for(let k=0;k<18;k+=6){
        const x=d[i+k]-c.eye[0],y=d[i+k+1]-c.eye[1],z=d[i+k+2]-c.eye[2];
        tri.push([x*c.r[0]+y*c.r[1]+z*c.r[2],x*c.u[0]+y*c.u[1]+z*c.u[2],x*c.f[0]+y*c.f[1]+z*c.f[2]]);
      }
      // Clip triangles at the near plane; foreground terrain crosses the camera.
      const clipped=[];
      for(let n=0;n<3;n++){
        const a=tri[n],b=tri[(n+1)%3],near=.05;
        if(a[2]>=near)clipped.push(a);
        if((a[2]>=near)!==(b[2]>=near)){
          const t=(near-a[2])/(b[2]-a[2]);
          clipped.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,near]);
        }
      }
      if(clipped.length<3)continue;
      const v=clipped.map(([x,y,z])=>[(1+x*c.fx/z)*w*.5,(1-y*c.fy/z)*h*.5,1/z]);
      const fog=Math.min(.83,Math.max(0,((tri[0][2]+tri[1][2]+tri[2][2])/3-7)/43));
      const lit=fire/(1+2.5*(d[i]**2+(d[i+1]-.3)**2+d[i+2]**2));
      const col=[0,1,2].map(k=>Math.round(255*((d[i+3+k]*(1-night*[.22,.18,.08][k])+lit*[.37,.14,.024][k])*(1-fog)+[.59,.62,.55][k]*fog)));
      for(let n=1;n+1<v.length;n++){
        const [a,b,e]=[v[0],v[n],v[n+1]];
        const left=Math.max(0,Math.floor(Math.min(a[0],b[0],e[0]))),right=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],e[0])));
        const top=Math.max(0,Math.floor(Math.min(a[1],b[1],e[1]))),bottom=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],e[1])));
        if(top>bottom||left>right)continue;
        const ux=b[0]-a[0],uy=b[1]-a[1],vx=e[0]-a[0],vy=e[1]-a[1],area=ux*vy-uy*vx;
        if(Math.abs(area)<1e-7)continue;
        const du=vy/area,dv=-uy/area;
        for(let y=top;y<=bottom;y++){
          let u=((left+.5-a[0])*vy-(y+.5-a[1])*vx)/area;
          let t=(ux*(y+.5-a[1])-uy*(left+.5-a[0]))/area;
          for(let x=left,index=y*w+left;x<=right;x++,index++,u+=du,t+=dv){
            if(u<0||t<0||u+t>1)continue;
            const iz=a[2]+u*(b[2]-a[2])+t*(e[2]-a[2]);
            if(iz<=zbuf[index])continue;
            zbuf[index]=iz;const offset=index*4;
            pixels[offset]=col[0];pixels[offset+1]=col[1];pixels[offset+2]=col[2];pixels[offset+3]=255;
          }
        }
      }
    }
  }
  return(c,fixed,moving,night,fire)=>{
    const ratio=Math.min(1,960/c.w,800/c.h);
    const signature=[c.w,c.h,...c.f.map(x=>x.toFixed(3)),Math.round(night*8),Math.round(fire)].join('/');
    if(key!==signature){
      surface.width=Math.round(c.w*ratio);surface.height=Math.round(c.h*ratio);
      frame=small.createImageData(surface.width,surface.height);depth=new Float32Array(surface.width*surface.height);
      baseDepth=new Float32Array(depth.length);background=new Uint8ClampedArray(frame.data.length);
      raster(fixed,c,night,fire,background,baseDepth);key=signature;
    }
    frame.data.set(background);depth.set(baseDepth);raster(moving,c,night,fire,frame.data,depth);
    small.putImageData(frame,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(surface,0,0,canvas.width,canvas.height);
  };
}
