/* ===========================================================
   ÍNDICE — grade por ano, filtros, visor e tira de miniaturas.
   =========================================================== */

const indexGroups = document.getElementById('indexGroups');
let activeFilter = {type:'all', value:null};

function matchesFilter(p){
  if(activeFilter.type === 'all') return true;
  if(activeFilter.type === 'category'){
    /* um post com foto E vídeo aparece nas duas abas */
    if(activeFilter.value === 'video') return p.hasVideo;
    if(activeFilter.value === 'photo') return p.hasPhotos;
    return p.type === activeFilter.value;
  }
  if(activeFilter.type === 'tag') return p.tags.some(t => t.toLowerCase() === activeFilter.value.toLowerCase());
  return true;
}

const ICON_PLAY  = `<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 0.8L8 4.5L1.5 8.2V0.8Z" fill="white"/></svg>`;

function renderIndex(){
  indexGroups.innerHTML = '';
  const visible = ARCHIVE.filter(matchesFilter);

  const groups = {};
  visible.forEach(p => { (groups[p.year] ??= []).push(p); });

  const keys = Object.keys(groups).sort((a,b) => b - a);
  keys.forEach(k => groups[k].sort((a,b) => new Date(b.date) - new Date(a.date)));

  if(!keys.length){
    indexGroups.innerHTML = `<p class="index-empty">nenhuma entrada com esse filtro ainda.</p>`;
    return;
  }

  keys.forEach(k => {
    const section = document.createElement('section');
    section.className = 'year-section';
    section.innerHTML =
      `<div class="year-head"><span class="year-num">${k}</span>` +
      `<span class="year-num count-num">${groups[k].length}</span></div>`;

    const row = document.createElement('div');
    row.className = 'entry-grid';

    groups[k].forEach(p => {
      const el = document.createElement('div');
      el.className = 'entry';
      el.tabIndex = 0;

      /* selo: play pra vídeo, contagem pra galeria */
      let badge = '';
      if(p.hasVideo && p.photos.length){
        badge = `<span class="badge">${ICON_PLAY}<span>${p.photos.length}</span></span>`;
      } else if(p.hasVideo){
        badge = `<span class="badge only-icon">${ICON_PLAY}</span>`;
      } else if(p.photos.length > 1){
        badge = `<span class="badge">${p.photos.length}</span>`;
      }

      el.innerHTML = `
        <div class="thumb">
          ${badge}
          ${p.cover ? imgWithFallback(p.cover, p.title) : `<span class="ph">sua imagem aqui</span>`}
        </div>
        <div class="cap">
          <span class="ti">${p.title} — ${p.location || ''}</span>
          <span class="no">${catalogLabel(p)}</span>
        </div>`;

      el.addEventListener('click', () => openPhoto(p.id));
      el.addEventListener('keydown', e => { if(e.key === 'Enter') openPhoto(p.id); });
      row.appendChild(el);
    });

    section.appendChild(row);
    indexGroups.appendChild(section);
  });
}

/* ---------- FILTROS ---------- */
const navLinks = document.querySelectorAll('.nav-main > a[data-filter]');
function setActiveNav(el){
  navLinks.forEach(a => a.classList.remove('is-active'));
  document.querySelectorAll('.tags-dropdown a').forEach(a => a.classList.remove('is-active'));
  document.getElementById('tagsToggle').classList.remove('is-active');
  if(el) el.classList.add('is-active');
}
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const f = link.dataset.filter;
    if(f === 'all')           activeFilter = {type:'all', value:null};
    else if(f === 'videos')   activeFilter = {type:'category', value:'video'};
    else if(f === 'photos')   activeFilter = {type:'category', value:'photo'};
    else if(f === 'articles') activeFilter = {type:'tag', value:'Article'};
    setActiveNav(link);
    renderIndex();
  });
});

/* menu de tags — montado a partir das tags reais dos posts */
const EXCLUDED_TAGS = new Set(['motion','photo','short film','article']);
const uniqueTags = [...new Set(ARCHIVE.flatMap(p => p.tags))]
  .filter(t => !EXCLUDED_TAGS.has(t.toLowerCase()))
  .sort((a,b) => a.localeCompare(b,'pt'));

