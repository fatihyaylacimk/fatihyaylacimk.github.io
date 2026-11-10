// SI units. One planar side truss; the deck and vehicle loads are shared equally.
export const G = 9.81;
export const DEFAULTS = Object.freeze({ topology: 'warren', span: 30, height: 5, panels: 8, diameter: 85, truck: 180, position: .5, horizontal: 0, damping: .02, disabled: [], extra: [], supports: null });
export const STEEL = Object.freeze({ E: 200e9, rho: 7850, fy: 250e6 });
export const CASES = Object.freeze({ normal: { factor: 1, safety: 1.5, deflectionRatio: 400 }, professor: { factor: 1.5, safety: 2, deflectionRatio: 800 } });

export function bridgeModel(p = DEFAULTS) {
  const n = Math.round(Number(p.panels)), L = Number(p.span), h = Number(p.height);
  if (!(n >= 2 && n <= 16 && L >= 4 && L <= 100 && h >= .5 && h <= 30)) throw new Error('Invalid geometry');
  const nodes = [], bars = [], deck = [], top = [];
  for (let i = 0; i <= n; i++) { deck.push(nodes.length); nodes.push({ x: L * i / n, y: 0 }); }
  const add = (a, b) => { const id = [a,b].sort((x,y)=>x-y).join('-'); if (!bars.some(e=>e.id===id)) bars.push({ a,b,id, active: !(p.disabled || []).includes(id) }); };
  for (let i = 0; i < n; i++) add(i, i+1);
  if (p.topology === 'warren') {
    for (let i=0;i<n;i++) { const j=nodes.length; top.push(j); nodes.push({x:L*(i+.5)/n,y:h}); add(i,j); add(j,i+1); if(i) add(j-1,j); }
  } else {
    for(let i=0;i<=n;i++) { const j=nodes.length; top.push(j); nodes.push({x:L*i/n,y:h}); add(i,j); if(i) add(j-1,j); }
    for(let i=0;i<n;i++) {
      const forward = p.topology === 'pratt' ? i < n/2 : i >= n/2;
      add(forward?i:i+1, forward?top[i+1]:top[i]);
    }
  }
  for (const pair of p.extra || []) if (pair.length===2 && pair.every(i=>Number.isInteger(i)&&i>=0&&i<nodes.length) && pair[0]!==pair[1]) add(pair[0],pair[1]);
  const supports = p.supports ? structuredClone(p.supports) : [{ node:0, x:true, y:true },{node:n, x:false, y:true}];
  return { nodes, bars, supports, deck, top, span:L, area:Math.PI*(p.diameter/1000)**2/4, inertia:Math.PI*(p.diameter/1000)**4/64 };
}

function cholesky(A) {
  const n=A.length, L=Array.from({length:n},()=>new Float64Array(n));
  const scale=Math.max(...A.map((r,i)=>r[i]));
  if (!(scale>0)) return null;
  for(let i=0;i<n;i++) for(let j=0;j<=i;j++) {
    let s=A[i][j]; for(let k=0;k<j;k++) s-=L[i][k]*L[j][k];
    if(i===j) { if(!(s>scale*1e-11)) return null; L[i][j]=Math.sqrt(s); }
    else L[i][j]=s/L[j][j];
  }
  return L;
}
function backsolve(L,b) {
  const n=b.length,x=new Float64Array(n),y=new Float64Array(n);
  for(let i=0;i<n;i++) { let s=b[i]; for(let j=0;j<i;j++) s-=L[i][j]*y[j]; y[i]=s/L[i][i]; }
  for(let i=n-1;i>=0;i--) { let s=y[i]; for(let j=i+1;j<n;j++) s-=L[j][i]*x[j]; x[i]=s/L[i][i]; }
  return x;
}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);

