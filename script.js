// Poprawiony script.js - pewne przypięcie listenera reset po załadowaniu DOM,
// bez wczesnego pobierania elementu, defensywne sprawdzenia.

const candleData = [
  { id: 1, title: "Znicz #1 — Basic", img: "images/candle1.jpg", desc: "Prosty, tani znicz plastikowy — podstawowa opcja." },
  { id: 2, title: "Znicz #2 — Plastikowy", img: "images/candle2.jpg", desc: "Najczęściej spotykany w marketach, ekonomiczny plastik." },
  { id: 3, title: "Znicz #3 — Mały", img: "images/candle3.jpg", desc: "Mały, kompaktowy model — oszczędny i poręczny." },
  { id: 4, title: "Znicz #4 — Średni", img: "images/candle4.jpg", desc: "Standardowy rozmiar, nieco lepsze wykonanie." },
  { id: 5, title: "Znicz #5 — Zdobiony", img: "images/candle5.jpg", desc: "Znikoma dekoracja, metaliczne wykończenie." },
  { id: 6, title: "Znicz #6 — Z wieńcem", img: "images/candle6.jpg", desc: "Znicz z dodatkowymi zdobieniami i wieńcem." },
  { id: 7, title: "Znicz #7 — Szklany", img: "images/candle7.jpg", desc: "Szklany klosz, solidniejsze wykonanie." },
  { id: 8, title: "Znicz #8 — Duży", img: "images/candle8.jpg", desc: "Duży rozmiar, dłużej płonie." },
  { id: 9, title: "Znicz #9 — Luksusowy", img: "images/candle9.jpg", desc: "Bardziej elegancki design, lepsze materiały." },
  { id: 10, title: "Znicz #10 — Premium", img: "images/candle10.jpg", desc: "Najbardziej premium: zdobienia, grube szkło, długi czas palenia." },
];

let selectedSet = new Set();

// elementy DOM będą pobierane po DOMContentLoaded
let board, toast, confettiCanvas, ctx, progressCountEl, progressFillEl, progressPctEl;

function createTile(candle){
  const tile = document.createElement("div");
  tile.className = "tile";
  tile.setAttribute("data-id", candle.id);
  tile.setAttribute("role", "button");
  tile.setAttribute("tabindex", "0");
  tile.setAttribute("aria-pressed", "false");
  tile.setAttribute("aria-label", candle.title);

  const imgWrap = document.createElement("div");
  imgWrap.className = "img-wrap";

  const img = document.createElement("img");
  img.src = candle.img;
  img.alt = candle.title;
  img.onerror = function(){ this.style.opacity = 0.08; this.alt = "Brak obrazu"; };

  imgWrap.appendChild(img);
  tile.appendChild(imgWrap);

  const meta = document.createElement("div");
  meta.className = "meta";
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = candle.title;
  const rank = document.createElement("div");
  rank.className = "rank";
  rank.textContent = `#${candle.id}`;
  meta.appendChild(title);
  meta.appendChild(rank);
  tile.appendChild(meta);

  const desc = document.createElement("div");
  desc.className = "desc";
  desc.textContent = candle.desc || "";
  tile.appendChild(desc);

  const toggleHandler = () => {
    toggleSelect(candle.id, tile);
    const pressed = selectedSet.has(candle.id);
    tile.setAttribute("aria-pressed", pressed ? "true" : "false");
  };

  // kliknięcie na cały blok
  tile.addEventListener("click", (e) => {
    // nie blokujemy default dla zwykłego kliknięcia przycisku resetit (tu nie ma linków)
    toggleHandler();
  });

  // obsługa klawiatury (Enter / Space)
  tile.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleHandler();
    }
  });

  return tile;
}

function renderBoard(){
  if(!board) return;
  board.innerHTML = "";
  candleData.forEach(c => board.appendChild(createTile(c)));
}

function toggleSelect(id, tileEl){
  if(selectedSet.has(id)){
    selectedSet.delete(id);
    tileEl.classList.remove("selected");
  } else {
    selectedSet.add(id);
    tileEl.classList.add("selected");
  }
  persistSelection();
  updateProgressUI();
  checkBingo();
}

function checkBingo(){
  if(selectedSet.size === candleData.length && candleData.length > 0){
    showBingo();
  } else {
    hideBingo();
  }
}

function showBingo(){
  if(!toast) return;
  toast.hidden = false;
  toast.style.transform = "translateX(-50%) scale(0.98)";
  setTimeout(()=> toast.style.transform = "translateX(-50%) scale(1)", 50);
  launchConfetti();
  setTimeout(hideBingo, 6000);
}
function hideBingo(){
  if(toast) toast.hidden = true;
}

function persistSelection(){
  try{
    localStorage.setItem("selectedIds", JSON.stringify(Array.from(selectedSet)));
  }catch(e){
    console.warn("Błąd zapisu zaznaczeń", e);
  }
}

