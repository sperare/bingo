// Zaktualizowany script.js (konfetti ustawione na wierzchu; per-round BINGO tylko)
// Wszystkie pobrania DOM wykonujemy w DOMContentLoaded.

const zniczItems = [
  { id: 1, title: "Znicz #1 — Bieda", img: "images/candle1.jpg", desc: "Czerwone lub żółte szkło i metalowa pokrywka - bieda aż nie piszczy" },
  { id: 2, title: "Znicz #2 — Starożytna Grecja", img: "images/candle2.jpg", desc: "Trochę polski cmentarz a trochę świątynia Delficka" },
  { id: 3, title: "Znicz #3 — Last Christmas", img: "images/candle3.gif", desc: "Choineczka albo żółty z barankiem - trochę nie ta pora ale jest eco" },
  { id: 4, title: "Znicz #4 — Klasyczny", img: "images/candle4.jpg", desc: "Klasyka - podstawka z plastiku, szklany korpus z plastikowymi wzorkami oraz pokrywka ,która nie pasuje" },
  { id: 5, title: "Znicz #5 — Poeta", img: "images/candle5.jpg", desc: "Trochę polotu i finezji w tym smutnym jak ... miejscu" },
  { id: 6, title: "Znicz #6 — Nekroelektro", img: "images/candle6.jpg", desc: "Wkład z czerownym światełkiem na baterie - powiew nowoczesności i elektrośmieci" },
  { id: 7, title: "Znicz #7 — Bozia", img: "images/candle7.jpg", desc: "Znicz z bozią, +5 do życia wiecznego" },
  { id: 8, title: "Znicz #8 — Glamour", img: "images/candle8.jpg", desc: "Srebro świecidełka, prosto z Home&You albo Pepco" },
  { id: 9, title: "Znicz #9 — Winda do nieba", img: "images/candle9.gif", desc: "Karta wyjścia z czyścca dla zmarłego, nobilitacja na ziemi" },
  { id: 10, title: "Znicz #10 — Król cyganów", img: "images/candle10.jpg", desc: "Don Wasyl wśród zniczy - zajmuje pół pomnika, wzbudza zazdrość w promieniu 3 alejek" },
];

const bonusItems = [
  { id: 1, title: "Naftalina", desc: "Old money is here hunny, futro z norek albo innego lisa - idealne na grobową rewię mody" },
  { id: 2, title: "Panterka", desc: "Nowoczesne podejście do grobbingowego fashion day" },
];

const slownaItems = [
  "I tak to już jest",
  "Patrz to już X lat",
  "A X to ile lat już nie żyje?",
  "O XY już byli",
  "O ten znicz to od X",
  "O jezu ale ci ten synek/córeczka wyrosła",
  "*osoba, którą widzisz tylko 1.11 co roku*",
  "*osoba, której nawet twój ojciec nie zna*"
];

let zniczBoard, bonusBoard, slownaBoard;
let zniczFill, bonusFill, slownaFill;
let zniczCountEl, bonusCountEl, slownaCountEl;
let summaryZ, summaryB, summaryS;
let resetBtn;
let toastContainer;
let confettiCanvasEl, confettiCtx;

const selected = { znicz: new Set(), bonus: new Set(), slowna: new Set() };

const STORAGE_KEYS = { znicz: 'selectedIds_znicz', bonus: 'selectedIds_bonus', slowna: 'selectedIds_slowna' };

// persistence helpers
function persistRound(round){ try{ localStorage.setItem(STORAGE_KEYS[round], JSON.stringify(Array.from(selected[round]))); }catch(e){console.warn(e);} }
function loadRound(round){ try{ const raw = localStorage.getItem(STORAGE_KEYS[round]); if(raw){ const arr = JSON.parse(raw); if(Array.isArray(arr)) selected[round] = new Set(arr.map(n=>parseInt(n,10)).filter(Number.isInteger)); } }catch(e){console.warn(e);} }

// UI
function updateProgressUI(){
  const znCount = selected.znicz.size, znTotal = zniczItems.length, znPct = Math.round((znCount/znTotal)*100);
  const bCount = selected.bonus.size, bTotal = bonusItems.length, bPct = Math.round((bCount/bTotal)*100);
  const sCount = selected.slowna.size, sTotal = slownaItems.length, sPct = Math.round((sCount/sTotal)*100);

  if(zniczCountEl) zniczCountEl.textContent = znCount;
  if(zniczFill) zniczFill.style.width = znPct + '%';
  const znPctEl = document.getElementById('znicz-pct'); if(znPctEl) znPctEl.textContent = znPct + '%';

  if(bonusCountEl) bonusCountEl.textContent = bCount;
  if(bonusFill) bonusFill.style.width = bPct + '%';
  const bPctEl = document.getElementById('bonus-pct'); if(bPctEl) bPctEl.textContent = bPct + '%';

  if(slownaCountEl) slownaCountEl.textContent = sCount;
  if(slownaFill) slownaFill.style.width = sPct + '%';
  const sPctEl = document.getElementById('slowna-pct'); if(sPctEl) sPctEl.textContent = sPct + '%';

  if(summaryZ) summaryZ.textContent = `${znCount} / ${znTotal}`;
  if(summaryB) summaryB.textContent = `${bCount} / ${bTotal}`;
  if(summaryS) summaryS.textContent = `${sCount} / ${sTotal}`;
}

