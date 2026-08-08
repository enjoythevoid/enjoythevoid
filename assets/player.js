/* ===========================================================
   PLAYER — monta o vídeo no visor / no post profundo.

   Como funciona hoje (depois de testar bastante com YouTube e
   Adobe Portfolio):
   · YouTube  → iframe padrão, interface nativa do YouTube. Sem
     capa, sem barra nossa, sem autoplay — a pessoa clica no play
     nativo do YouTube quando quiser. A marca deles (avatar/título)
     aparece, porque não existe jeito de remover isso de fora do
     iframe (é conteúdo de outro domínio — o navegador bloqueia
     por segurança, não é limitação do nosso código).
   · Adobe Portfolio/Behance (CCV) → mesma lógica: iframe direto,
     player nativo deles, sem nada nosso por cima.
   · Vimeo → continua com a capa própria (clique pra carregar) e
     os parâmetros que escondem título/autor, porque o Vimeo é o
     único dos três que aceita isso via URL.
   =========================================================== */
(function(){

  const SVG_BIG = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;

  /* ---- HTML do vídeo. item pode ser {kind,id} ou {video:{...}} ----
     opts: { thumb, swipe }  swipe=true deixa as bordas livres pro
     gesto de trocar de foto no visor (só usado pelo Vimeo, que tem
     capa própria — YouTube/Adobe usam o player nativo deles, que já
     ocupa os cantos com os próprios controles). --- */
  window.etvVideoHTML = function(item, opts){
    opts = opts || {};
    const v = (item && item.video) ? item.video : item;
    if(!v || !v.kind) return '';

    if(v.kind === 'adobe'){
      return `<div class="etv-video etv-video-adobe" data-kind="adobe" data-id="${v.id}" data-ready="1">`
        + `<iframe class="etv-frame" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen `
        + `src="https://www-ccv.adobe.io/v1/player/ccv/${v.id}/embed?bgcolor=%23000000&lazyLoading=true&api_key=BehancePro2View"></iframe>`
        + `</div>`;
    }
    if(v.kind === 'youtube'){
      return `<div class="etv-video etv-video-youtube" data-kind="youtube" data-id="${v.id}" data-ready="1">`
        + `<iframe class="etv-frame" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen `
        + `src="https://www.youtube.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1"></iframe>`
        + `</div>`;
    }
    /* Vimeo: mantém a capa (clique pra carregar) */
    const thumb = opts.thumb || '';
    const bg = thumb ? ` style="background-image:url('${thumb.replace(/'/g,"%27")}')"` : '';
    return `<div class="etv-video" data-kind="${v.kind}" data-id="${v.id}"${opts.swipe ? ' data-swipe="1"' : ''}>`
      + `<div class="etv-poster"${bg}><button class="etv-bigplay" type="button" aria-label="reproduzir">${SVG_BIG}</button></div>`
      + `</div>`;
  };

  /* ---- liga os facades que ainda não foram ligados (só se aplica
     ao Vimeo agora — YouTube e Adobe já nascem com data-ready="1") ---- */
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
    mountVimeo(box, box.dataset.id);
    if(poster){
      const bigplay = poster.querySelector('.etv-bigplay');
      if(bigplay) bigplay.style.opacity = '0';
      poster.classList.add('is-hidden');
      setTimeout(() => poster.remove(), 400);
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