// General solver, also exercised independently against exact analytic test cases.
export function solveTruss(model, { E=STEEL.E, rho=STEEL.rho, loads=null, selfWeight=true, deckMassPerMetre=0, extraMass=null, modal=true }={}) {
  const N=model.nodes.length,D=2*N,A=model.area;
  if(!(E>0&&A>0&&rho>=0)) return {ok:false,reason:'invalid'};
  const K=Array.from({length:D},()=>new Float64Array(D)), F=new Float64Array(D), masses=new Float64Array(N), elements=[];
  let mass=0;
  if(loads) for(let i=0;i<D;i++) F[i]=Number(loads[i]||0);
  for(const bar of model.bars.filter(b=>b.active!==false)) {
    const a=model.nodes[bar.a],b=model.nodes[bar.b],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);
    if(!(L>1e-8)) return {ok:false,reason:'invalid'};
    const c=dx/L,s=dy/L,v=[-c,-s,c,s],dof=[2*bar.a,2*bar.a+1,2*bar.b,2*bar.b+1], k=E*A/L, m=rho*A*L;
    for(let i=0;i<4;i++) for(let j=0;j<4;j++) K[dof[i]][dof[j]]+=k*v[i]*v[j];
    masses[bar.a]+=m/2; masses[bar.b]+=m/2; mass+=m;
    if(selfWeight) {F[2*bar.a+1]-=m*G/2;F[2*bar.b+1]-=m*G/2;}
    elements.push({...bar,L,v,dof,k,m});
  }
  if(deckMassPerMetre && model.deck) for(let i=1;i<model.deck.length;i++) {
    const a=model.deck[i-1],b=model.deck[i],m=deckMassPerMetre*Math.abs(model.nodes[b].x-model.nodes[a].x);
    masses[a]+=m/2;masses[b]+=m/2;mass+=m;
    if(selfWeight) {F[2*a+1]-=m*G/2; F[2*b+1]-=m*G/2;}
  }
  if(extraMass) for(let i=0;i<N;i++) masses[i]+=extraMass[i]||0;
  const fixed=new Set();
  for(const s of model.supports) {if(s.node<0||s.node>=N) return {ok:false,reason:'invalid'};if(s.x)fixed.add(2*s.node);if(s.y)fixed.add(2*s.node+1);}
  const free=Array.from({length:D},(_,i)=>i).filter(i=>!fixed.has(i));
  if(!free.length) return {ok:false,reason:'invalid'};
  const Kff=free.map(i=>Float64Array.from(free,j=>K[i][j])), factor=cholesky(Kff);
  if(!factor) return {ok:false,reason:'unstable',mass};
  const uf=backsolve(factor,Float64Array.from(free,i=>F[i])),u=new Float64Array(D);
  free.forEach((d,i)=>u[d]=uf[i]);
  const reactions=Float64Array.from(K,(r,i)=>dot(r,u)-F[i]);
  const members=elements.map(e=> { const ext=e.dof.reduce((s,d,i)=>s+e.v[i]*u[d],0),force=e.k*ext;return {...e,force,stress:force/A,strain:ext/e.L}; });
  let maxDisp=0,maxVertical=0;
  for(let i=0;i<N;i++) {maxDisp=Math.max(maxDisp,Math.hypot(u[2*i],u[2*i+1]));maxVertical=Math.max(maxVertical,Math.abs(u[2*i+1]));}
  const normF=Math.max(1,...F.map(Math.abs));
  const residual=Math.max(0,...free.map(i=>Math.abs(reactions[i])))/normF;
  let fx=0,fy=0,moment=0;
  for(let i=0;i<N;i++) { const x=model.nodes[i].x,y=model.nodes[i].y; const rx=fixed.has(2*i)?reactions[2*i]:0,ry=fixed.has(2*i+1)?reactions[2*i+1]:0;fx+=F[2*i]+rx;fy+=F[2*i+1]+ry;moment+=x*(F[2*i+1]+ry)-y*(F[2*i]+rx); }
  const energy=.5*dot(u,F);
  let frequency=null,mode=new Float64Array(D),eigenResidual=null;
  if(modal) {
    const M=Float64Array.from(free,d=>Math.max(masses[Math.floor(d/2)],1e-8));
    let phi=Float64Array.from(free,d=>d%2?Math.sin(Math.PI*model.nodes[Math.floor(d/2)].x/(model.span||1)):.01);
    // Inverse iteration on K phi = lambda M phi. M-normalized, unshifted lowest mode.
    for(let k=0;k<48;k++) {
      const next=backsolve(factor,Float64Array.from(phi,(v,i)=>v*M[i]));
      const norm=Math.sqrt(next.reduce((s,v,i)=>s+v*v*M[i],0));
      if(!(norm>0&&Number.isFinite(norm))) break;
      phi=Float64Array.from(next,v=>v/norm);
    }
    const Kphi=Float64Array.from(Kff,r=>dot(r,phi)),denom=phi.reduce((s,v,i)=>s+v*v*M[i],0),lambda=dot(phi,Kphi)/denom;
    if(lambda>0&&Number.isFinite(lambda)) {
      frequency=Math.sqrt(lambda)/(2*Math.PI);
      eigenResidual=Math.sqrt(Kphi.reduce((s,v,i)=>s+(v-lambda*M[i]*phi[i])**2,0))/Math.max(1e-10,Math.hypot(...Kphi));
      const amplitude=Math.max(...phi.map(Math.abs));
      free.forEach((d,i)=>mode[d]=phi[i]/amplitude);
    }
  }
  return {ok:true,u,F,reactions,members,mass,masses,maxDisp,maxVertical,residual,balance:{fx,fy,moment},energy,frequency,mode,eigenResidual};
}