const tagsDropdown = document.getElementById('tagsDropdown');
const tagsToggle   = document.getElementById('tagsToggle');
const tagsMenu     = document.querySelector('.tags-menu');

uniqueTags.forEach(tag => {
  const a = document.createElement('a');
  a.setAttribute('role','button'); a.tabIndex = 0;
  a.textContent = tag;
  a.addEventListener('click', e => {
    e.stopPropagation();
    activeFilter = {type:'tag', value:tag};
    setActiveNav(null);
    a.classList.add('is-active');
    tagsToggle.classList.add('is-active');
    tagsMenu.classList.remove('open');
    renderIndex();
  });
  tagsDropdown.appendChild(a);
});
tagsToggle.addEventListener('click', e => { e.stopPropagation(); tagsMenu.classList.toggle('open'); });
document.addEventListener('click', () => tagsMenu.classList.remove('open'));

/* ---------- VISOR ---------- */
const photoView    = document.getElementById('photoView');
const photoFrame   = document.getElementById('photoFrame');
const capNo        = document.getElementById('capNo');
const capTitle     = document.getElementById('capTitle');
const capLoc       = document.getElementById('capLoc');
const capPos       = document.getElementById('capPos');
const postLink     = document.getElementById('postLink');
const filmstrip    = document.getElementById('filmstrip');
const filmstripRow = document.getElementById('filmstripRow');
const fsPrev       = document.getElementById('fsPrev');
const fsNext       = document.getElementById('fsNext');
const postNavRow  = document.querySelector('.post-nav-row');

const NAV_ORDER = ARCHIVE.slice().sort((a,b) => new Date(b.date) - new Date(a.date));
let currentId = null, galleryIndex = 0, closeTimer = null;

function stepGallery(dir){
  const p = byId(currentId);
  if(!p) return;
  const items = mediaItems(p);
  if(items.length < 2) return;
  galleryIndex = (galleryIndex + dir + items.length) % items.length;
  renderPhoto(currentId, true);
  const active = filmstrip.querySelector('.fs-thumb.is-active');
  if(active) active.scrollIntoView({block:'nearest', inline:'nearest', behavior:'smooth'});
}
fsPrev.addEventListener('click', () => stepGallery(-1));
fsNext.addEventListener('click', () => stepGallery(1));

function renderPhoto(id, keepIndex){
  const p = byId(id);
  if(!p) return;
  currentId = id;
  if(!keepIndex) galleryIndex = 0;

  photoFrame.className = 'frame';
  photoFrame.style.removeProperty('--vr');

  /* o visor trata vídeo e fotos como itens da mesma lista, então
     um post pode ter os dois e navegar entre eles na tira */
  const items = mediaItems(p);
  if(galleryIndex >= items.length) galleryIndex = 0;
  const item = items[galleryIndex];

  if(!item){
    photoFrame.classList.add('is-empty');
    photoFrame.style.setProperty('--vr', p.type === 'video' ? p.ratio.replace('/',' / ') : '4 / 5');
    photoFrame.innerHTML = `<span class="ph">${p.type === 'video' ? 'vídeo (YouTube/Vimeo)' : 'imagem'}</span>`;
  } else if(item.kind === 'video'){
    photoFrame.classList.add('is-video');
    photoFrame.style.setProperty('--vr', p.ratio.replace('/',' / '));
    photoFrame.innerHTML = `<iframe src="${embedURL(p.video)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${p.title}"></iframe>`;
  } else {
    photoFrame.innerHTML = `<img src="${item.src}" alt="${p.title}">`;
  }
  fitFrameBox();

  const hasGallery = items.length > 1;
  if(hasGallery){
    filmstrip.innerHTML = items.map((it,i) =>
      `<div class="fs-thumb ${it.kind === 'video' ? 'is-video-thumb' : ''} ${i===galleryIndex?'is-active':''}" data-i="${i}">` +
      (it.kind === 'video'
        ? `<img src="${it.thumb}" alt="vídeo"><span class="fs-play">${ICON_PLAY}</span>`
        : imgWithFallback(it.src, '')) +
      `</div>`).join('');
    filmstrip.querySelectorAll('.fs-thumb').forEach(fs => {
      fs.addEventListener('click', () => { galleryIndex = +fs.dataset.i; renderPhoto(id, true); });
    });
    fsPrev.hidden = false; fsNext.hidden = false;
    filmstripRow.classList.add('has-gallery');
  } else {
    filmstrip.innerHTML = '';
    fsPrev.hidden = true; fsNext.hidden = true;
    filmstripRow.classList.remove('has-gallery');
  }

  capNo.textContent = catalogLabel(p);
  capTitle.textContent = p.title;
  capLoc.textContent = `${p.location ? p.location + ' — ' : ''}${fullDate(p)}`;
  postLink.href = p.href || '#';
  postLink.hidden = !p.href;

  const idx = NAV_ORDER.findIndex(x => x.id === id);
  capPos.textContent = `${String(idx+1).padStart(2,'0')} / ${NAV_ORDER.length}`;

  history.replaceState(null, '', '#' + p.slug);
}