// toasts
function showToast(text, opts = {}) {
  if(!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  if(opts.color) toast.style.border = `2px solid ${opts.color}`;
  toast.textContent = text;
  toastContainer.appendChild(toast);
  setTimeout(()=>{ toast.classList.add('fade'); setTimeout(()=> toast.remove(), 300); }, opts.duration || 5000);
}

// confetti
function resizeCanvas(){ if(!confettiCanvasEl || !confettiCtx) return; const dpr = window.devicePixelRatio||1; confettiCanvasEl.width = Math.floor(window.innerWidth * dpr); confettiCanvasEl.height = Math.floor(window.innerHeight * dpr); confettiCanvasEl.style.width = window.innerWidth + 'px'; confettiCanvasEl.style.height = window.innerHeight + 'px'; confettiCtx.setTransform(dpr,0,0,dpr,0,0); }
let confettiPieces = [];
function launchConfettiImmediate(){
  if(!confettiCtx) return;
  confettiCtx.setTransform(1,0,0,1,0,0);
  resizeCanvas();
  confettiPieces = [];
  const colors = ['#f59e0b','#ef4444','#10b981','#60a5fa','#a78bfa','#f472b6','#34d399'];
  const count = 90;
  for(let i=0;i<count;i++){
    confettiPieces.push({
      x: Math.random()*window.innerWidth,
      y: -Math.random()*window.innerHeight,
      w: 6 + Math.random()*10,
      h: 6 + Math.random()*10,
      color: colors[Math.floor(Math.random()*colors.length)],
      velX: -3 + Math.random()*6,
      velY: 2 + Math.random()*6,
      rot: Math.random()*360,
      rotSpeed: -5 + Math.random()*10,
      life: 80 + Math.random()*120
    });
  }
  requestAnimationFrame(confettiLoop);
}
function confettiLoop(){
  if(!confettiCtx) return;
  confettiCtx.clearRect(0,0,confettiCanvasEl.width,confettiCanvasEl.height);
  for(let i=confettiPieces.length-1;i>=0;i--){
    const p = confettiPieces[i];
    p.x += p.velX; p.y += p.velY; p.velY += 0.06; p.rot += p.rotSpeed; p.life--;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot * Math.PI / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    confettiCtx.restore();
    if(p.y > window.innerHeight + 60 || p.life <= 0) confettiPieces.splice(i,1);
  }
  if(confettiPieces.length > 0) requestAnimationFrame(confettiLoop);
  else if(confettiCtx) confettiCtx.clearRect(0,0,confettiCanvasEl.width,confettiCanvasEl.height);
}

// tile creators
function createZniczTile(item){
  const tile = document.createElement('div');
  tile.className = 'tile znicz';
  tile.setAttribute('data-id', item.id);
  tile.setAttribute('role','button');
  tile.setAttribute('tabindex','0');

  const imgWrap = document.createElement('div'); imgWrap.className = 'img';
  const img = document.createElement('img'); img.src = item.img; img.alt = item.title;
  img.style.width='100%'; img.style.height='120px'; img.style.objectFit='cover';
  img.onerror = ()=> img.style.opacity = 0.08;
  imgWrap.appendChild(img);

  const title = document.createElement('div'); title.className='title'; title.textContent = item.title;
  const desc = document.createElement('div'); desc.className='desc'; desc.textContent = item.desc || '';

  tile.appendChild(imgWrap); tile.appendChild(title); tile.appendChild(desc);

  const toggle = ()=> {
    const id = item.id;
    if(selected.znicz.has(id)){ selected.znicz.delete(id); tile.classList.remove('selected'); }
    else { selected.znicz.add(id); tile.classList.add('selected'); }
    persistRound('znicz'); updateProgressUI(); checkBingo('znicz');
  };
  tile.addEventListener('click', toggle);
  tile.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(); }});
  return tile;
}
function createBonusTile(item){
  const tile = document.createElement('div'); tile.className='tile bonus';
  tile.setAttribute('data-id', item.id); tile.setAttribute('role','button'); tile.setAttribute('tabindex','0');
  const title = document.createElement('div'); title.className='title'; title.textContent = item.title;
  const desc = document.createElement('div'); desc.className='desc'; desc.textContent = item.desc;
  tile.appendChild(title); tile.appendChild(desc);
  const toggle = ()=> {
    const id = item.id;
    if(selected.bonus.has(id)){ selected.bonus.delete(id); tile.classList.remove('selected'); }
    else { selected.bonus.add(id); tile.classList.add('selected'); }
    persistRound('bonus'); updateProgressUI(); checkBingo('bonus');
  };
  tile.addEventListener('click', toggle);
  tile.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(); }});
  return tile;
}
function createSlownaTile(text, idx){
  const id = idx + 1;
  const tile = document.createElement('div'); tile.className='tile text slowna';
  tile.setAttribute('data-id', id); tile.setAttribute('role','button'); tile.setAttribute('tabindex','0');
  const title = document.createElement('div'); title.className='title'; title.textContent = text;
  title.style.fontSize='1.05rem'; title.style.lineHeight='1.2';
  tile.appendChild(title);
  const toggle = ()=> {
    if(selected.slowna.has(id)){ selected.slowna.delete(id); tile.classList.remove('selected'); }
    else { selected.slowna.add(id); tile.classList.add('selected'); }
    persistRound('slowna'); updateProgressUI(); checkBingo('slowna');
  };
  tile.addEventListener('click', toggle);
  tile.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(); }});
  return tile;
}