export function evaluate(p,caseName='normal',options={}) {
  const model=bridgeModel(p), C=CASES[caseName]||CASES.normal,loads=new Float64Array(model.nodes.length*2),extraMass=new Float64Array(model.nodes.length);
  const x=Math.max(0,Math.min(1,p.position))*p.span, i=Math.min(p.panels-1,Math.floor(x/(p.span/p.panels))),t=(x-model.nodes[i].x)/(p.span/p.panels),P=p.truck*1000/2;
  loads[2*i+1]-=P*C.factor*(1-t);loads[2*(i+1)+1]-=P*C.factor*t;
  extraMass[i]+=P/G*(1-t);extraMass[i+1]+=P/G*t;
  for(const j of model.top) loads[2*j]+=(p.horizontal||0)*1000/2/model.top.length*C.factor;
  const r=solveTruss(model,{loads,deckMassPerMetre:175,extraMass,modal:options.modal!==false});
  if(!r.ok) return {...r,model,caseName,pass:false};
  let yieldUtil=0,buckleUtil=0,critical=null,maxStress=0;
  for(const m of r.members) {
    const yu=Math.abs(m.stress)/(STEEL.fy/C.safety),pcr=Math.PI**2*STEEL.E*model.inertia/m.L**2,bu=m.force<0?-m.force/(pcr/C.safety):0;
    m.yieldUtil=yu;m.buckleUtil=bu;m.utilization=Math.max(yu,bu);m.pcr=pcr;
    if(!critical||m.utilization>critical.utilization)critical=m;
    yieldUtil=Math.max(yieldUtil,yu);buckleUtil=Math.max(buckleUtil,bu);maxStress=Math.max(maxStress,Math.abs(m.stress));
  }
  const deflectionLimit=p.span/C.deflectionRatio,deflectionUtil=r.maxVertical/deflectionLimit,outOfModel=r.maxDisp/p.span>.03;
  const utilization=Math.max(yieldUtil,buckleUtil,deflectionUtil);
  return {...r,model,caseName,caseSettings:C,yieldUtil,buckleUtil,deflectionUtil,deflectionLimit,outOfModel,utilization,maxStress,critical,pass:utilization<=1&&!outOfModel,totalMass:r.mass*2,vehicleX:x};
}

export function modalOffset(result,t,{amplitude=.015,damping=.02}={}) {
  if(!result?.ok||!result.frequency||t<0)return 0;
  const w=2*Math.PI*result.frequency,wd=w*Math.sqrt(1-damping*damping);
  return amplitude*Math.exp(-damping*w*t)*(Math.cos(wd*t)+damping*w/wd*Math.sin(wd*t));
}

export function validateConfig(raw={}) {
  const out={...DEFAULTS};
  const ranges={span:[12,50],height:[2,10],panels:[4,12],diameter:[50,200],truck:[0,600],position:[0,1],horizontal:[0,100],damping:[.005,.15]};
  for(const [k,[lo,hi]] of Object.entries(ranges)) if(Number.isFinite(raw[k])) out[k]=Math.min(hi,Math.max(lo,raw[k]));
  out.panels=Math.round(out.panels);
  if(['warren','pratt','howe'].includes(raw.topology))out.topology=raw.topology;
  out.disabled=Array.isArray(raw.disabled)?raw.disabled.filter(v=>typeof v==='string'&&/^\d+-\d+$/.test(v)).slice(0,100):[];
  out.extra=Array.isArray(raw.extra)?raw.extra.filter(v=>Array.isArray(v)&&v.length===2&&v.every(Number.isInteger)).slice(0,100):[];
  if(Array.isArray(raw.supports)&&raw.supports.length<=40&&raw.supports.every(s=>s&&Number.isInteger(s.node)&&s.node>=0&&s.node<60&&typeof s.x==='boolean'&&typeof s.y==='boolean')) out.supports=raw.supports;
  return out;
}
