/* ===========================================================
   CORE — tudo que o site deduz sozinho a partir do posts.js.
   Usado tanto pelo índice quanto pela página de post.
   Você não precisa mexer aqui.
   =========================================================== */

const MESES = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

/* --- vídeo: reconhece YouTube e Vimeo em qualquer formato de link --- */
function parseVideo(url){
  if(!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if(yt) return {kind:'youtube', id:yt[1]};
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if(vm) return {kind:'vimeo', id:vm[1]};
  return null;
}
function embedURL(v){
  if(!v) return '';
  if(v.kind === 'youtube'){
    return `https://www.youtube.com/embed/${v.id}`
      + `?enablejsapi=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3`;
  }
  return `https://player.vimeo.com/video/${v.id}?title=0&byline=0&portrait=0`;
}
/* capa automática de vídeo do YouTube */
function videoCover(v){
  return v && v.kind === 'youtube' ? `https://img.youtube.com/vi/${v.id}/hqdefault.jpg` : '';
}

/* --- caminhos de imagem ---------------------------------- */
function mediaDir(p){ return `media/${p.slug}`; }

function resolvePath(p, name){
  if(/^(https?:)?\/\//.test(name) || name.startsWith('media/')) return name;
  return `${mediaDir(p)}/${name}`;
}

/* photos: 5  ->  01.jpg ... 05.jpg
   photos: ["a.jpg","b.png"] -> usa os nomes dados */
function photoList(p){
  if(Array.isArray(p.photos)) return p.photos.map(n => resolvePath(p, n));
  const n = Number(p.photos) || 0;
  const ext = p.ext || 'jpg';
  return Array.from({length:n}, (_,i) => `${mediaDir(p)}/${String(i+1).padStart(2,'0')}.${ext}`);
}

/* miniatura leve: media/slug/thumbs/01.jpg — se não existir,
   o próprio <img> cai de volta pro arquivo original sozinho */
function thumbPath(full){
  const i = full.lastIndexOf('/');
  if(i < 0 || /^https?:/.test(full)) return full;
  return `${full.slice(0,i)}/thumbs/${full.slice(i+1)}`;
}
function imgWithFallback(full, alt, cls){
  const t = thumbPath(full);
  const safe = String(alt || '').replace(/"/g,'&quot;');
  return `<img src="${t}" data-full="${full}" alt="${safe}" ${cls?`class="${cls}"`:''} loading="lazy"
    onerror="this.onerror=null;this.src=this.dataset.full">`;
}

/* --- normalização --------------------------------------- */
const ARCHIVE = POSTS
  .slice()
  .sort((a,b) => new Date(a.date) - new Date(b.date))
  .map((p,i) => {
    const video  = parseVideo(p.video);
    const photos = photoList(p);
    const cover  = p.cover ? resolvePath(p, p.cover) : (photos[0] || videoCover(video));
    return {
      ...p,
      id: i+1,
      catalogNo: String(i+1).padStart(3,'0'),
      year: Number(p.date.slice(0,4)),
      /* basta o campo "video" existir pro post ser tratado como vídeo,
         mesmo que o link ainda esteja vazio */
      type: p.type || ('video' in p ? 'video' : 'photo'),
      /* um post pode ter foto E vídeo ao mesmo tempo */
      hasVideo: !!video,
      hasPhotos: photos.length > 0,
      video, photos, cover,
      ratio: p.ratio || '16/9',
      tags: p.tags || [],
      href: p.page ? `post.html?p=${p.slug}` : ''
    };
  });

function bySlug(s){ return ARCHIVE.find(p => p.slug === s); }
function byId(id){ return ARCHIVE.find(p => p.id === id); }
function catalogLabel(p){ return `No.${p.catalogNo}`; }
function fullDate(p){
  const d = new Date(p.date + 'T12:00:00');
  return `${String(d.getDate()).padStart(2,'0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/* --- tema (compartilhado entre as páginas) --------------- */
const root = document.documentElement;
(function initTheme(){
  try{
    const saved = localStorage.getItem('etv-theme');
    if(saved) root.setAttribute('data-theme', saved);
  }catch(e){}
})();
function bindTheme(btn){
  if(!btn) return;
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try{ localStorage.setItem('etv-theme', next); }catch(e){}
  });
}

/* --- mídias de um post, na ordem em que aparecem no visor ---
   se o post tem vídeo E fotos, o vídeo entra primeiro e as fotos
   vêm em seguida, tudo na mesma tira de miniaturas. --- */
function mediaItems(p){
  const items = [];
  if(p.video) items.push({ kind:'video', thumb: videoCover(p.video) });
  p.photos.forEach(src => items.push({ kind:'photo', src, thumb: src }));
  return items;
}

/* --- tamanho de mídia dentro do texto -------------------
   aceita os presets antigos (sm/md/lg/xl) e também número
   puro em porcentagem ("65" = 65% da largura). --- */
const LEGACY_W = { sm:35, md:60, lg:75, xl:100 };
function sizeToPercent(val){
  if(val == null || val === '') return null;
  if(LEGACY_W[val] != null) return LEGACY_W[val];
  const n = parseFloat(val);
  return isFinite(n) ? Math.min(100, Math.max(5, n)) : null;
}
/* fonte: presets antigos viram em, número vira porcentagem */
const LEGACY_F = { sm:'0.8em', md:'1em', lg:'1.35em', xl:'1.8em' };
function sizeToFont(val){
  if(val == null || val === '') return null;
  if(LEGACY_F[val]) return LEGACY_F[val];
  const n = parseFloat(val);
  return isFinite(n) ? `${Math.min(400, Math.max(30, n))}%` : null;
}
