import {DEFAULTS,CASES,bridgeModel,evaluate,modalOffset,validateConfig} from './physics.mjs';
import {languages} from './i18n.mjs';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='kokalanov-bridge-designs-v1';
let lang='tr',p=structuredClone(DEFAULTS),caseName='normal',result,scene=null,tool='inspect',firstNode=null,running=false,crossing=false,runStarted=0,runStartPosition=0,vibrationAt=null,history=[],lastSample=0,lastSolve=0,toastTimer,selectedMember=null;
try{const q=new URLSearchParams(location.search);lang=q.get('lang')||localStorage.getItem('kokalanov-language')||'tr';if(q.get('design'))p=validateConfig(JSON.parse(atob(q.get('design'))));}catch{}
if(!languages[lang])lang='tr';
const t=k=>languages[lang][k]??languages.en[k]??k;
const num=(v,d=1)=>Number.isFinite(v)?v.toLocaleString(lang==='mk'?'mk-MK':lang==='tr'?'tr-TR':'en-GB',{maximumFractionDigits:d,minimumFractionDigits:d}):'—';
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function dialog(title,html){$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=html;if(!$('#dialog').open)$('#dialog').showModal();}
$('#close-dialog').onclick=()=>$('#dialog').close();
$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
function translate(){document.documentElement.lang=lang;$('#language').value=lang;$$('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));$$('[data-i18n-html]').forEach(el=>el.innerHTML=t(el.dataset.i18nHtml));document.title='Kokalanov Bridge Lab — '+t('normal');try{localStorage.setItem('kokalanov-language',lang);}catch{}updateInputs();updateUI();}
$('#language').onchange=e=>{lang=e.target.value;translate();};
function stop(){running=false;crossing=false;vibrationAt=null;}
function updateInputs(){
 for(const key of ['span','height','diameter','panels','truck','horizontal']){$('#'+key).value=p[key];$('#'+key+'-value').textContent=num(p[key],Number.isInteger(p[key])?0:2)+(key==='span'||key==='height'?' m':key==='diameter'?' mm':key==='panels'?'':' kN');}
 $('#position').value=p.position*100;$('#position-value').textContent=num(p.position*100,0)+'%';
 $$('.topology').forEach(b=>b.classList.toggle('selected',b.dataset.topology===p.topology));
}
function calculate(rebuild=false){
 try{result=evaluate(p,caseName);}catch{result={ok:false,reason:'invalid',model:bridgeModel(DEFAULTS),pass:false};}
 if(scene){if(rebuild)scene.rebuild(result,p);else scene.updateResult(result,p);}
 else drawFallback();
 updateUI();
}
function metric(id,value,unit,decimals=1){const el=$(id);el.innerHTML=Number.isFinite(value)?num(value,decimals)+'<small>'+unit+'</small>':'—<small>'+unit+'</small>';el.dataset.value=Number.isFinite(value)?String(value):'';}
function updateUI(){if(!result)return;
 metric('#metric-displacement',result.ok?result.maxVertical*1000:NaN,'mm',2);metric('#metric-utilization',result.ok?result.utilization*100:NaN,'%',1);metric('#metric-frequency',result.ok?result.frequency:NaN,'Hz',2);metric('#metric-mass',result.ok?result.totalMass/1000:NaN,'t',1);
 const unstable=!result.ok;$('#unstable-banner').hidden=!unstable;$('#scene-status').textContent=unstable?t('mechanism'):caseName==='professor'?t('strict')+' · '+t(result.pass?'pass':'fail'):t('stable');
 $('#amplification').textContent=t('amplification')+' '+num(scene?.amplification||1,0)+'×';
 $('#displacement-limit').textContent=result.ok?t('limit')+': '+num(result.deflectionLimit*1000,1)+' mm · L/'+CASES[caseName].deflectionRatio:'—';
 const dominant=result.ok?result.deflectionUtil>=Math.max(result.yieldUtil,result.buckleUtil)?'deflection':result.buckleUtil>=result.yieldUtil?'buckling':'strength':null;
 $('#critical-kind').textContent=dominant?t(dominant):t('mechanism');
 for(const [sel,val] of [['#deflection-bar',result.deflectionUtil],['#utilization-bar',result.utilization]]){const el=$(sel);el.style.width=result.ok?Math.min(100,val*100)+'%':'0';el.classList.toggle('danger',val>1);}
 $('#run-icon').textContent=running?'Ⅱ':'▶';$('#run-label').textContent=running?t('pause'):crossing?({tr:'Devam et',en:'Resume',mk:'Продолжи'})[lang]:t('run');
 $('#vibration').textContent=vibrationAt!==null?t('vibrationStop'):t('vibration');
 $('#response-note').textContent=t('responseNote');
 const panel=$('#inspection-panel');panel.classList.toggle('pass',caseName==='professor'&&result.pass);panel.classList.toggle('fail',caseName==='professor'&&!result.pass);
 $('#inspection-stamp').textContent=caseName==='professor'?(result.pass?'✓':'↻'):'K / K';
 $('#professor-test').firstElementChild.textContent=t(caseName==='professor'?'backNormal':'professorTest');
 let comment='inspectionIntro';
 if(caseName==='professor')comment=!result.ok?'inspectionUnstable':result.outOfModel?'inspectionOut':result.pass?'inspectionPass':dominant==='buckling'?'inspectionBuckling':dominant==='deflection'?'inspectionDeflection':'inspectionStrength';
 $('#inspection-copy').textContent=t(comment);
 $('#tool-hint').textContent=t(firstNode!==null?'selectSecond':{inspect:'toolInspect',remove:'toolRemove',add:'toolAdd',support:'toolSupport'}[tool]);
 $('#vibration').disabled=!result.ok;$('#run').disabled=!result.ok;
 if(selectedMember)showMember(selectedMember,false);
}

for(const key of ['span','height','diameter','panels','truck','position','horizontal'])$('#'+key).addEventListener('input',e=>{
 stop();p[key]=Number(e.target.value)/(key==='position'?100:1);selectedMember=null;$('#member-tip').hidden=true;
 if(key==='panels'){p.disabled=[];p.extra=[];p.supports=null;firstNode=null;}
 const rebuild=['span','height','diameter','panels'].includes(key);history=[];updateInputs();calculate(rebuild);
});
$$('.topology').forEach(b=>b.onclick=()=>{stop();p.topology=b.dataset.topology;p.disabled=[];p.extra=[];p.supports=null;selectedMember=null;firstNode=null;$('#member-tip').hidden=true;history=[];updateInputs();calculate(true);toast(t('topologyReset'));});
$('#reset').onclick=()=>{stop();p=structuredClone(DEFAULTS);caseName='normal';history=[];firstNode=null;selectedMember=null;$('#member-tip').hidden=true;updateInputs();calculate(true);toast(t('resetDone'));};
$$('.tool').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;firstNode=null;selectedMember=null;$('#member-tip').hidden=true;$$('.tool').forEach(x=>x.classList.toggle('active',x===b));scene?.setTool(tool);scene?.selectNode(null);updateUI();});
function pick(data){
 if(data.kind==='member'&&tool==='inspect'){selectedMember=data.id;scene?.recolor(data.id);showMember(data.id);return;}
 if(data.kind==='member'&&tool==='remove'){
  stop();if(p.disabled.includes(data.id)){p.disabled=p.disabled.filter(id=>id!==data.id);toast(t('barRestored'));}else{p.disabled.push(data.id);toast(t('barRemoved'));}history=[];calculate(true);scene?.setTool(tool);return;
 }
 if(data.kind==='node'&&tool==='add'){
  if(firstNode===null){firstNode=data.index;scene?.selectNode(firstNode);updateUI();return;}
  if(firstNode===data.index){firstNode=null;scene?.selectNode(null);updateUI();return;}
  const a=firstNode,b=data.index,id=[a,b].sort((x,y)=>x-y).join('-');firstNode=null;scene?.selectNode(null);
  if(result.model.bars.some(m=>m.id===id&&m.active)){toast(t('alreadyMember'));updateUI();return;}
  stop();if(p.disabled.includes(id))p.disabled=p.disabled.filter(x=>x!==id);else p.extra.push([a,b]);history=[];calculate(true);scene?.setTool(tool);toast(t('barAdded'));return;
 }
 if(data.kind==='node'&&tool==='support'){
  stop();if(!p.supports)p.supports=structuredClone(result.model.supports);
  const old=p.supports.find(s=>s.node===data.index);p.supports=p.supports.filter(s=>s.node!==data.index);
  if(!old)p.supports.push({node:data.index,x:false,y:true});else if(!old.x)p.supports.push({node:data.index,x:true,y:true});
  history=[];calculate(true);scene?.setTool(tool);toast(t('supportChanged'));
 }
}
function showMember(id){const m=result.members?.find(m=>m.id===id),raw=result.model.bars.find(m=>m.id===id);if(!m&&!raw)return;const el=$('#member-tip');el.hidden=false;el.innerHTML='<button class="close-tip" aria-label="Close">×</button><strong>'+t('member')+' '+esc(id)+'</strong><br>'+(m?t('length')+': '+num(m.L,2)+' m<br>'+t('axialForce')+': '+num(m.force/1000,2)+' kN ('+t(m.force>=0?'tension':'compression')+')<br>'+t('axialStress')+': '+num(m.stress/1e6,2)+' MPa<br>'+t('utilization')+': '+num(m.utilization*100,1)+'%':t('mechanism'));el.querySelector('button').onclick=()=>{el.hidden=true;selectedMember=null;scene?.recolor();};}
$('#run').onclick=()=>{if(!result.ok)return;vibrationAt=null;if(running){running=false;}else{if(!crossing){p.position=0;history=[];}crossing=true;running=true;runStartPosition=p.position;runStarted=performance.now()/1000;updateInputs();calculate();}updateUI();};
$('#vibration').onclick=()=>{if(!result.ok){toast(t('cantVibrate'));return;}running=false;crossing=false;if(vibrationAt!==null){vibrationAt=null;}else{history=[];vibrationAt=performance.now()/1000;lastSample=vibrationAt-.01;toast(t('modalStarted'));}updateUI();};
$('#professor-test').onclick=()=>{stop();caseName=caseName==='normal'?'professor':'normal';history=[];calculate();toast(t(caseName==='professor'?result.ok?result.pass?'pass':'fail':'unstable':'caseChanged'));};
$$('[data-camera]').forEach(b=>b.onclick=()=>{scene?.setCamera(b.dataset.camera);$$('[data-camera]').forEach(x=>x.classList.toggle('active',x===b));});
$('#stress-view').onclick=e=>{e.currentTarget.classList.toggle('active');if(scene){scene.colorMode=e.currentTarget.classList.contains('active');scene.recolor(selectedMember);}};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#viewport').requestFullscreen();}catch{toast(t('fullscreenFail'));}};
$('#zoom-in').onclick=()=>scene?.zoomBy(.8);$('#zoom-out').onclick=()=>scene?.zoomBy(1.25);

