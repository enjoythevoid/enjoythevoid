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
      `<div class="year-head"><div class="year-head-inner"><span class="year-num">${k}</span>` +
      `<span class="year-num count-num">${groups[k].length}</span></div></div>`;

    const row = document.createElement('div');
    row.className = 'entry-grid';

    groups[k].forEach(p => {
      const el = document.createElement('div');
      el.className = 'entry';
      el.tabIndex = 0;

      /* selo: play pra vídeo, contagem pra galeria */
      let badge = '';
      const nMedia = p.photos.length + p.videos.length;
      if(p.hasVideo && nMedia > 1){
        badge = `<span class="badge">${ICON_PLAY}<span>${nMedia}</span></span>`;
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
  if(typeof etvSweepImages === 'function') etvSweepImages(indexGroups);
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
const swipeHint = document.getElementById('swipeHint');
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

  if(typeof window.resetPhotoZoom === 'function') window.resetPhotoZoom();

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
    /* o toque em cima do <iframe> fica "preso" lá dentro — ele é uma
       janela separada, então o gesto de arrastar nunca chega a virar
       um pointermove/pointerup no resto da página, a menos que a
       gente cubra aquela área com algo nosso.
       · YouTube: o próprio etvVideoHTML já inclui uma camada
         (.etv-hit) cobrindo o vídeo inteiro, ligada à IFrame API —
         arrastar em qualquer parte troca de foto, tocar sem arrastar
         dá play/pause. Não precisa de nada extra aqui.
       · Adobe: SEM API pública pra controlar o play por fora. Se o
         autoplay falhar (comum no celular), a pessoa precisa poder
         tocar direto no play nativo da Adobe — por isso NÃO cobrimos
         o vídeo inteiro aqui; só faixas curtas nas bordas (a parte de
         cima) pro arrasto, deixando o resto (controles nativos)
         livre pra receber toque direto.
       · Vimeo: usa nossa capa própria (sem controles nativos por
         cima antes do play), então usa a faixa inteira normal. */
    const kind = item.video && item.video.kind;
    let extraEdges = '';
    if(kind === 'adobe'){
      extraEdges = `<div class="swipe-edge swipe-edge-short swipe-edge-left"></div><div class="swipe-edge swipe-edge-short swipe-edge-right"></div>`;
    } else if(kind !== 'youtube'){
      extraEdges = `<div class="swipe-edge swipe-edge-left"></div><div class="swipe-edge swipe-edge-right"></div>`;
    }
    photoFrame.innerHTML = etvVideoHTML(item, {swipe: kind !== 'youtube' && kind !== 'adobe', thumb:item.thumb}) + extraEdges;
  } else {
    photoFrame.innerHTML = `<img src="${item.src}" data-fade alt="${p.title}">`;
  }
  if(typeof etvUpgradeVideos === 'function') etvUpgradeVideos(photoFrame);
  if(typeof etvSweepImages   === 'function') etvSweepImages(photoFrame);

  const hasGallery = items.length > 1;
  if(hasGallery){
    filmstrip.innerHTML = items.map((it,i) =>
      `<div class="fs-thumb ${it.kind === 'video' ? 'is-video-thumb' : ''} ${i===galleryIndex?'is-active':''}" data-i="${i}">` +
      (it.kind === 'video'
        ? `<img src="${it.thumb}" data-fade alt="vídeo"><span class="fs-play">${ICON_PLAY}</span>`
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
  /* só agora, com filmstrip/legenda já no lugar final, é que a
     altura disponível pro .frame está definitiva — medir antes
     disso (como acontecia antes) podia pegar um número que ainda
     ia mudar quando a tira de miniaturas aparecesse/sumisse. */
  fitFrameBoxSettled();
}

function openPhoto(id){
  clearTimeout(closeTimer);
  photoView.classList.remove('closing');
  photoView.classList.add('open');
  photoView.setAttribute('aria-hidden','false');
  renderPhoto(id);
  lockScroll();
  postNavRow.classList.add('show');
  showSwipeHint();
}
let swipeHintTimer = null;
let swipeHintShown = false;
/* dica "swipe to browse" — só no mobile, aparece com fade só na
   primeira vez que o visor abre nessa visita ao site, e some sozinha
   depois de alguns segundos. só volta a aparecer se a pessoa
   atualizar a página.

   a posição É CALCULADA a partir do retângulo real da moldura
   (.frame) — não um percentual fixo do espaço do visor. isso importa
   porque foto e vídeo têm proporções bem diferentes (uma foto vertical
   ocupa quase toda a altura disponível; um vídeo 16:9 ocupa bem menos,
   sobrando muito mais espaço vazio ao redor) — um percentual fixo do
   espaço TOTAL colocava a dica em lugares bem diferentes dependendo
   da mídia. Medindo a moldura de verdade, a dica sempre fica a uma
   distância fixa (24px) abaixo da foto/vídeo, não importa o formato. */
function positionSwipeHint(){
  if(!swipeHint) return;
  const stage = photoFrame.parentElement; // .photo-stage — mesmo elemento que serve de referência (position:relative) pro position:absolute da dica
  if(!stage) return;
  const frameRect = photoFrame.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  swipeHint.style.top = `${Math.round(frameRect.bottom - stageRect.top + 24)}px`;
}
function showSwipeHint(){
  if(!swipeHint || swipeHintShown) return;
  swipeHintShown = true;
  clearTimeout(swipeHintTimer);
  positionSwipeHint();
  /* a moldura pode ainda não estar 100% assentada no instante em que
     abrimos. pra vídeo (dimensionado em JS) um par de frames já
     resolve. pra foto, o tamanho real só é conhecido depois que a
     imagem termina de carregar (a intrínseca é o que define o
     max-width/max-height em CSS) — sem esperar o 'load' dela, media
     antes da hora e a dica saía do lugar. */
  requestAnimationFrame(() => requestAnimationFrame(positionSwipeHint));
  const img = photoFrame.querySelector('img');
  if(img && !img.complete) img.addEventListener('load', positionSwipeHint, {once:true});
  swipeHint.classList.add('show');
  swipeHintTimer = setTimeout(() => swipeHint.classList.remove('show'), 2200);
}
window.addEventListener('resize', positionSwipeHint);
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
/* área segura: a tira de miniaturas (setas < >, cada foto pequena, e
   os espaços em branco entre elas) nunca fecha o visor, mesmo que a
   pessoa erre o dedo tentando tocar numa miniatura específica —
   nesse caso o toque simplesmente não faz nada, em vez de sair da
   pré-visualização sem querer. */
filmstripRow.addEventListener('click', e => e.stopPropagation());
document.getElementById('prevBtn').addEventListener('click', () => stepPhoto(-1));
document.getElementById('nextBtn').addEventListener('click', () => stepPhoto(1));
document.getElementById('photoClose').addEventListener('click', closePhoto);

/* arrastar o dedo pra esquerda/direita também troca de foto — útil
   no mobile além dos botões pequenos embaixo. junto com isso: dar
   zoom com pinça numa foto, arrastar com zoom dá pan (move a
   imagem em vez de trocar), e duplo toque alterna zoom rápido. */
(function(){
  const stage = document.querySelector('.photo-stage');
  const pointers = new Map(); // pointerId -> {x,y}
  let dragging = false, startX = 0, startY = 0, horizontal = null;
  let pinching = false, pinchStartDist = 1, pinchStartScale = 1;
  let scale = 1, panX = 0, panY = 0, panStartX = 0, panStartY = 0;
  let lastTapTime = 0;

  function activeImg(){
    return photoFrame.classList.contains('is-video') ? null : photoFrame.querySelector('img');
  }
  /* quando dá zoom (scale>1), a legenda/miniaturas/navegação somem e
     a foto passa a ocupar a tela inteira, de ponta a ponta — sem
     isso, a foto ampliada ficava presa dentro da moldurinha pequena
     de sempre, cortada pelo overflow:hidden do .photo-stage, com a
     legenda e a barra de navegação ainda visíveis do lado. */
  function syncZoomChrome(){
    photoView.classList.toggle('is-zoomed', scale > 1.02);
  }
  function applyTransform(){
    const img = activeImg();
    if(img) img.style.transform = `translate(${panX}px,${panY}px) scale(${scale})`;
    syncZoomChrome();
  }
  /* chamada de fora (renderPhoto) sempre que troca de mídia, pra
     não carregar o zoom de uma foto pra outra */
  function resetZoom(){
    scale = 1; panX = 0; panY = 0;
    const img = activeImg();
    if(img) img.style.transform = '';
    syncZoomChrome();
  }
  window.resetPhotoZoom = resetZoom;

  stage.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });

    if(pointers.size === 2){
      pinching = true; dragging = false;
      const pts = [...pointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      pinchStartScale = scale;
      return;
    }

    if(pointers.size === 1 && !pinching){
      dragging = true; horizontal = null;
      startX = e.clientX; startY = e.clientY;
      panStartX = panX; panStartY = panY;

      const now = Date.now();
      if(now - lastTapTime < 300 && activeImg()){
        scale = scale > 1 ? 1 : 2.5;
        panX = 0; panY = 0;
        applyTransform();
      }
      lastTapTime = now;
    }
  });

  stage.addEventListener('pointermove', e => {
    if(!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });

    if(pinching && pointers.size === 2){
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      scale = Math.min(8, Math.max(1, pinchStartScale * (dist / pinchStartDist)));
      applyTransform();
      return;
    }

    if(!dragging || pointers.size !== 1) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;

    if(scale > 1){
      /* já tá com zoom: arrastar move a foto em vez de trocar */
      panX = panStartX + dx; panY = panStartY + dy;
      applyTransform();
      return;
    }

    if(horizontal === null){
      if(Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      horizontal = Math.abs(dx) > Math.abs(dy);
    }
  });

  function endDrag(e){
    pointers.delete(e.pointerId);
    if(pointers.size < 2) pinching = false;
    if(pointers.size > 0) return;

    if(scale <= 1 && dragging && horizontal){
      const dx = (e.clientX ?? startX) - startX;
      if(Math.abs(dx) >= 50){
        justSwiped = true;
        /* depois de um arrasto de verdade o navegador normalmente
           NÃO dispara um clique — então essa trava nunca era
           "consumida" e ficava presa ligada, engolindo o próximo
           toque de fechar (bem depois, sem relação nenhuma com esse
           arrasto), exigindo um segundo toque pra fechar. Ela se
           desliga sozinha logo em seguida em vez de ficar esperando
           um clique que talvez nunca aconteça. */
        setTimeout(() => { justSwiped = false; }, 400);
        stepPhoto(dx < 0 ? 1 : -1);
      }
    }
    dragging = false; horizontal = null;
    if(scale <= 1.02) resetZoom();
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
   player.

   tentei depois trocar tudo pra CSS puro (aspect-ratio, igual já
   funcionava pras fotos) — mas o <div> do vídeo é posicionado
   absoluto (position:absolute) e por isso NÃO empurra tamanho
   nenhum pro .frame pai, diferente da <img> que tem tamanho
   intrínseco próprio. Sem JS medindo, o .frame colapsava pra 0×0.
   voltou pro cálculo em JS, mas corrigindo a causa real do
   descentramento no mobile: window.innerHeight é uma FOTO fixa do
   momento em que roda, e no celular a altura real da tela MUDA
   (a barra de endereço do navegador aparece/some, mudando quanto
   espaço existe) — se o cálculo já rodou antes disso, ele fica
   desatualizado e o vídeo aparece fora do centro. window.visualViewport
   é a API que acompanha essa mudança em tempo real; usamos ela
   quando disponível, e recalculamos de novo com um pequeno atraso
   depois de abrir o visor pra pegar o estado já assentado da tela. */
function fitFrameBox(){
  const isVideoOrEmpty = photoFrame.classList.contains('is-video') || photoFrame.classList.contains('is-empty');
  if(!isVideoOrEmpty){ photoFrame.style.width = ''; photoFrame.style.height = ''; return; }
  const vr = photoFrame.style.getPropertyValue('--vr') || '16 / 9';
  const parts = vr.split('/').map(n => parseFloat(n));
  const ar = (parts[0] && parts[1]) ? parts[0] / parts[1] : 16/9;

  const vv = window.visualViewport;
  const viewportW = vv ? vv.width  : window.innerWidth;
  const viewportH = vv ? vv.height : window.innerHeight;

  const isMobile = viewportW <= 640;
  const maxW = isMobile ? viewportW * 0.92 : Math.min(viewportW * 0.84, 980);
  // usa a altura real que sobra dentro do .photo-stage (o pai do frame)
  // em vez de uma fração de altura chutada — senão o vídeo pode
  // estourar o espaço disponível do mesmo jeito que a foto estourava.
  const stage = photoFrame.parentElement;
  const maxH = stage ? stage.clientHeight : (isMobile ? viewportH * 0.56 : Math.min(viewportH * 0.70, 700));

  let w = maxW, h = w / ar;
  if(h > maxH){ h = maxH; w = h * ar; }
  photoFrame.style.width = `${Math.round(w)}px`;
  photoFrame.style.height = `${Math.round(h)}px`;
}
window.addEventListener('resize', fitFrameBox);
/* acompanha a barra de endereço do mobile mudando de tamanho ao
   vivo (rolagem, teclado abrindo/fechando) — window.resize sozinho
   não cobre isso em todos os navegadores */
if(window.visualViewport) window.visualViewport.addEventListener('resize', fitFrameBox);
/* o valor de stage.clientHeight logo após abrir o visor pode ainda
   não estar 100% assentado (transições, barra de endereço mobile
   recolhendo) — um recálculo curto depois garante o número final */
function fitFrameBoxSettled(){
  fitFrameBox();
  requestAnimationFrame(() => requestAnimationFrame(fitFrameBox));
  setTimeout(fitFrameBox, 250);
}
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