function openPhoto(id){
  clearTimeout(closeTimer);
  photoView.classList.remove('closing');
  photoView.classList.add('open');
  photoView.setAttribute('aria-hidden','false');
  renderPhoto(id);
  lockScroll();
  postNavRow.classList.add('show');
}
function closePhoto(){
  if(!photoView.classList.contains('open')) return;
  photoView.classList.add('closing');
  photoFrame.innerHTML = '';           /* corta o áudio do vídeo ao fechar */
  history.replaceState(null, '', location.pathname);
  closeTimer = setTimeout(() => {
    photoView.classList.remove('open','closing');
    photoView.setAttribute('aria-hidden','true');
    postNavRow.classList.remove('show');
    unlockScroll();
  }, 420);
}
function stepPhoto(dir){
  const idx = NAV_ORDER.findIndex(x => x.id === currentId);
  renderPhoto(NAV_ORDER[(idx + dir + NAV_ORDER.length) % NAV_ORDER.length].id);
}

let justSwiped = false;
document.querySelector('.photo-stage').addEventListener('click', e => {
  if(justSwiped){ justSwiped = false; return; }
  if(e.target.closest('.frame')) return;
  closePhoto();
});
document.getElementById('prevBtn').addEventListener('click', () => stepPhoto(-1));
document.getElementById('nextBtn').addEventListener('click', () => stepPhoto(1));

/* arrastar o dedo pra esquerda/direita também troca de foto —
   útil no mobile além dos botões pequenos embaixo */
