import {test} from 'node:test';
import assert from 'node:assert/strict';
import {solveTruss,bridgeModel,evaluate,DEFAULTS,validateConfig,modalOffset,G} from '../physics.mjs';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const triangle=()=>({nodes:[{x:0,y:0},{x:2,y:0},{x:1,y:1}],bars:[{a:0,b:1,id:'0-1'},{a:0,b:2,id:'0-2'},{a:1,b:2,id:'1-2'}],supports:[{node:0,x:true,y:true},{node:1,x:false,y:true}],area:.001,span:2});
test('single axial bar exact solution',()=>{
 const m={nodes:[{x:0,y:0},{x:2,y:0}],bars:[{a:0,b:1,id:'0-1'}],supports:[{node:0,x:true,y:true},{node:1,x:false,y:true}],area:.001,span:2};
 const r=solveTruss(m,{loads:[0,0,1000,0],selfWeight:false,modal:false});assert.ok(r.ok);near(r.u[2],.00001);near(r.members[0].force,1000);near(r.members[0].stress,1e6);near(r.reactions[0],-1000);
});
test('symmetric triangle exact displacement, forces, reactions and mass',()=>{
 const r=solveTruss(triangle(),{loads:[0,0,0,0,0,-100000],selfWeight:false,modal:false});assert.ok(r.ok);
 near(r.reactions[1],50000);near(r.reactions[3],50000);near(r.reactions[0],0);near(r.members[0].force,50000);near(r.members[1].force,-70710.67811865475);near(r.members[2].force,-70710.67811865475);
 near(r.u[2],.0005);near(r.u[4],.00025);near(r.u[5],-.0009571067811865475);near(r.mass,37.9031529292576);
 near(r.balance.fx,0);near(r.balance.fy,0);near(r.balance.moment,0);
 const memberEnergy=r.members.reduce((s,m)=>s+m.force**2*m.L/(2*200e9*.001),0);near(r.energy,memberEnergy);
});
test('area, stiffness and load scaling identities',()=>{
 const m=triangle(),opts={loads:[0,0,0,0,0,-100000],selfWeight:false,modal:false},a=solveTruss(m,opts),b=solveTruss(m,{...opts,E:400e9}),c=solveTruss({...m,area:.002},opts),d=solveTruss(m,{...opts,loads:opts.loads.map(x=>2*x)});
 near(b.u[5],a.u[5]/2);near(b.members[0].force,a.members[0].force);near(c.u[5],a.u[5]/2);near(c.members[0].stress,a.members[0].stress/2);near(c.mass,a.mass*2);near(d.u[5],a.u[5]*2);near(d.energy,a.energy*4);
});
test('square mechanism rejected, triangulation restores stability',()=>{
 const m={nodes:[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}],bars:[{a:0,b:1},{a:1,b:2},{a:2,b:3},{a:3,b:0}],supports:[{node:0,x:true,y:true},{node:1,x:false,y:true}],area:.001,span:2};
 assert.equal(solveTruss(m).ok,false);m.bars.push({a:0,b:2});assert.ok(solveTruss(m).ok);
});
test('moving off-node axle preserves reactions and global moments including dead weight',()=>{
 for(const pos of [0,.137,.5,.811,1]){
  const p={...DEFAULTS,position:pos},r=evaluate(p);assert.ok(r.ok);
  const W=r.mass*G,P=p.truck*1000/2;
  near(r.reactions[1],W/2+P*(1-pos));near(r.reactions[2*p.panels+1],W/2+P*pos);
  near(r.balance.fy,0,1e-6);near(r.balance.moment,0,1e-5);assert.ok(r.residual<1e-9);
 }
});
test('all offered topologies have stable models and converged positive first modes',()=>{
 for(const topology of ['warren','pratt','howe']){
  const r=evaluate({...DEFAULTS,topology});assert.ok(r.ok);assert.ok(r.frequency>0);assert.ok(r.eigenResidual<1e-5,`${topology} ${r.eigenResidual}`);assert.ok(Number.isFinite(r.utilization));
 }
});
test('strict inspection uses real loads and allows a sound design to pass',()=>{
 const thin={...DEFAULTS,diameter:70},thick={...DEFAULTS,diameter:180};
 assert.equal(evaluate(thin,'professor').pass,false);assert.equal(evaluate(thick,'professor').pass,true);
 const normal=evaluate(DEFAULTS),strict=evaluate(DEFAULTS,'professor');assert.ok(strict.maxVertical>normal.maxVertical);assert.ok(strict.utilization>normal.utilization);
});
test('removed diagonal produces genuine singularity, no fabricated displacement',()=>{
 const m=bridgeModel(DEFAULTS),diagonal=m.bars.find(e=>Math.abs(m.nodes[e.a].y-m.nodes[e.b].y)>0);
 const r=evaluate({...DEFAULTS,disabled:[diagonal.id]});assert.equal(r.ok,false);assert.equal(r.reason,'unstable');assert.equal(r.u,undefined);
});
test('free-decay starts at specified displacement and actually decays',()=>{
 const r=evaluate(DEFAULTS);near(modalOffset(r,0),.015);assert.ok(Math.abs(modalOffset(r,30))<.015);near(modalOffset(r,-1),0);
});
test('external saved configs are bounded and invalid identifiers sanitized',()=>{
 const r=validateConfig({span:1e9,topology:'<script>',panels:7.2,disabled:['1-2','<svg>'],extra:[[0,2],['0',2]],truck:NaN});assert.equal(r.span,50);assert.equal(r.topology,'warren');assert.equal(r.panels,7);assert.deepEqual(r.disabled,['1-2']);assert.deepEqual(r.extra,[[0,2]]);assert.equal(r.truck,180);
});