function loadState(){
  try{
    const sel = localStorage.getItem("selectedIds");
    if(sel){
      const arr = JSON.parse(sel);
      if(Array.isArray(arr)){
        selectedSet = new Set(arr.map(n => parseInt(n,10)).filter(n => Number.isInteger(n)));
      }
    }
  }catch(e){
    console.warn("Błąd wczytywania zaznaczeń", e);
  }
}

function resetProgress(){
  selectedSet.clear();
  persistSelection();
  document.querySelectorAll('.tile.selected').forEach(t => t.classList.remove('selected'));
  document.querySelectorAll('.tile').forEach(t => t.setAttribute('aria-pressed', 'false'));
  updateProgressUI();
  hideBingo();
}

function updateProgressUI(){
  if(!progressCountEl || !progressFillEl || !progressPctEl) return;
  const count = selectedSet.size;
  const total = candleData.length;
  const pct = Math.round((count / total) * 100);
  progressCountEl.textContent = count;
  progressFillEl.style.width = pct + "%";
  progressPctEl.textContent = pct + "%";
  const progressBar = document.querySelector(".progress");
  if(progressBar) progressBar.setAttribute("aria-valuenow", String(pct));
}

/* Confetti (bez zmian, z poprawnym skalowaniem) */
function resizeCanvas(){
  if(!ctx || !confettiCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  confettiCanvas.width = Math.floor(window.innerWidth * dpr);
  confettiCanvas.height = Math.floor(window.innerHeight * dpr);
  confettiCanvas.style.width = window.innerWidth + "px";
  confettiCanvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
let confettiPieces = [];
function launchConfetti(){
  if(!ctx) return;
  ctx.setTransform(1,0,0,1,0,0);
  resizeCanvas();
  confettiPieces = [];
  const count = 120;
  for(let i=0;i<count;i++){
    confettiPieces.push({
      x: Math.random()*window.innerWidth,
      y: -Math.random()*window.innerHeight,
      w: 6 + Math.random()*10,
      h: 6 + Math.random()*10,
      color: randomColor(),
      velX: -3 + Math.random()*6,
      velY: 2 + Math.random()*5,
      rot: Math.random()*360,
      rotSpeed: -5 + Math.random()*10,
      life: 160 + Math.random()*120
    });
  }
  requestAnimationFrame(confettiLoop);
}

function confettiLoop(){
  if(!ctx) return;
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  for(let i=confettiPieces.length-1;i>=0;i--){
    const p = confettiPieces[i];
    p.x += p.velX;
    p.y += p.velY;
    p.velY += 0.06;
    p.rot += p.rotSpeed;
    p.life--;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot * Math.PI / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    ctx.restore();
    if(p.y > window.innerHeight + 60 || p.life <= 0){
      confettiPieces.splice(i,1);
    }
  }
  if(confettiPieces.length > 0){
    requestAnimationFrame(confettiLoop);
  } else {
    ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  }
}

function randomColor(){
  const palette = ["#f59e0b","#ef4444","#10b981","#60a5fa","#a78bfa","#f472b6","#34d399"];
  return palette[Math.floor(Math.random()*palette.length)];
}

/* Inicjalizacja po DOMContentLoaded - zapewnia, że wszystkie elementy istnieją */
document.addEventListener('DOMContentLoaded', () => {
  // pobierz elementy
  board = document.getElementById("bingo-board");
  toast = document.getElementById("bingo-toast");
  confettiCanvas = document.getElementById("confetti-canvas");
  ctx = confettiCanvas && confettiCanvas.getContext ? confettiCanvas.getContext("2d") : null;
  progressCountEl = document.getElementById("progress-count");
  progressFillEl = document.getElementById("progress-fill");
  progressPctEl = document.getElementById("progress-pct");

  loadState();
  renderBoard();

  // odzwierciedl zaznaczenia w DOM
  document.querySelectorAll(".tile").forEach(tile=>{
    const id = parseInt(tile.getAttribute("data-id"),10);
    if(selectedSet.has(id)) tile.classList.add("selected");
    tile.setAttribute("aria-pressed", selectedSet.has(id) ? "true" : "false");
  });

  // resize canvas i listenery
  window.addEventListener("resize", () => { if(ctx) ctx.setTransform(1,0,0,1,0,0); resizeCanvas(); });
  resizeCanvas();

  updateProgressUI();
  checkBingo();

  // bezpieczne podpięcie reset button (element istnieje w DOM)
  const rb = document.getElementById('reset-btn');
  if(rb){
    rb.addEventListener('click', () => {
      if(confirm('Czy na pewno zresetować postęp?')) resetProgress();
    });
  } else {
    // debug: jeśli przycisku nie ma, wypisz do konsoli
    console.warn('Reset button not found in DOM (id="reset-btn").');
  }
});
