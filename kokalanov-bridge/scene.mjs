import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
const UP=new THREE.Vector3(0,1,0),BASE=3,WIDTH=5.4;
export class BridgeScene {
 constructor(canvas,onPick){
  this.canvas=canvas;this.onPick=onPick;this.colorMode=true;this.tool='inspect';this.memberMeshes=[];this.jointMeshes=[];
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;this.renderer.setClearColor(0xdfe6dc);
  this.scene=new THREE.Scene();this.scene.fog=new THREE.Fog(0xdfe6dc,58,145);
  this.camera=new THREE.PerspectiveCamera(36,1,.15,250);this.controls=new OrbitControls(this.camera,canvas);
  this.controls.enableDamping=true;this.controls.dampingFactor=.07;this.controls.minDistance=13;this.controls.maxDistance=110;this.controls.maxPolarAngle=Math.PI*.48;this.controls.target.set(0,3,0);
  this.scene.add(new THREE.HemisphereLight(0xfffcf0,0x667564,2.8));
  const sun=new THREE.DirectionalLight(0xfff1d8,4.1);sun.position.set(-20,42,24);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.camera.far=110;sun.shadow.normalBias=.035;this.scene.add(sun);
  const rim=new THREE.DirectionalLight(0xe0edf3,1.1);rim.position.set(20,8,-20);this.scene.add(rim);
  this.environment=new THREE.Group();this.structure=new THREE.Group();this.scene.add(this.environment,this.structure);
  this.beamGeometry=new THREE.CylinderGeometry(1,1,1,8);this.jointGeometry=new THREE.SphereGeometry(.11,8,6);this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
  this.vehicle=this.makeVehicle();this.scene.add(this.vehicle);
  let down=null;
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;const r=canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const targets=this.tool==='add'||this.tool==='support'?this.jointMeshes:this.memberMeshes;const hit=this.raycaster.intersectObjects(targets,false)[0];if(hit)this.onPick(hit.object.userData);down=null;});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;document.dispatchEvent(new CustomEvent('bridge-context-lost'));});
  this.resize();
 }
 material(color,roughness=.7){return new THREE.MeshStandardMaterial({color,roughness,metalness:.08});}
 box(group,x,y,z,w,h,d,mat){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 disposeGroup(group){group.traverse(o=>{if(o.isMesh){if(o.geometry!==this.beamGeometry&&o.geometry!==this.jointGeometry)o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();}});group.clear();}
 makeEnvironment(span){
  this.disposeGroup(this.environment);const g=this.environment;
  const earth=this.material(0x8d9980),rock=this.material(0xb7b6a4),lightRock=this.material(0xc5c5b4),road=this.material(0xb9bcae),foliage=this.material(0x5b7053),trunk=this.material(0x8a806c);
  this.box(g,0,-11,0,200,2,190,this.material(0xb4bdad));
  for(const side of [-1,1]){
   this.box(g,side*(span/2+16),-3.8,0,32,12,110,earth);
   this.box(g,side*(span/2+.1),-1.3,0,1.8,7,13,rock);
   this.box(g,side*(span/2+15),2.32,0,31,.16,WIDTH+.25,road);
   for(let i=0;i<14;i++){const x=side*(span/2+3+(i*7%17)),z=(i*13%64)-32;if(Math.abs(z)<8)continue;
    const h=1.3+(i%4)*.35;this.box(g,x,2.5+h*.25,z,.18,h*.6,.18,trunk);
    const t=new THREE.Mesh(new THREE.ConeGeometry(.65+(i%3)*.15,h,7),foliage);t.position.set(x,2.9+h*.65,z);t.castShadow=true;g.add(t);
   }
   for(let i=0;i<5;i++){const x=side*(span/2+5+i*4),z=-24-i*3,h=2+i%3;
    this.box(g,x,2.3+h/2,z,3,h,3.5,lightRock);
   }
  }
  const waterMat=new THREE.MeshStandardMaterial({color:0x6b8a90,roughness:.36,metalness:.2});
  const water=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(8,span-1.6),160),waterMat);water.rotation.x=-Math.PI/2;water.position.set(0,-3.1,0);water.receiveShadow=true;g.add(water);
  this.waterLines=[];
  for(let i=0;i<38;i++){const w=.18+(i%4)*.22,l=1+(i%7)*.8;const q=new THREE.Mesh(new THREE.PlaneGeometry(w,l),new THREE.MeshBasicMaterial({color:0xb6c9bf,transparent:true,opacity:.17}));q.rotation.x=-Math.PI/2;q.position.set(((i*7.7)%Math.max(7,span-4))-(span-4)/2,-3.085,(i*5.3)%100-50);g.add(q);this.waterLines.push(q);}
  // Quiet architectural survey grid; not a second structural model.
  const grid=new THREE.GridHelper(110,55,0x829379,0xabb6a1);grid.position.set(0,2.39,-40);grid.material.transparent=true;grid.material.opacity=.13;g.add(grid);
 }
 makeVehicle(){
  const g=new THREE.Group(),orange=this.material(0xb96b42,.4),cab=this.material(0xe9dfc6,.4),glass=this.material(0x3b5558,.2),rubber=this.material(0x3c433c),metal=this.material(0xb5b6aa);
  this.box(g,0,.54,0,3.5,.27,1.65,metal);this.box(g,-.6,1.08,0,2.1,.95,1.65,orange);this.box(g,1.12,1.1,0,.95,1.05,1.58,cab);this.box(g,1.6,1.25,0,.025,.42,1.25,glass);this.box(g,1.15,1.28,.8,.68,.42,.025,glass);this.box(g,1.15,1.28,-.8,.68,.42,.025,glass);
  for(const x of [-1.05,.95])for(const z of [-.84,.84]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.2,12),rubber);wheel.rotation.x=Math.PI/2;wheel.position.set(x,.35,z);g.add(wheel);}
  return g;
 }
 rebuild(result,p){
  const model=result.model;this.model=model;this.result=result;this.params=p;
  this.disposeGroup(this.structure);this.memberMeshes=[];this.jointMeshes=[];this.crossbeams=[];this.deckSegments=[];this.supportMeshes=[];
  if(this.lastSpan!==p.span){this.makeEnvironment(p.span);this.lastSpan=p.span;this.setCamera('perspective');}
  const radius=Math.max(.045,p.diameter/2000),steel=this.material(0xdbe2ce,.38),joint=this.material(0xb5c0a7,.5),deck=this.material(0xd0cbbb,.8),line=this.material(0xe8e2c4,.9);
  for(const side of [-1,1]){
   for(const bar of model.bars){const material=steel.clone();if(bar.active===false){material.transparent=true;material.opacity=.15;material.color.setHex(0xb9654c);}const m=new THREE.Mesh(this.beamGeometry,material);m.userData={kind:'member',id:bar.id,a:bar.a,b:bar.b,side};m.userData.radius=radius;m.castShadow=bar.active;m.receiveShadow=true;this.structure.add(m);this.memberMeshes.push(m);}
   model.nodes.forEach((node,i)=>{const m=new THREE.Mesh(this.jointGeometry,joint.clone());m.userData={kind:'node',index:i,side};m.position.set(node.x-p.span/2,node.y+BASE,side*WIDTH/2);m.castShadow=true;this.structure.add(m);this.jointMeshes.push(m);});
  }
  for(const node of model.deck){const m=new THREE.Mesh(this.beamGeometry,steel.clone());m.userData={node};m.castShadow=true;this.structure.add(m);this.crossbeams.push(m);}
  for(let i=0;i<model.deck.length-1;i++){
   const group=new THREE.Group();const board=this.box(group,0,-.13,0,1,.22,WIDTH,deck);this.box(group,0,.002,0,1,.008,.045,line);this.structure.add(group);this.deckSegments.push({group,board,i});
  }
  const supportMat=this.material(0xa7afa0),baseMat=this.material(0xd8d5c5);
  for(const s of model.supports){const node=model.nodes[s.node];if(!node)continue;for(const side of [-1,1]){
    const group=new THREE.Group();const c=new THREE.Mesh(new THREE.ConeGeometry(.48,.6,3),supportMat);c.rotation.y=Math.PI/2;c.position.y=-.43;group.add(c);this.box(group,0,-.82,0,1.35,.18,1.1,baseMat);
    if(!s.x){for(const x of [-.25,.25]){const roller=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.65,8),supportMat);roller.rotation.x=Math.PI/2;roller.position.set(x,-.72,0);group.add(roller);}}
    group.position.set(node.x-p.span/2,node.y+BASE,side*WIDTH/2);this.structure.add(group);this.supportMeshes.push(group);
   }}
  this.updateResult(result,p);this.setTool(this.tool);
 }
 setCamera(view){
  const L=this.params?.span||30;const positions={perspective:[L*.77,L*.46,L*.8],front:[0,L*.2,L*1.45],top:[L*.01,L*1.3,.01]};
  this.camera.position.set(...positions[view]);this.controls.target.set(0,BASE+1.5,0);this.controls.update();
 }
 resize(){const r=this.canvas.parentElement.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height,false);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();}
 zoomBy(factor){this.camera.position.sub(this.controls.target).multiplyScalar(factor).add(this.controls.target);this.controls.update();}
 setTool(tool){this.tool=tool;this.canvas.style.cursor=tool==='inspect'?'grab':'crosshair';for(const m of this.jointMeshes)m.scale.setScalar(tool==='add'||tool==='support'?2:1);}
 selectNode(index){for(const m of this.jointMeshes)m.material.color.setHex(m.userData.index===index?0xc47743:0xb5c0a7);}
 updateResult(r,p){this.result=r;this.params=p;this.amplification=r.ok?Math.max(1,Math.floor(Math.min(60,2.4/Math.max(.04,r.maxDisp)))):1;this.vehicle.visible=r.ok;this.recolor();}
 recolor(selected=null){for(const mesh of this.memberMeshes){const m=this.result?.members?.find(b=>b.id===mesh.userData.id);if(!m){mesh.material.color.setHex(0xb9654c);continue;}const color=new THREE.Color(this.colorMode?(m.force>=0?0x678d99:0xc18a5c):0xdce2d1);if(this.colorMode&&m.utilization>1)color.lerp(new THREE.Color(0xb74b3e),Math.min(1,(m.utilization-1)*.4+.25));if(mesh.userData.id===selected)color.setHex(0xd5ad45);mesh.material.color.copy(color);}}
 point(index,side,q){const n=this.model.nodes[index],r=this.result;const dx=r?.ok?r.u[2*index]+r.mode[2*index]*q:0,dy=r?.ok?r.u[2*index+1]+r.mode[2*index+1]*q:0;return new THREE.Vector3(n.x-this.params.span/2+dx*this.amplification,n.y+BASE+dy*this.amplification,side*WIDTH/2);}
 fitCylinder(mesh,a,b,radius){const dir=new THREE.Vector3().subVectors(b,a),length=dir.length();mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(UP,dir.normalize());mesh.scale.set(radius,length,radius);}
 render(time,q=0){if(!this.model||this.lost)return;for(const m of this.memberMeshes){const d=m.userData;this.fitCylinder(m,this.point(d.a,d.side,q),this.point(d.b,d.side,q),d.radius);}
  for(const m of this.jointMeshes)m.position.copy(this.point(m.userData.index,m.userData.side,q));
  for(const m of this.crossbeams){const i=m.userData.node;this.fitCylinder(m,this.point(i,-1,q),this.point(i,1,q),.055);}
  for(const {group,i} of this.deckSegments){const a=this.point(i,0,q),b=this.point(i+1,0,q);group.position.copy(a).add(b).multiplyScalar(.5);group.rotation.z=Math.atan2(b.y-a.y,b.x-a.x);group.scale.x=a.distanceTo(b)+.015;}
  const t=this.params.position*this.params.panels,i=Math.min(this.params.panels-1,Math.floor(t)),f=t-i,a=this.point(i,0,q),b=this.point(i+1,0,q);this.vehicle.position.copy(a).lerp(b,f);this.vehicle.rotation.z=Math.atan2(b.y-a.y,b.x-a.x);this.vehicle.scale.setScalar(.85+this.params.truck/1600);this.vehicle.visible=this.result.ok&&this.params.truck>0;
  if(this.waterLines)for(let i=0;i<this.waterLines.length;i++)this.waterLines[i].material.opacity=.1+.08*Math.sin(time*.7+i);
  this.controls.update();this.renderer.render(this.scene,this.camera);
 }
 capture(){this.renderer.render(this.scene,this.camera);return this.canvas.toDataURL('image/png');}
}