// per-round bingo only (no combo/trio)
function checkBingo(round){
  if(round === 'znicz' && selected.znicz.size === zniczItems.length){
    showToast('BINGO! (Runda zniczowa)', { color: '#16a34a' });
    launchConfettiImmediate();
  }
  if(round === 'bonus' && selected.bonus.size === bonusItems.length){
    showToast('BINGO! (Runda bonusowa)', { color: '#f59e0b' });
    launchConfettiImmediate();
  }
  if(round === 'slowna' && selected.slowna.size === slownaItems.length){
    showToast('BINGO! (Runda słowna)', { color: '#7c3aed' });
    launchConfettiImmediate();
  }
}

// reset
function resetAll(){
  if(!confirm('Czy na pewno zresetować cały postęp?')) return;
  selected.znicz.clear(); selected.bonus.clear(); selected.slowna.clear();
  persistRound('znicz'); persistRound('bonus'); persistRound('slowna');
  document.querySelectorAll('.tile.selected').forEach(t=>t.classList.remove('selected'));
  updateProgressUI();
  showToast('Postęp zresetowany', { duration: 2200 });
}

// init safely
document.addEventListener('DOMContentLoaded', () => {
  // refs
  zniczBoard = document.getElementById('znicz-board');
  bonusBoard = document.getElementById('bonus-board');
  slownaBoard = document.getElementById('slowna-board');

  zniczFill = document.getElementById('znicz-fill');
  bonusFill = document.getElementById('bonus-fill');
  slownaFill = document.getElementById('slowna-fill');

  zniczCountEl = document.getElementById('znicz-count');
  bonusCountEl = document.getElementById('bonus-count');
  slownaCountEl = document.getElementById('slowna-count');

  summaryZ = document.getElementById('summary-znicz');
  summaryB = document.getElementById('summary-bonus');
  summaryS = document.getElementById('summary-slowna');

  resetBtn = document.getElementById('reset-btn');
  toastContainer = document.getElementById('toast-container');

  // confetti canvas
  const conf = document.getElementById('confetti-canvas');
  if(conf){
    confettiCanvasEl = conf;
    confettiCtx = conf.getContext && conf.getContext('2d');
    // ensure canvas is top layer (z-index set in CSS). Also ensure it's a direct child of body
    if(conf.parentElement !== document.body) document.body.appendChild(conf);
    resizeCanvas();
    window.addEventListener('resize', ()=>{ if(confettiCtx) confettiCtx.setTransform(1,0,0,1,0,0); resizeCanvas(); });
  } else {
    console.warn('confetti canvas not found');
  }

  // load
  loadRound('znicz'); loadRound('bonus'); loadRound('slowna');

  // render boards
  zniczItems.forEach(it => {
    const t = createZniczTile(it);
    if(selected.znicz.has(it.id)) t.classList.add('selected','znicz');
    zniczBoard && zniczBoard.appendChild(t);
  });

  bonusItems.forEach(it => {
    const t = createBonusTile(it);
    if(selected.bonus.has(it.id)) t.classList.add('selected','bonus');
    bonusBoard && bonusBoard.appendChild(t);
  });

  slownaItems.forEach((txt, idx) => {
    const t = createSlownaTile(txt, idx);
    const id = idx + 1;
    if(selected.slowna.has(id)) t.classList.add('selected','slowna');
    slownaBoard && slownaBoard.appendChild(t);
  });

  if(resetBtn) resetBtn.addEventListener('click', resetAll);

  updateProgressUI();
});