(function(){
  const stage = document.querySelector('.photo-stage');
  let dragging = false, startX = 0, startY = 0, horizontal = null;
  stage.addEventListener('pointerdown', e => {
    dragging = true; horizontal = null; startX = e.clientX; startY = e.clientY;
  });
  stage.addEventListener('pointermove', e => {
    if(!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if(horizontal === null){
      if(Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      horizontal = Math.abs(dx) > Math.abs(dy);
    }
  });
  function endDrag(e){
    if(!dragging) return;
    dragging = false;
    if(horizontal){
      const dx = (e.clientX ?? startX) - startX;
      if(Math.abs(dx) >= 50){
        justSwiped = true;
        stepPhoto(dx < 0 ? 1 : -1);
      }
    }
    horizontal = null;
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
})();

/* ---------- TAMANHO DO VÍDEO/EMPTY NO VISOR ----------
   antes o CSS tentava height fixa + max-width + aspect-ratio ao
   mesmo tempo, e esses três valores entravam em conflito: o vídeo
   ficava mais largo que o espaço disponível, o navegador cortava a
   largura sem recalcular a altura, e o resultado saía com a
   proporção errada — o vídeo aparecia cortado/espremido dentro do
   player. aqui a proporção é calculada e aplicada em pixels, então
   ela sempre bate certo com o espaço disponível. */
function fitFrameBox(){
  const isVideoOrEmpty = photoFrame.classList.contains('is-video') || photoFrame.classList.contains('is-empty');
  if(!isVideoOrEmpty){ photoFrame.style.width = ''; photoFrame.style.height = ''; return; }
  const vr = photoFrame.style.getPropertyValue('--vr') || '16 / 9';
  const parts = vr.split('/').map(n => parseFloat(n));
  const ar = (parts[0] && parts[1]) ? parts[0] / parts[1] : 16/9;
  const cs = getComputedStyle(photoFrame);
  const maxW = parseFloat(cs.maxWidth)  || photoFrame.parentElement.clientWidth;
  const maxH = parseFloat(cs.maxHeight) || window.innerHeight * 0.7;
  let w = maxW, h = w / ar;
  if(h > maxH){ h = maxH; w = h * ar; }
  photoFrame.style.width = `${Math.round(w)}px`;
  photoFrame.style.height = `${Math.round(h)}px`;
}
window.addEventListener('resize', fitFrameBox);
window.addEventListener('orientationchange', fitFrameBox);

/* mede a altura real do topbar (varia conforme ele quebra linha
   no mobile) pra colocar o espaçamento certo abaixo dele, sem
   sobra de espaço vazio */
function syncTopbarHeight(){
  const h = document.querySelector('.topbar').offsetHeight;
  document.documentElement.style.setProperty('--topbar-h', h + 'px');
}
window.addEventListener('resize', syncTopbarHeight);
window.addEventListener('orientationchange', syncTopbarHeight);
syncTopbarHeight();

/* ---------- ABOUT ---------- */
const aboutPanel = document.getElementById('aboutPanel');
let aboutCloseTimer = null;
function openAbout(){
  clearTimeout(aboutCloseTimer);
  aboutPanel.classList.remove('closing');
  aboutPanel.classList.add('open');
  aboutPanel.setAttribute('aria-hidden','false');
  lockScroll();
}
function closeAbout(){
  if(!aboutPanel.classList.contains('open')) return;
  aboutPanel.classList.add('closing');
  aboutCloseTimer = setTimeout(() => {
    aboutPanel.classList.remove('open','closing');
    aboutPanel.setAttribute('aria-hidden','true');
    unlockScroll();
  }, 420);
}
document.getElementById('navAbout').addEventListener('click', openAbout);
document.getElementById('backFromAbout').addEventListener('click', e => { e.preventDefault(); closeAbout(); });
aboutPanel.addEventListener('click', e => { if(e.target === aboutPanel) closeAbout(); });

/* arrastar pra direita fecha o about */
(function(){
  let dragging = false, startX = 0, startY = 0, horizontal = null;
  aboutPanel.addEventListener('pointerdown', e => {
    if(e.target.closest('a')) return;
    dragging = true; horizontal = null; startX = e.clientX; startY = e.clientY;
  });
  aboutPanel.addEventListener('pointermove', e => {
    if(!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if(horizontal === null){
      if(Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if(!horizontal || dx < 0) return;
    aboutPanel.querySelector('.about-content').style.transform = `translateX(${dx * .5}px)`;
    aboutPanel.style.opacity = Math.max(.3, 1 - dx / 400);
  });
  function endDrag(e){
    if(!dragging) return;
    dragging = false;
    const dx = (e.clientX ?? startX) - startX;
    aboutPanel.querySelector('.about-content').style.transform = '';
    aboutPanel.style.opacity = '';
    if(horizontal && dx > 100) closeAbout();
    horizontal = null;
  }
  aboutPanel.addEventListener('pointerup', endDrag);
  aboutPanel.addEventListener('pointercancel', endDrag);
})();

document.getElementById('wordmark').addEventListener('click', () => { closePhoto(); closeAbout(); });

/* ---------- TECLADO ---------- */
document.addEventListener('keydown', e => {
  if(photoView.classList.contains('open')){
    if(e.key === 'ArrowRight') stepPhoto(1);
    if(e.key === 'ArrowLeft')  stepPhoto(-1);
    if(e.key === 'Escape')     closePhoto();
  }
  if(aboutPanel.classList.contains('open') && e.key === 'Escape') closeAbout();
});

/* ---------- SCROLL LOCK ---------- */
function lockScroll(){
  const sbw = window.innerWidth - document.documentElement.clientWidth;
  if(sbw > 0) document.body.style.paddingRight = sbw + 'px';
  document.body.style.overflow = 'hidden';
}
function unlockScroll(){
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

/* ---------- BOOT ---------- */
bindTheme(document.getElementById('themeToggle'));
renderIndex();

/* abre direto no post se a URL tiver #slug (link compartilhável) */
(function(){
  const slug = decodeURIComponent(location.hash.replace('#',''));
  const p = slug && bySlug(slug);
  if(p) openPhoto(p.id);
})();
