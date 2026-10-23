(() => {
  const scenes = [
    {file:'01-title-v2',tone:'dark',x:50,m:50,chapter:'PROLOGUE / 00',tr:'Gecenin ötesinde bir hikâye başlıyor.',en:'A story begins beyond the night.'},
    {file:'02-wanderer',tone:'light',x:50,m:51,chapter:'I / 01',tr:'Issız bir dünyada yalnız bir gezgin yürür.',en:'A lone wanderer crosses a desolate world.'},
    {file:'03-saint',tone:'light',x:50,m:56,chapter:'I / 02',tr:'Yol, henüz adını bilmediği bir yere uzanır.',en:'The path leads somewhere he cannot yet name.'},
    {file:'04-sphere',tone:'light',x:50,m:69,chapter:'I / 03',tr:'Uzakta, beklenmedik bir şekil belirir.',en:'In the distance, an unexpected shape appears.'},
    {file:'05-steps',tone:'light',x:50,m:59,chapter:'I / 04',tr:'Her adım onu kırmızı geçide yaklaştırır.',en:'Every step draws him toward the red portal.'},
    {file:'06-portal',tone:'light',x:50,m:56,chapter:'II / 05',tr:'Geçit önünde durur. Ötesi görünmez.',en:'He stands before the portal. Beyond it is unknown.'},
    {file:'07-hand',tone:'red',x:50,m:63,chapter:'II / 06',tr:'Elini uzatıp geçide dokun.',en:'Reach out and touch the portal.',action:'portal',motion:'portal-loop'},
    {file:'08-enter',tone:'light',x:50,m:73,chapter:'II / 07',tr:'Bir dokunuşla başka bir dünyaya geçer.',en:'One touch leads into another world.'},
    {file:'09-cathedral',tone:'dark',x:50,m:52,chapter:'III / 08',tr:'Kızıl ışık, sessiz katedralin içini doldurur.',en:'Red light fills the silent cathedral.'},
    {file:'10-reveal',tone:'red',x:50,m:50,chapter:'III / 09',tr:'Uzakta üç renk ışıldar.',en:'Three colors glow in the distance.'},
    {file:'11-bottles',tone:'light',x:50,m:51,chapter:'III / 10',tr:'Üçünden birini seç.',en:'Choose one of the three.',action:'choose'},
    {file:'12-pour',tone:'red',x:50,m:46,chapter:'IV / 11',tr:'Bardağı doldurmak için basılı tut.',en:'Press and hold to fill the glass.',action:'pour',motion:'pour-loop'},
    {file:'13-eyes',tone:'dark',x:50,m:51,chapter:'IV / 12',tr:'İlk yudumdan sonra dünya değişir.',en:'After the first sip, the world changes.'},
    {file:'14-vortex',tone:'dark',x:50,m:50,chapter:'IV / 13',tr:'Işık ve mürekkep birbirine karışır.',en:'Light and ink swirl together.',motion:'vortex-loop'},
    {file:'15-break',tone:'red',x:50,m:53,chapter:'V / 14',tr:'Sütunlar yükselirken gökyüzü açılır.',en:'The sky opens as the columns rise.'},
    {file:'16-blue',tone:'light',x:50,m:58,chapter:'V / 15',tr:'Gecenin rengi artık bambaşkadır.',en:'The night has an entirely new color.'},
    {file:'17-spirit',tone:'red',x:50,m:50,chapter:'FINALE / 16',tr:'Anın içinde biraz daha kal.',en:'Stay a little longer in the moment.'},
    {file:'18-collection',tone:'red',x:50,m:50,chapter:'FINALE / 17',tr:'Geceyi yeniden yaşa.',en:'Live the night again.',action:'replay'}
  ];
  const $ = id => document.getElementById(id);
  const stage=$('stage'), current=$('art-current'), incoming=$('art-incoming'),motion=$('motion');
  const caption=$('caption'),chapter=$('chapter'),count=$('scene-count'),fill=$('timeline-fill'),interaction=$('interaction');
  const next=$('next'),previous=$('previous'),intro=$('intro');
  let index=0,lang=localStorage.getItem('notturno-lang')==='en'?'en':'tr',started=false,changing=false,flavor='orange';
  let holdTimer=null,holdStart=0,holdRaf=null,touchStart=null,wheelAt=0;
  const asset=i=>`./assets/${scenes[i].file}.webp`;
  const dict={
    tr:{enter:'DENEYİME BAŞLA',eyebrow:'BİR GECENİN BAŞLANGICI',hint:'Ekranı kaydırarak veya oklarla ilerle',edition:'ETKİLEŞİMLİ BİR HİKÂYE',nav:'KAYDIR / SCROLL',portal:'BASILI TUT & DOKUN',pour:'DÖKMEK İÇİN BASILI TUT',choose:'SEÇ VE DEVAM ET',replay:'BAŞTAN İZLE',info:'GÖRSEL ÇALIŞMA',infoCopy:'Videodaki çizgi roman sahne akışını telefon için yeniden kurgulayan etkileşimli bir çalışma.',prev:'Önceki sahne',next:'Sonraki sahne',close:'Kapat',original:'Original experience'},
    en:{enter:'ENTER THE EXPERIENCE',eyebrow:'THE NIGHT BEGINS',hint:'Swipe the screen or use the arrows',edition:'AN INTERACTIVE STORY',nav:'SWIPE / SCROLL',portal:'HOLD & TOUCH',pour:'HOLD TO POUR',choose:'CHOOSE & CONTINUE',replay:'EXPERIENCE AGAIN',info:'VISUAL STUDY',infoCopy:'An interactive mobile study of the comic-book sequence shown in the video.',prev:'Previous scene',next:'Next scene',close:'Close',original:'Original experience'}
  };
  function preload(i){ if(i<0||i>=scenes.length)return;const img=new Image();img.src=asset(i); }
  function translate(){
    const d=dict[lang];document.documentElement.lang=lang;
    $('language-label').textContent=lang==='tr'?'EN':'TR';
    $('language').setAttribute('aria-label',lang==='tr'?'Switch to English':'Türkçeye geç');
    $('enter-text').textContent=d.enter;$('intro-eyebrow').textContent=d.eyebrow;$('intro-hint').textContent=d.hint;
    $('edition').textContent=d.edition;$('navigation-hint').textContent=d.nav;
    $('previous').setAttribute('aria-label',d.prev);next.setAttribute('aria-label',d.next);
    $('close-dialog').setAttribute('aria-label',d.close);
    $('info-kicker').textContent=d.info;$('info-copy').textContent=d.infoCopy;
    paintCopy();
  }
  function paintCopy(){
    const s=scenes[index]; chapter.textContent=s.chapter;caption.textContent=s[lang];
    current.setAttribute('aria-label',s[lang]);
    $('stage').classList.toggle('stage--title',index===0);
    ['dark','light','red'].forEach(t=>stage.classList.toggle('stage--'+t,s.tone===t));
    const progress=((index+1)/scenes.length)*100;
    fill.style.width=progress+'%';count.innerHTML=String(index+1).padStart(2,'0')+` <span>/ ${scenes.length}</span>`;
    previous.disabled=index===0;next.disabled=index===scenes.length-1;
    paintAction();
    if(s.motion){
      const target=`./assets/${s.motion}.mp4`;
      if(!motion.src.endsWith(target.replace('./','/')))motion.src=target;
      motion.style.setProperty('--motion-focal',s.m+'%');
      const play=motion.play();if(play)play.then(()=>motion.classList.add('is-visible')).catch(()=>{});
    }else{motion.classList.remove('is-visible');motion.pause();}
  }
  function makeHold(label,type){
    const button=document.createElement('button');button.type='button';button.className='hold-button';
    button.innerHTML=`<span>${label}</span><span class="hold-icon">◎</span>`;
    const clear=()=>{clearTimeout(holdTimer);cancelAnimationFrame(holdRaf);button.classList.remove('is-holding');button.style.setProperty('--hold',0);holdTimer=null;};
    const update=()=>{button.style.setProperty('--hold',Math.min(1,(performance.now()-holdStart)/850));holdRaf=requestAnimationFrame(update);};
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);holdStart=performance.now();button.classList.add('is-holding');update();holdTimer=setTimeout(()=>{clear();button.style.setProperty('--hold',1);if(type==='portal'||type==='pour')go(index+1);},850);});
    button.addEventListener('pointerup',clear);button.addEventListener('pointercancel',clear);button.addEventListener('lostpointercapture',clear);
    interaction.append(button);
  }
  function paintAction(){
    interaction.replaceChildren();const action=scenes[index].action;
    interaction.classList.toggle('is-visible',Boolean(action));
    if(action==='portal'||action==='pour')makeHold(dict[lang][action],action);
    if(action==='choose'){
      const wrap=document.createElement('div');wrap.className='flavors';
      [['orange','#33bee8','ORANGE'],['mint','#6edc77','MINT'],['gold','#e7cb62','GOLD']].forEach(([value,color,label])=>{
        const b=document.createElement('button');b.type='button';b.className='flavor-button'+(flavor===value?' is-selected':'');b.style.setProperty('--bottle',color);b.textContent=label;
        b.setAttribute('aria-pressed',String(flavor===value));b.addEventListener('click',()=>{flavor=value;paintAction()});wrap.append(b);
      });
      interaction.append(wrap);
      const b=document.createElement('button');b.type='button';b.className='flavor-next';b.textContent=dict[lang].choose+'  ↗';b.addEventListener('click',()=>go(index+1));interaction.append(b);
    }
    if(action==='replay'){
      const b=document.createElement('button');b.type='button';b.className='flavor-next';b.textContent=dict[lang].replay+'  ↺';b.addEventListener('click',()=>go(0));interaction.append(b);
    }
  }
  function go(target){
    if(target<0||target>=scenes.length||changing||target===index)return;
    if(!started)start(false);
    changing=true;motion.classList.remove('is-visible');motion.pause();
    const s=scenes[target],url=target===17&&flavor==='mint'?'./assets/19-mint.webp':asset(target);
    incoming.style.backgroundImage=`url("${url}")`;
    incoming.style.setProperty('--focal',s.x+'%');incoming.style.setProperty('--mobile-focal',s.m+'%');
    stage.classList.add('is-changing');
    setTimeout(()=>{
      index=target;current.style.backgroundImage=`url("${url}")`;
      current.style.setProperty('--focal',s.x+'%');current.style.setProperty('--mobile-focal',s.m+'%');
      stage.classList.remove('is-changing');paintCopy();changing=false;preload(index+1);
    },640);
  }
  function start(advance=true){
    started=true;intro.classList.add('is-hidden');stage.classList.add('has-started');
    if(advance)setTimeout(()=>go(1),220);
  }
  current.style.backgroundImage=`url("${asset(0)}")`;current.style.setProperty('--focal','50%');current.style.setProperty('--mobile-focal','50%');
  $('enter').addEventListener('click',()=>start());
  $('language').addEventListener('click',()=>{lang=lang==='tr'?'en':'tr';localStorage.setItem('notturno-lang',lang);translate()});
  $('home-link').addEventListener('click',e=>{e.preventDefault();if(!started)start(false);go(0)});
  next.addEventListener('click',()=>go(index+1));previous.addEventListener('click',()=>go(index-1));
  $('menu-button').addEventListener('click',()=>$('info-dialog').showModal());
  $('close-dialog').addEventListener('click',()=>$('info-dialog').close());
  $('info-dialog').addEventListener('click',e=>{if(e.target.id==='info-dialog')e.target.close()});
  window.addEventListener('keydown',e=>{if($('info-dialog').open)return;if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();go(index+1)}if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(index-1)}});
  stage.addEventListener('wheel',e=>{if($('info-dialog').open)return;e.preventDefault();const now=performance.now();if(now-wheelAt<670)return;wheelAt=now;go(index+(e.deltaY>0?1:-1))},{passive:false});
  stage.addEventListener('touchstart',e=>{if(e.target.closest('button,a'))return;touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
  stage.addEventListener('touchend',e=>{if(!touchStart||e.target.closest('button,a')){touchStart=null;return}const dy=e.changedTouches[0].clientY-touchStart.y,dx=e.changedTouches[0].clientX-touchStart.x;if(Math.abs(dy)>45||Math.abs(dx)>65)go(index+((Math.abs(dy)>Math.abs(dx)?dy:dx)<0?1:-1));touchStart=null},{passive:true});
  stage.addEventListener('click',e=>{if(e.target.closest('button,a,.copy-box,.interaction'))return;if(started&&scenes[index].action!=='portal'&&scenes[index].action!=='pour')go(index+1)});
  preload(1);translate();
})();