function drawFallback(){const model=result?.model;if(!model)return;const L=model.span||p.span,h=Math.max(...model.nodes.map(n=>n.y),1),pt=n=>[(n.x/L)*700+50,240-n.y/h*170];$('#fallback-model').innerHTML=model.bars.map(m=>{const a=pt(model.nodes[m.a]),b=pt(model.nodes[m.b]);return '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+(m.active?'#58735b':'#c58c72')+'" stroke-width="3"/>';}).join('');}

function drawChart(now){
 const W=760,H=155,points=history.filter(s=>now-s.t<=12);if(!points.length){$('#chart-path').setAttribute('d','');$('#chart-area').setAttribute('d','');return;}
 const values=points.map(v=>v.y),lo=Math.min(...values),hi=Math.max(...values),pad=Math.max(.3,(hi-lo)*.18),min=lo-pad,max=hi+pad;
 const xy=points.map(s=>[36+Math.max(0,1-(now-s.t)/12)*704,18+(max-s.y)/(max-min)*118]);
 const d=xy.map((v,i)=>(i?'L':'M')+v[0].toFixed(1)+','+v[1].toFixed(1)).join(' ');$('#chart-path').setAttribute('d',d);$('#chart-area').setAttribute('d',d+' L'+xy.at(-1)[0].toFixed(1)+',145 L'+xy[0][0].toFixed(1)+',145 Z');
 $('#chart-grid').innerHTML=[26,65,105,145].map(y=>'<line x1="36" y1="'+y+'" x2="749" y2="'+y+'" stroke="#dde2d6" stroke-width="1" stroke-dasharray="3 5"/>').join('');$('#chart-max').textContent=num(max,1);$('#chart-min').textContent=num(min,1);
}
function readSaved(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(v=>v&&typeof v.name==='string'&&v.config).slice(0,12).map(v=>({...v,config:validateConfig(v.config)})):[];}catch{return [];}}
function writeSaved(a){try{localStorage.setItem(KEY,JSON.stringify(a));return true;}catch{toast(t('storageFail'));return false;}}
$('#save-design').onclick=()=>{
 dialog(t('saveDesign'),'<p>'+t('saveBefore')+'</p><form class="name-form" id="save-form"><input id="design-name" maxlength="60" required aria-label="'+t('name')+'" value="'+esc(p.topology[0].toUpperCase()+p.topology.slice(1)+' · '+p.span+' m')+'"><button class="primary" type="submit">'+t('save')+'</button></form><p class="micro">'+t('savedHint')+'</p>');
 $('#save-form').onsubmit=e=>{e.preventDefault();const name=$('#design-name').value.trim();if(!name)return;const all=readSaved();all.unshift({id:crypto.randomUUID?.()||String(Date.now()),name:name.slice(0,60),date:new Date().toISOString(),config:structuredClone(p)});if(writeSaved(all.slice(0,12))){$('#dialog').close();toast(t('saved'));}};
 setTimeout(()=>{$('#design-name')?.focus();$('#design-name')?.select();},40);
};
function savedDialog(){
 const saved=readSaved();dialog(t('designs'),'<p class="micro">'+t('savedHint')+'</p>'+(saved.length?'<p>'+t('compareHint')+'</p>'+saved.map((s,i)=>'<div class="saved-item"><label><input type="checkbox" class="compare-check" value="'+i+'"> <strong>'+esc(s.name)+'</strong><small>'+esc(s.config.topology)+' · '+num(s.config.span,0)+' m · Ø '+num(s.config.diameter,0)+' mm</small></label><div class="actions"><button data-load="'+i+'">'+t('load')+'</button><button data-json="'+i+'">JSON ↓</button><button class="delete" data-delete="'+i+'">×</button></div></div>').join(''):'<div class="empty-state">'+t('empty')+'</div>')+'<div class="actions">'+(saved.length?'<button class="primary" id="compare-designs">'+t('compare')+'</button>':'')+'<button class="secondary" id="import-design">'+t('importJson')+'</button><button class="secondary" id="export-current">'+t('downloadJson')+'</button><button class="secondary" id="share-design">'+t('share')+'</button></div><p class="micro">'+t('shareHint')+'</p><input id="import-file" type="file" accept="application/json,.json" hidden>');
 $$('[data-load]').forEach(b=>b.onclick=()=>{loadConfig(saved[Number(b.dataset.load)].config);$('#dialog').close();toast(t('loaded'));});
 $$('[data-json]').forEach(b=>b.onclick=()=>downloadJson(saved[Number(b.dataset.json)].config));
 $$('[data-delete]').forEach(b=>b.onclick=()=>{const index=Number(b.dataset.delete);dialog(t('confirmDelete'),'<p>'+esc(saved[index].name)+'</p><div class="actions"><button class="secondary" id="cancel-delete">'+t('cancel')+'</button><button class="primary" id="confirm-delete">'+t('deleteConfirm')+'</button></div>');$('#cancel-delete').onclick=savedDialog;$('#confirm-delete').onclick=()=>{saved.splice(index,1);if(writeSaved(saved)){savedDialog();toast(t('deleted'));}};});
 $('#compare-designs')?.addEventListener('click',()=>{const ids=$$('.compare-check:checked').map(x=>Number(x.value));if(ids.length!==2){toast(t('selectTwo'));return;}showComparison(saved[ids[0]],saved[ids[1]]);});
 $('#export-current').onclick=()=>downloadJson(p);$('#import-design').onclick=()=>$('#import-file').click();$('#import-file').onchange=async e=>{try{const file=e.target.files[0];if(!file||file.size>100000)throw Error();const raw=JSON.parse(await file.text());if(!raw||typeof raw!=='object'||!Number.isFinite((raw.config||raw).span))throw Error();loadConfig(validateConfig(raw.config||raw));$('#dialog').close();toast(t('imported'));}catch{toast(t('importFail'));}};
 $('#share-design').onclick=shareDesign;
}
$('#saved-nav').onclick=savedDialog;
function loadConfig(config){stop();p=validateConfig(config);caseName='normal';history=[];firstNode=null;selectedMember=null;$('#member-tip').hidden=true;updateInputs();calculate(true);scene?.setTool(tool);}
function showComparison(a,b){
 const shared={truck:p.truck,position:p.position,horizontal:p.horizontal};
 const an=evaluate({...a.config,...shared},'normal'),bn=evaluate({...b.config,...shared},'normal'),as=evaluate({...a.config,...shared},'professor'),bs=evaluate({...b.config,...shared},'professor');
 const cell=(r,key,scale=1,d=2)=>r.ok?num(r[key]*scale,d):'—',status=r=>'<span class="'+(r.pass?'table-pass':'table-fail')+'">'+t(r.ok?r.pass?'pass':'fail':'unstable')+'</span>';
 const rows=[[t('span'),num(a.config.span,0)+' m',num(b.config.span,0)+' m'],[t('diameter'),num(a.config.diameter,0)+' mm',num(b.config.diameter,0)+' mm'],[t('vehicleLoad'),num(p.truck,0)+' kN',num(p.truck,0)+' kN'],[t('vehiclePosition'),num(p.position*100,1)+'%',num(p.position*100,1)+'%'],[t('horizontal'),num(p.horizontal,0)+' kN',num(p.horizontal,0)+' kN'],[t('mass'),cell(an,'totalMass',.001,1)+' t',cell(bn,'totalMass',.001,1)+' t'],[t('displacement'),cell(an,'maxVertical',1000)+' mm',cell(bn,'maxVertical',1000)+' mm'],[t('utilization'),cell(an,'utilization',100,1)+'%',cell(bn,'utilization',100,1)+'%'],[t('frequency'),cell(an,'frequency')+' Hz',cell(bn,'frequency')+' Hz'],[t('normalResult'),status(an),status(bn)],[t('strictResult'),status(as),status(bs)]];
 dialog(t('comparison'),'<p class="micro">'+t('reportNote')+'</p><div class="comparison-scroll"><table><thead><tr><th></th><th>'+esc(a.name)+'</th><th>'+esc(b.name)+'</th></tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((c,i)=>(i?'<td>':'<th>')+c+(i?'</td>':'</th>')).join('')+'</tr>').join('')+'</tbody></table></div><div class="actions"><button class="secondary" id="back-saved">← '+t('designs')+'</button></div>');$('#back-saved').onclick=savedDialog;
}
async function shareDesign(){const u=new URL(location.href);u.search='';u.searchParams.set('lang',lang);u.searchParams.set('design',btoa(JSON.stringify(p)));try{await navigator.clipboard.writeText(u.href);toast(t('copied'));}catch{dialog(t('share'),'<p>'+t('copyFailed')+'</p><input style="width:100%;padding:10px" readonly value="'+esc(u.href)+'">');}}
function download(data,name,type='text/plain'){const blob=data instanceof Blob?data:new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast(t('downloaded'));}
function downloadJson(config){download(JSON.stringify({application:'Kokalanov Bridge Lab',version:1,config},null,2),'kokalanov-design.json','application/json');}
$('#screenshot').onclick=()=>{try{if(!scene)throw Error();const image=new Image();image.onload=()=>{const out=document.createElement('canvas');out.width=image.width;out.height=image.height+110;const ctx=out.getContext('2d');ctx.fillStyle='#f3f2ed';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(image,0,0);ctx.fillStyle='#334d3a';ctx.font='24px Georgia';ctx.fillText('KOKALANOV / BRIDGE LAB',24,image.height+37);ctx.font='13px Arial';ctx.fillText(t('displacement')+': '+(result.ok?num(result.maxVertical*1000,2):'—')+' mm  ·  '+t('utilization')+': '+(result.ok?num(result.utilization*100,1):'—')+'%',24,image.height+66);ctx.font='11px Arial';ctx.fillStyle='#6c7862';ctx.fillText(t('amplification')+' '+num(scene.amplification,0)+'×  ·  '+t(caseName==='professor'?'strict':'normal')+'  ·  By Fatih',24,image.height+89);out.toBlob(blob=>{if(blob)download(blob,'kokalanov-bridge.png','image/png');else toast(t('captureFail'));});};image.src=scene.capture();}catch{toast(t('captureFail'));}};

function methods(){dialog(t('methodHeading'),'<h3>'+t('assumptions')+'</h3><p>'+t('modelDescription')+'</p><p>'+t('modelMass')+'</p><div class="case-badge">Kᶠᶠ uᶠ = Fᶠ · σ = N/A · Pcr = π²EI/L²</div><h3>'+t('checks')+'</h3><p>'+t('modelChecks')+'</p><h3>'+t('dynamics')+'</h3><p>'+t('modelDynamics')+'</p><p>'+t('modelVisual')+'</p><p>'+t('modelLimit')+'</p><h3>'+t('sources')+'</h3><ul><li><a href="https://mechanics.ju.se/SolidMechanics/SystematicTrussAnalysis.html" target="_blank" rel="noopener">Jönköping University — Systematic truss analysis</a></li><li><a href="https://mechref.engr.illinois.edu/sol/buckling.html" target="_blank" rel="noopener">University of Illinois — Elastic buckling</a></li><li><a href="https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/resources/lecture-24-modal-analysis-orthogonality-mass-stiffness-damping-matrix/" target="_blank" rel="noopener">MIT OpenCourseWare — Modal analysis</a></li></ul><div class="actions"><button class="primary" id="open-report">'+t('report')+'</button><button class="secondary" id="method-export">'+t('exportConfig')+'</button><a class="secondary" style="text-decoration:none" href="./Kokalanov_Bridge_Lab_v1.zip" download>'+t('sourceCode')+'</a></div>');$('#open-report').onclick=openReport;$('#method-export').onclick=()=>downloadJson(p);}
$('#methods-nav').onclick=methods;$('#footer-methods').onclick=methods;
function openReport(){const r=result;const w=window.open('','_blank');if(!w){toast(t('popupFail'));return;}
 const rows=[[t('case'),t(caseName==='professor'?'strict':'normal')],[t('geometry'),esc(p.topology)+' · '+num(p.span,0)+' m · '+num(p.height,2)+' m · Ø '+num(p.diameter,0)+' mm'],[t('vehicleLoad'),num(p.truck,0)+' kN @ '+num(p.position*100,1)+'%'],[t('horizontal'),num(p.horizontal,0)+' kN'],[t('displacement'),r.ok?num(r.maxVertical*1000,3)+' mm':'—'],[t('utilization'),r.ok?num(r.utilization*100,2)+'%':'—'],[t('frequency'),r.ok?num(r.frequency,3)+' Hz':'—'],[t('mass'),r.ok?num(r.totalMass/1000,3)+' t':'—'],[t('residual'),r.ok?r.residual.toExponential(3):'—'],[t('result'),t(r.ok?r.pass?'pass':'fail':'unstable')]];
 w.document.write('<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><title>'+t('reportTitle')+'</title><style>body{max-width:850px;margin:45px auto;padding:20px;color:#263b2e;font:14px/1.7 Arial}h1{font:36px Georgia}h2{font:24px Georgia;margin-top:30px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border-bottom:1px solid #d6dfd0;padding:8px;text-align:left}p{color:#63715a}button{padding:12px 20px;background:#36533d;color:white;border:0;cursor:pointer}@media print{button{display:none}body{margin:0;padding:0}tr{break-inside:avoid}}</style></head><body><small>KOKALANOV / BRIDGE LAB · '+new Date().toLocaleString(lang==='mk'?'mk-MK':lang==='tr'?'tr-TR':'en-GB',{timeZone:'Europe/Skopje'})+' · Europe/Skopje'+'</small><h1>'+t('reportTitle')+'</h1><button onclick="window.print()">'+t('report')+'</button><p>'+t('reportNote')+'</p><table>'+rows.map(row=>'<tr><th>'+row[0]+'</th><td>'+row[1]+'</td></tr>').join('')+'</table>'+(r.ok?'<h2>'+t('member')+'</h2><table><tr><th>ID</th><th>L (m)</th><th>N (kN)</th><th>σ (MPa)</th><th>'+t('utilization')+'</th></tr>'+r.members.map(m=>'<tr><td>'+esc(m.id)+'</td><td>'+num(m.L,3)+'</td><td>'+num(m.force/1000,3)+'</td><td>'+num(m.stress/1e6,3)+'</td><td>'+num(m.utilization*100,2)+'%</td></tr>').join('')+'</table>':'')+'<h2>'+t('assumptions')+'</h2><p>'+t('modelDescription')+'</p><p>'+t('modelMass')+'</p><p>'+t('modelChecks')+'</p><p>'+t('modelDynamics')+'</p><p>'+t('modelVisual')+'</p><p>'+t('modelLimit')+'</p><small>Designed and developed by Fatih · v1.0</small></body></html>');w.document.close();}
$('#export-data').onclick=()=>{
 const lines=['# Kokalanov Bridge Lab v1.0','# '+new Date().toISOString(),'# Case: '+caseName,'# Vehicle position: '+p.position,'# Planar side-truss results; half total vehicle/deck loads. Numeric results unamplified.','# Config: '+JSON.stringify(p),'member,a,b,length_m,axial_force_N,stress_Pa,yield_utilization,euler_utilization'];
 if(result.ok)for(const m of result.members)lines.push([m.id,m.a,m.b,m.L,m.force,m.stress,m.yieldUtil,m.buckleUtil].join(','));
 lines.push('','node,x_m,y_m,ux_m,uy_m,applied_x_N,applied_y_N,reaction_x_N,reaction_y_N');if(result.ok)result.model.nodes.forEach((n,i)=>lines.push([i,n.x,n.y,result.u[2*i],result.u[2*i+1],result.F[2*i],result.F[2*i+1],result.reactions[2*i],result.reactions[2*i+1]].join(',')));
 lines.push('','time_seconds,midspan_vertical_mm');for(const s of history)lines.push(s.t.toFixed(4)+','+s.y);if(!result.ok)lines.push('# No stable solution.');download(lines.join('\n'),'kokalanov-results.csv','text/csv');
};

calculate();translate();
try{const {BridgeScene}=await import('./scene.mjs');scene=new BridgeScene($('#bridge-canvas'),pick);scene.rebuild(result,p);updateUI();}catch(e){
 console.info('Using the Canvas perspective renderer:',e.message);
 try{const old=$('#bridge-canvas'),fresh=old.cloneNode();old.replaceWith(fresh);const {CanvasBridgeScene}=await import('./software-scene.mjs');scene=new CanvasBridgeScene(fresh,pick);scene.rebuild(result,p);updateUI();}catch(f){console.warn('Canvas unavailable:',f.message);$('#fallback').hidden=false;$('#bridge-canvas').hidden=true;drawFallback();}
}
document.addEventListener('bridge-context-lost',()=>{running=false;vibrationAt=null;scene=null;$('#fallback').hidden=false;$('#bridge-canvas').hidden=true;drawFallback();updateUI();});
let frame=0;
function animate(ms){requestAnimationFrame(animate);const now=ms/1000;
 if(document.hidden)return;
 if(running){p.position=Math.min(1,runStartPosition+(now-runStarted)/12);if(p.position>=1){running=false;crossing=false;}if(now-lastSolve>.09||!running){lastSolve=now;calculate();$('#position').value=p.position*100;$('#position-value').textContent=num(p.position*100,0)+'%';}}
 const activeVibration=vibrationAt;let q=activeVibration!==null?modalOffset(result,now-activeVibration,{damping:p.damping}):0;
 if(result.ok){const tmid=p.panels/2,i=Math.floor(tmid),f=tmid-i,j=Math.min(i+1,p.panels),staticY=result.u[2*i+1]*(1-f)+result.u[2*j+1]*f,shape=result.mode[2*i+1]*(1-f)+result.mode[2*j+1]*f;
  if(activeVibration!==null){const end=Math.min(now,activeVibration+12);for(let st=Math.max(lastSample+.01,activeVibration);st<=end;st+=.01){history.push({t:st,y:(staticY+shape*modalOffset(result,st-activeVibration,{damping:p.damping}))*1000});lastSample=st;}}
  else if(now-lastSample>.095){lastSample=now;history.push({t:now,y:staticY*1000});}
  history=history.filter(s=>now-s.t<12.1);drawChart(now);
 }
 if(activeVibration!==null&&now-activeVibration>12){vibrationAt=null;updateUI();}
 if(++frame%2===0||innerWidth>800)scene?.render(now,q);
}
requestAnimationFrame(animate);
