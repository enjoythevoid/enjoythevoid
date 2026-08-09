/* ===========================================================
   PLAYER — monta o vídeo no visor / no post profundo.

   Como funciona hoje:
   · YouTube → iframe nativo. Por cima entra uma camada TRANSPARENTE
     cobrindo o vídeo inteiro: um toque simples nela chama play/pause
     via IFrame API; arraste sobe (bubbling) pro código que troca de
     foto, então funciona em qualquer parte do vídeo. Se a pessoa
     tocar ANTES da API do YouTube terminar de carregar (comum em
     conexão de celular mais lenta), o toque fica "pendente" e é
     aplicado assim que a API ficar pronta — antes, um toque nesse
     intervalo não fazia nada, parecendo que o vídeo não dava play.
   · Adobe Portfolio/Behance (CCV) → iframe direto com autoplay=1.
     SEM API pública disponível pra controlar o play por fora — então
     NÃO cobrimos o vídeo inteiro (diferente do YouTube): se o
     autoplay falhar (comum em celular, que bloqueia autoplay com som
     com bastante frequência), a pessoa precisa poder tocar no botão
     de play NATIVO da Adobe pra iniciar manualmente. Por isso usamos
     só faixas curtas nas bordas (a parte de cima) pro arrasto,
     deixando o resto do vídeo — incluindo os controles nativos —
     livre pra receber toque direto.
   · Vimeo → capa própria (clique pra carregar) + parâmetros que
     escondem título/autor, porque o Vimeo aceita isso via URL.
   =========================================================== */
(function(){

  const SVG_BIG = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;

  /* ---- carrega a IFrame API do YouTube uma única vez (usada só
     pra dar play/pause via toque na camada transparente) ---- */
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

  /* ---- HTML do vídeo. item pode ser {kind,id} ou {video:{...}} ----
     opts: { thumb, swipe }  swipe=true deixa as bordas livres pro
     gesto de trocar de foto no visor (Vimeo e Adobe usam). --- */
  window.etvVideoHTML = function(item, opts){
    opts = opts || {};
    const v = (item && item.video) ? item.video : item;
    if(!v || !v.kind) return '';

    if(v.kind === 'adobe'){
      return `<div class="etv-video etv-video-adobe" data-kind="adobe" data-id="${v.id}" data-ready="1">`
        + `<iframe class="etv-frame" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen `
        + `src="https://www-ccv.adobe.io/v1/player/ccv/${v.id}/embed?bgcolor=%23000000&lazyLoading=true&api_key=BehancePro2View&autoplay=1"></iframe>`
        + `</div>`;
    }
    if(v.kind === 'youtube'){
      /* data-ready NÃO é marcado aqui — etvUpgradeVideos precisa
         rodar pra conectar a IFrame API e criar a camada de toque */
      const uid = 'etv-yt-' + Math.random().toString(36).slice(2, 9);
      return `<div class="etv-video etv-video-youtube" data-kind="youtube" data-id="${v.id}">`
        + `<iframe id="${uid}" class="etv-frame" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen `
        + `src="https://www.youtube.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}"></iframe>`
        + `<div class="etv-hit" data-yt-id="${uid}"></div>`
        + `</div>`;
    }
    /* Vimeo: mantém a capa (clique pra carregar) */
    const thumb = opts.thumb || '';
    const bg = thumb ? ` style="background-image:url('${thumb.replace(/'/g,"%27")}')"` : '';
    return `<div class="etv-video" data-kind="${v.kind}" data-id="${v.id}"${opts.swipe ? ' data-swipe="1"' : ''}>`
      + `<div class="etv-poster"${bg}><button class="etv-bigplay" type="button" aria-label="reproduzir">${SVG_BIG}</button></div>`
      + `</div>`;
  };

  /* ---- liga os facades/camadas que ainda não foram ligadas ---- */
  window.etvUpgradeVideos = function(root){
    (root || document).querySelectorAll('.etv-video:not([data-ready])').forEach(box => {
      box.setAttribute('data-ready','1');
      const hit = box.querySelector('.etv-hit');
      if(hit){ wireYouTubeHit(box, hit); return; }
      const poster = box.querySelector('.etv-poster');
      if(!poster) return;
      const start = () => { poster.removeEventListener('click', start); mount(box); };
      poster.addEventListener('click', start);
    });
  };

  /* conecta a camada transparente de um vídeo do YouTube: toque
     simples (sem arrastar) alterna play/pause via API; arrastar não
     é interceptado aqui — sobe naturalmente pro código que já troca
     de foto quando você arrasta em cima de uma foto.
     se a pessoa tocar antes da API terminar de carregar, o toque
     fica pendente (pendingToggle) e é aplicado assim que der — sem
     isso, um toque nesse intervalo curto não fazia nada. */
  function wireYouTubeHit(box, hit){
    const ytId = hit.dataset.ytId;
    let player = null, pendingToggle = false;
    const doToggle = () => {
      if(!player || !player.getPlayerState) { pendingToggle = true; return; }
      const state = player.getPlayerState();
      if(state === 1) player.pauseVideo();
      else player.playVideo();
    };
    YT_READY.then(YT => {
      player = new YT.Player(ytId, {
        events: {
          onReady: () => { if(pendingToggle){ pendingToggle = false; doToggle(); } },
          onStateChange: () => {}
        }
      });
    });
    hit.addEventListener('click', doToggle);
  }

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
