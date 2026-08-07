/* ===========================================================
   PLAYER — player de vídeo próprio, sem a interface do YouTube.

   Como funciona:
   · antes do play, mostra só a capa + um botão de play central
     (o iframe do YouTube nem carrega ainda — site abre mais leve).
   · ao dar play, o vídeo roda com controls=0: nenhum ícone,
     título, logo ou "vídeos relacionados" do YouTube aparece.
   · por cima entra uma barra mínima nossa (play/pause, tempo,
     tela cheia) + uma linha de progresso bem fina colada embaixo.
   · enquanto o vídeo toca, a barra some sozinha pra não atrapalhar;
     volta ao mexer o mouse / tocar na tela.

   Obs. sobre QUALIDADE: o YouTube removeu o controle manual de
   qualidade dos players embutidos — setPlaybackQuality virou no-op
   e a escolha é automática (depende da banda e do TAMANHO do player
   na tela). Por isso não existe mais um "seletor de qualidade" que
   funcione de fora; deixar o player grande é o que puxa a resolução
   pra cima. A engrenagem some junto com o resto da interface deles.
   =========================================================== */
(function(){

  /* ---- carrega a IFrame API do YouTube uma única vez ---- */
  const YT_READY = new Promise(resolve => {
    if(window.YT && window.YT.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function(){
      if(typeof prev === 'function'){ try{ prev(); }catch(e){} }
      resolve(window.YT);
    };
    if(!document.getElementById('yt-iframe-api')){
      const s = document.createElement('script');
      s.id  = 'yt-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });

  const SVG_BIG   = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
  const SVG_PLAY  = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
  const SVG_PAUSE = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg>`;
  const SVG_FS    = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;

  function fmt(t){
    t = Math.max(0, Math.floor(t || 0));
    const m = Math.floor(t / 60), s = t % 60;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  /* ---- HTML da capa (facade). item pode ser {kind,id} ou {video:{...}} ----
     opts: { thumb, swipe }  swipe=true deixa as bordas livres pro
     gesto de trocar de foto no visor. --- */
  window.etvVideoHTML = function(item, opts){
    opts = opts || {};
    const v = (item && item.video) ? item.video : item;
    if(!v || !v.kind) return '';
    const thumb = opts.thumb ||
      (v.kind === 'youtube' ? `https://img.youtube.com/vi/${v.id}/hqdefault.jpg` : '');
    const bg = thumb ? ` style="background-image:url('${thumb.replace(/'/g,"%27")}')"` : '';
    return `<div class="etv-video" data-kind="${v.kind}" data-id="${v.id}"${opts.swipe ? ' data-swipe="1"' : ''}>`
      + `<div class="etv-poster"${bg}><button class="etv-bigplay" type="button" aria-label="reproduzir">${SVG_BIG}</button></div>`
      + `</div>`;
  };

  /* ---- liga os facades que ainda não foram ligados ---- */
  window.etvUpgradeVideos = function(root){
    (root || document).querySelectorAll('.etv-video:not([data-ready])').forEach(box => {
      box.setAttribute('data-ready','1');
      const poster = box.querySelector('.etv-poster');
      if(!poster) return;
      const start = () => { poster.removeEventListener('click', start); mount(box); };
      poster.addEventListener('click', start);
    });
  };

  function mount(box){
    const poster = box.querySelector('.etv-poster');
    if(poster){ poster.classList.add('is-hidden'); setTimeout(() => poster.remove(), 400); }
    if(box.dataset.kind === 'youtube') mountYouTube(box, box.dataset.id);
    else mountVimeo(box, box.dataset.id);
  }

  /* =============== YOUTUBE (player próprio completo) =============== */
  function mountYouTube(box, id){
    /* a IFrame API SUBSTITUI o elemento passado por um <iframe> e a
       classe se perde no caminho — por isso usamos um contêiner
       .etv-frame (esse fica) com um filho vazio que a API troca pelo
       iframe de verdade. o dimensionamento vive no contêiner. */
    const frame = document.createElement('div');
    frame.className = 'etv-frame';
    const host = document.createElement('div');
    frame.appendChild(host);
    box.appendChild(frame);

    const hit = document.createElement('div');     // camada de clique (play/pause)
    hit.className = 'etv-hit';
    box.appendChild(hit);

    const ui = buildUI(box);                        // barra + progresso

    YT_READY.then(YT => {
      const player = new YT.Player(host, {
        videoId: id,
        playerVars: {
          autoplay: 1, controls: 0, rel: 0, modestbranding: 1,
          iv_load_policy: 3, playsinline: 1, fs: 0, disablekb: 1
        },
        events: {
          onReady: e => { e.target.playVideo(); wire(box, player, ui, hit); },
          onStateChange: e => onState(box, ui, e.data)
        }
      });
      box._player = player;
    });
  }

  function buildUI(box){
    const prog = document.createElement('div');
    prog.className = 'etv-progress';
    prog.innerHTML = `<div class="etv-buf"></div><div class="etv-fill"></div><div class="etv-knob"></div>`;

    const bar = document.createElement('div');
    bar.className = 'etv-bar';
    bar.innerHTML =
      `<button class="etv-btn etv-toggle" type="button" aria-label="pausar">${SVG_PAUSE}</button>`
      + `<span class="etv-time">0:00 / 0:00</span>`
      + `<span class="etv-spacer"></span>`
      + `<button class="etv-btn etv-fs" type="button" aria-label="tela cheia">${SVG_FS}</button>`;

    box.appendChild(bar);
    box.appendChild(prog);
    return {
      prog, bar,
      fill:   prog.querySelector('.etv-fill'),
      buf:    prog.querySelector('.etv-buf'),
      knob:   prog.querySelector('.etv-knob'),
      toggle: bar.querySelector('.etv-toggle'),
      time:   bar.querySelector('.etv-time'),
      fs:     bar.querySelector('.etv-fs')
    };
  }

  function wire(box, player, ui, hit){
    let hideT = null, tick = null, seeking = false;

    const showBar = () => {
      box.classList.add('show-bar');
      clearTimeout(hideT);
      if(isPlaying()) hideT = setTimeout(() => box.classList.remove('show-bar'), 2600);
    };
    const isPlaying = () => box.classList.contains('is-playing');

    /* clique no centro do vídeo = play/pause; mexer = revela a barra.
       stopPropagation no centro pra não acionar a troca de foto do
       visor (as bordas continuam livres pro gesto de arrastar). */
    hit.addEventListener('pointerdown', e => e.stopPropagation());
    hit.addEventListener('click', () => {
      isPlaying() ? player.pauseVideo() : player.playVideo();
    });
    hit.addEventListener('pointermove', showBar);
    box.addEventListener('pointermove', showBar);
    box.addEventListener('pointerleave', () => { if(isPlaying()) box.classList.remove('show-bar'); });

    ui.toggle.addEventListener('click', () => {
      isPlaying() ? player.pauseVideo() : player.playVideo();
    });

    ui.fs.addEventListener('click', () => {
      if(document.fullscreenElement) document.exitFullscreen();
      else if(box.requestFullscreen) box.requestFullscreen();
      else if(box.webkitRequestFullscreen) box.webkitRequestFullscreen();
    });

    /* barra de progresso: clicar/arrastar pra buscar */
    const seekTo = clientX => {
      const r = ui.prog.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      const d = player.getDuration() || 0;
      player.seekTo(ratio * d, true);
      ui.fill.style.width = (ratio * 100) + '%';
      ui.knob.style.left  = (ratio * 100) + '%';
    };
    ui.prog.addEventListener('pointerdown', e => {
      seeking = true; ui.prog.setPointerCapture(e.pointerId); seekTo(e.clientX); showBar();
    });
    ui.prog.addEventListener('pointermove', e => { if(seeking) seekTo(e.clientX); });
    ui.prog.addEventListener('pointerup',   () => { seeking = false; });

    /* loop de atualização do tempo/progresso */
    box._startTick = () => {
      clearInterval(tick);
      tick = setInterval(() => {
        if(seeking) return;
        const d = player.getDuration() || 0;
        const c = player.getCurrentTime() || 0;
        const p = d ? (c / d) * 100 : 0;
        ui.fill.style.width = p + '%';
        ui.knob.style.left  = p + '%';
        const lf = player.getVideoLoadedFraction ? player.getVideoLoadedFraction() : 0;
        ui.buf.style.width = (lf * 100) + '%';
        ui.time.textContent = `${fmt(c)} / ${fmt(d)}`;
      }, 250);
    };
    box._stopTick = () => clearInterval(tick);
    box._showBar  = showBar;

    showBar();
  }

  function onState(box, ui, state){
    /* 1 = playing, 2 = paused, 0 = ended, 3 = buffering */
    if(state === 1){
      box.classList.add('is-playing');
      ui.toggle.innerHTML = SVG_PAUSE;
      ui.toggle.setAttribute('aria-label','pausar');
      box._startTick && box._startTick();
      box._showBar && box._showBar();           // mostra e agenda o auto-hide
    } else {
      box.classList.remove('is-playing');
      ui.toggle.innerHTML = SVG_PLAY;
      ui.toggle.setAttribute('aria-label','reproduzir');
      box._stopTick && box._stopTick();
      box.classList.add('show-bar');            // pausado: barra fica visível
    }
  }

  /* =============== VIMEO (embed limpo nativo) =============== */
  function mountVimeo(box, id){
    const iframe = document.createElement('iframe');
    iframe.className = 'etv-frame';
    iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.setAttribute('allowfullscreen','');
    box.appendChild(iframe);
  }

})();
