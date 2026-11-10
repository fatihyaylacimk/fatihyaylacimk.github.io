// Perspective Canvas 2D renderer for devices without WebGL. Uses the same FEM
// coordinates and results as the GPU view, with depth-sorted 3D primitives.
const BASE=3,WIDTH=5.4;
export class CanvasBridgeScene {
 constructor(canvas,onPick){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw Error('Canvas unavailable');
  this.onPick=onPick;this.colorMode=true;this.tool='inspect';this.selected=null;this.selectedNode=null;this.yaw=.62;this.pitch=.43;this.zoom=1;this.hitNodes=[];this.hitBars=[];
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.resize();
  let down=null,last=null,moved=0;
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};last=down;moved=0;canvas.setPointerCapture?.(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!last)return;const dx=e.clientX-last.x,dy=e.clientY-last.y;moved+=Math.abs(dx)+Math.abs(dy);this.yaw+=dx*.005;this.pitch=Math.max(.08,Math.min(1.53,this.pitch+dy*.004));last={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointerup',e=>{last=null;if(!down||moved>8){down=null;return;}const r=canvas.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};
   if(this.tool==='add'||this.tool==='support'){let best=null,dist=19;for(const n of this.hitNodes){const d=Math.hypot(p.x-n.p.x,p.y-n.p.y);if(d<dist){dist=d;best=n;}}if(best)this.onPick({kind:'node',index:best.index,side:best.side});}
   else{let best=null,dist=10;for(const b of this.hitBars){const dx=b.b.x-b.a.x,dy=b.b.y-b.a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-b.a.x)*dx+(p.y-b.a.y)*dy)/l)):0,d=Math.hypot(p.x-b.a.x-t*dx,p.y-b.a.y-t*dy);if(d<dist){dist=d;best=b;}}if(best)this.onPick({kind:'member',id:best.id});}down=null;
  });
  canvas.addEventListener('pointercancel',()=>{down=null;last=null;});canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.65,Math.min(2,this.zoom*Math.exp(e.deltaY*.001)));},{passive:false});
 }
 resize(){const r=this.canvas.parentElement.getBoundingClientRect();this.w=r.width;this.h=r.height;const d=Math.min(devicePixelRatio,1.7);this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);this.ctx.setTransform(d,0,0,d,0,0);}
 rebuild(r,p){this.model=r.model;this.updateResult(r,p);}
 updateResult(r,p){this.result=r;this.params=p;this.model=r.model;this.amplification=r.ok?Math.max(1,Math.floor(Math.min(60,2.4/Math.max(.04,r.maxDisp)))):1;}
 setTool(tool){this.tool=tool;this.canvas.style.cursor=tool==='inspect'?'grab':'crosshair';}
 selectNode(i){this.selectedNode=i;}
 recolor(id=null){this.selected=id;}
 setCamera(view){this.zoom=1;if(view==='front'){this.yaw=0;this.pitch=.17;}else if(view==='top'){this.yaw=.3;this.pitch=1.5;}else{this.yaw=.62;this.pitch=.43;}}
 zoomBy(factor){this.zoom=Math.max(.65,Math.min(2,this.zoom*factor));}
 project(v){const [x,y,z]=v,Y=y-(BASE+1.1),sy=Math.sin(this.yaw),cy=Math.cos(this.yaw),sp=Math.sin(this.pitch),cp=Math.cos(this.pitch),distance=this.params.span*(this.w<600?1.7:1.15)*this.zoom;
  const depth=distance-(x*sy*cp+Y*sp+z*cy*cp),f=Math.min(this.w*1.55,this.h*1.68)/Math.max(2,depth);
  return {x:this.w*.49+(x*cy-z*sy)*f,y:this.h*.47-(-x*sy*sp+Y*cp-z*cy*sp)*f,d:depth,s:f};
 }
 point(i,side,q){const n=this.model.nodes[i],r=this.result;return[n.x-this.params.span/2+(r.ok?(r.u[2*i]+r.mode[2*i]*q)*this.amplification:0),n.y+BASE+(r.ok?(r.u[2*i+1]+r.mode[2*i+1]*q)*this.amplification:0),side*WIDTH/2];}
 render(time,q=0){
  if(!this.model||!this.w)return;const ctx=this.ctx,W=this.w,H=this.h,L=this.params.span,items=[];this.hitNodes=[];this.hitBars=[];
  ctx.fillStyle='#dfe6dc';ctx.fillRect(0,0,W,H);
  const poly=(pts,fill,stroke=null)=>{const p=pts.map(v=>this.project(v));items.push({type:'poly',p,fill,stroke,d:p.reduce((s,v)=>s+v.d,0)/p.length});};
  const line=(a,b,color,width=1,alpha=1)=>{const p=this.project(a),r=this.project(b);items.push({type:'line',a:p,b:r,color,width,alpha,d:(p.d+r.d)/2});return[p,r];};
  const box=(x,y,z,w,h,d,colors)=>{const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
   poly([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],colors[0]);poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],colors[1]);poly([[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],colors[1]);poly([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],colors[2]);poly([[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],colors[2]);
  };
  poly([[-110,-8,-110],[110,-8,-110],[110,-8,110],[-110,-8,110]],'#bac5b1');
  poly([[-L/2+1,-3.1,-110],[L/2-1,-3.1,-110],[L/2-1,-3.1,110],[-L/2+1,-3.1,110]],'#829e9e');
  for(let i=0;i<25;i++){const x=(i*7.1%(L-4))-(L-4)/2,z=(i*8.1+time*.18)%100-50;line([x,-3.08,z],[x+.15,-3.08,z+2+i%4],'#b3c6bd',.6,.42);}
  for(const side of [-1,1]){
   box(side*(L/2+17),-2,0,34,9,120,['#acb99c','#839679','#96a78b']);
   box(side*(L/2+.1),.7,0,1.9,4.7,10,['#c7c9b8','#a6ad9b','#b3baa6']);
   box(side*(L/2+17),2.54,0,34,.12,WIDTH+.2,['#b4baa9','#9da696','#aab09f']);
   for(let i=0;i<9;i++){const x=side*(L/2+5+(i*7%20)),z=(i*13%70)-35;if(Math.abs(z)<8)continue;const h=2.5+i%3*.4;box(x,3,z,.15,1,.15,['#807d68','#807d68','#807d68']);poly([[x-.85,3.1,z],[x,3.1+h,z],[x+.85,3.1,z]],'#526e53');poly([[x,3.1,z-.8],[x,3.1+h,z],[x,3.1,z+.8]],'#68805f');}
   for(let i=0;i<3;i++)box(side*(L/2+7+i*5),4.0+i%2*.4,-30-i*3,3,3+i%2,4,['#d7d6c5','#b6bdab','#c7cbbb']);
  }
  // Subtle architectural grid on the banks.
  for(const side of [-1,1])for(let i=0;i<7;i++){const x=side*(L/2+1+i*3);line([x,2.53,-24],[x,2.53,24],'#9eaf91',.5,.3);}
  // Render terrain separately: very large ground faces must not incorrectly
  // occlude a bridge member when sorted by their average depth.
  this.paint(items.splice(0));
  for(const s of this.model.supports){const n=this.model.nodes[s.node];if(!n)continue;for(const side of [-1,1]){const x=n.x-L/2,y=n.y+BASE,z=side*WIDTH/2;poly([[x-.5,y-.65,z],[x+.5,y-.65,z],[x,y-.15,z]],'#82947b');box(x,y-.82,z,1.3,.14,.9,['#dcdbc8','#b1b8a1','#c7ccb7']);if(!s.x)for(const dx of [-.24,.24]){const a=this.project([x+dx,y-.71,z]);items.push({type:'circle',p:a,r:Math.max(1,a.s*.09),fill:'#758671',d:a.d-.05});}}}
  for(let i=0;i<this.model.deck.length-1;i++){
   const a=this.point(i,-1,q),b=this.point(i+1,-1,q),c=this.point(i+1,1,q),d=this.point(i,1,q);poly([a,b,c,d],'#c5c4b1','#b4b9a4');
   const a2=[a[0],a[1]-.18,a[2]],b2=[b[0],b[1]-.18,b[2]];poly([a,a2,b2,b],'#9fa68f');poly([d,[d[0],d[1]-.18,d[2]],[c[0],c[1]-.18,c[2]],c],'#aeb49e');
   if(i%2===0){const aa=this.point(i,0,q),bb=this.point(i+1,0,q);line(aa,bb,'#ece6cd',1.6);}
  }
  for(const side of [-1,1])for(const b of this.model.bars){const a=this.point(b.a,side,q),e=this.point(b.b,side,q),m=this.result.members?.find(x=>x.id===b.id);let color=b.active===false?'#b78d76':this.colorMode?(m?.force>=0?'#5c8490':'#b87848'):'#dce1c9';if(m?.utilization>1&&this.colorMode)color='#ab5c47';if(this.selected===b.id)color='#b7a039';const [pa,pb]=line(a,e,color,Math.max(1.5,(this.params.diameter/1000)*(this.project(a).s+this.project(e).s)/2),b.active===false?.24:1);this.hitBars.push({id:b.id,a:pa,b:pb});}
  for(const i of this.model.deck)line(this.point(i,-1,q),this.point(i,1,q),'#a9b69d',1);
  for(const side of [-1,1])this.model.nodes.forEach((n,i)=>{const pos=this.project(this.point(i,side,q));this.hitNodes.push({p:pos,index:i,side});items.push({type:'circle',p:pos,r:this.tool==='add'||this.tool==='support'?4.5:Math.max(1.6,pos.s*.09),fill:i===this.selectedNode?'#cc884b':'#b8c4a5',d:pos.d-.02});});
  if(this.result.ok&&this.params.truck>0){const f=this.params.position*this.params.panels,i=Math.min(this.params.panels-1,Math.floor(f)),r=f-i,a=this.point(i,0,q),b=this.point(i+1,0,q),x=a[0]*(1-r)+b[0]*r,y=a[1]*(1-r)+b[1]*r;
   box(x-.5,y+1.05,0,2.25,1.1,1.65,['#d19566','#ba754a','#a5603b']);box(x+1.13,y+.99,0,.96,1.2,1.6,['#ece5cd','#c9cbb5','#dad9bf']);box(x+1.16,y+1.2,.81,.65,.43,.025,['#597373','#4d6567','#4d6567']);box(x+1.63,y+1.2,0,.025,.43,1.32,['#597373','#4d6567','#4d6567']);
   for(const dx of [-1.1,.95])for(const z of [-.87,.87]){const pp=this.project([x+dx,y+.31,z]);items.push({type:'circle',p:pp,r:Math.max(2.5,pp.s*.31),fill:'#465145',d:pp.d-.08});items.push({type:'circle',p:pp,r:Math.max(1,pp.s*.13),fill:'#b3b8a3',d:pp.d-.1});}
  }
  this.paint(items);
 }
 paint(items){const ctx=this.ctx;items.sort((a,b)=>b.d-a.d);
  for(const it of items){if(it.type==='poly'){ctx.beginPath();it.p.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=it.fill;ctx.fill();if(it.stroke){ctx.strokeStyle=it.stroke;ctx.lineWidth=.5;ctx.stroke();}}
   else if(it.type==='line'){ctx.globalAlpha=it.alpha;ctx.beginPath();ctx.moveTo(it.a.x,it.a.y);ctx.lineTo(it.b.x,it.b.y);ctx.strokeStyle=it.color;ctx.lineWidth=it.width;ctx.lineCap='round';ctx.stroke();ctx.globalAlpha=1;}
   else{ctx.beginPath();ctx.arc(it.p.x,it.p.y,it.r,0,Math.PI*2);ctx.fillStyle=it.fill;ctx.fill();}}
 }
 capture(){return this.canvas.toDataURL('image/png');}
}
