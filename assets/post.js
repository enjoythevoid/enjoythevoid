/* ===========================================================
   PÁGINA DE POST — lê posts/SLUG.md e monta a página.
   Uma única página serve todos os posts: post.html?p=slug
   =========================================================== */

const slug = new URLSearchParams(location.search).get('p');
const post = slug ? bySlug(slug) : null;

const elHead = document.getElementById('postHead');
const elBody = document.getElementById('postBody');
const elFoot = document.getElementById('postFoot');

/* ---------- inline: negrito, itálico, sublinhado, tachado, cor, tamanho, link ---------- */
function inline(s){
  return s
    /* protege as tags customizadas que queremos manter (u, s, span cor/tamanho) */
    .replace(/</g,'\u0001').replace(/>/g,'\u0002').replace(/&/g,'&amp;')
    .replace(/\u0001u\u0002([\s\S]*?)\u0001\/u\u0002/g, '<u>$1</u>')
    .replace(/\u0001s\u0002([\s\S]*?)\u0001\/s\u0002/g, '<s>$1</s>')
    .replace(/\u0001span data-color="([^"]+)"\u0002([\s\S]*?)\u0001\/span\u0002/g, '<span data-color="$1">$2</span>')
    .replace(/\u0001span data-size="([^"]+)"\u0002([\s\S]*?)\u0001\/span\u0002/g,
      (m, sz, txt) => { const f = sizeToFont(sz); return `<span data-size="${sz}"${f ? ` style="font-size:${f}"` : ''}>${txt}</span>`; })
    /* markdown "normal" */
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    /* restaura qualquer < > que sobrou */
    .replace(/\u0001/g,'&lt;').replace(/\u0002/g,'&gt;');
}

/* caminho curto ("03.jpg") vira media/slug/03.jpg */
function mpath(name){
  name = name.trim();
  if(/^(https?:)?\/\//.test(name) || name.startsWith('media/')) return name;
  return `media/${post.slug}/${name}`;
}


/* ---------- modificadores de tamanho: size=lg (antigo) ou w=65 (novo) ---------- */
function pickWidth(mods){
  const m = mods.find(x => /^(w|size)=/.test(x));
  if(!m) return { raw:'', pct:null };
  const raw = m.split('=')[1];
  return { raw, pct: sizeToPercent(raw) };
}
function pickCols(mods){
  const m = mods.find(x => /^cols=\d+$/.test(x));
  return m ? Number(m.split('=')[1]) : null;
}

/* ---------- markdown -> html ---------- */
function renderMarkdown(src){
  const out = [];
  const blocks = src.replace(/\r/g,'').split(/\n{2,}/);

  blocks.forEach(raw => {
    const b = raw.trim();
    if(!b) return;

    /* ::video URL | vertical | size=sm */
    if(b.startsWith('::video')){
      const parts = b.replace('::video','').split('|').map(s => s.trim());
      const url = parts[0];
      const mods = parts.slice(1);
      const vertical = mods.includes('vertical');
      const w = pickWidth(mods);
      const v = parseVideo(url);
      if(v) out.push(
        `<div class="md-video${vertical ? ' vertical' : ''}"${w.raw ? ` data-w="${w.raw}"` : ''}` +
        `${w.pct ? ` style="width:${w.pct}%;max-width:100%;margin-inline:auto"` : ''}>
           ${etvVideoHTML(v)}
         </div>`);
      return;
    }

    /* ::grid a.jpg | b.jpg | c.jpg | size=sm */
    if(b.startsWith('::grid')){
      const parts = b.replace('::grid','').split('|').map(s => s.trim()).filter(Boolean);
      const mods = parts.filter(x => /^(w|size|cols)=/.test(x));
      const files = parts.filter(x => !/^(w|size|cols)=/.test(x));
      const w = pickWidth(mods);
      const cols = pickCols(mods) || Math.min(files.length, 4);
      const style = `grid-template-columns:repeat(${cols},1fr);` +
        (w.pct ? `width:${w.pct}%;max-width:100%;margin-inline:auto;` : '');
      const gridId = `grid-${out.length}-${Math.random().toString(36).slice(2,7)}`;
      out.push(`<div class="md-grid"${w.raw ? ` data-w="${w.raw}"` : ''} data-cols="${cols}" style="${style}" data-grid-id="${gridId}">` +
        files.map((f,i) => {
          const full = mpath(f);
          const t = thumbPath(full);
          return `<img src="${t}" data-full="${full}" alt="" data-fade loading="lazy" data-grid-id="${gridId}" data-grid-i="${i}"
            onerror="this.onerror=null;this.src=this.dataset.full">`;
        }).join('') + `</div>`);
      return;
    }

    /* ![legenda](arquivo.jpg){size=sm} */
    const img = b.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\{(?:size|w)=([^}]+)\})?$/);
    if(img){
      const raw = img[3] || '';
      const pct = sizeToPercent(raw);
      const full = mpath(img[2]);
      out.push(
        `<figure${raw ? ` data-w="${raw}"` : ''}` +
        `${pct ? ` style="width:${pct}%;max-width:100%;margin-inline:auto"` : ''}>` +
        `<img src="${full}" data-full="${full}" alt="${img[1]}" data-fade loading="lazy">` +
        (img[1] ? `<figcaption>${inline(img[1])}</figcaption>` : '') + `</figure>`);
      return;
    }

    if(b === '---'){ out.push('<hr>'); return; }
    if(b.startsWith('### ')){ out.push(`<h3>${inline(b.slice(4))}</h3>`); return; }
    if(b.startsWith('## ')){ out.push(`<h2>${inline(b.slice(3))}</h2>`); return; }
    if(b.startsWith('> ')){
      out.push(`<blockquote>${inline(b.replace(/^> ?/gm,''))}</blockquote>`); return;
    }
    if(/^(-|\*)\s/m.test(b) && b.split('\n').every(l => /^(-|\*)\s/.test(l.trim()))){
      const items = b.split('\n').map(l => `<li>${inline(l.replace(/^\s*(-|\*)\s/, ''))}</li>`).join('');
      out.push(`<ul>${items}</ul>`); return;
    }
    if(/^\d+\.\s/m.test(b) && b.split('\n').every(l => /^\d+\.\s/.test(l.trim()))){
      const items = b.split('\n').map(l => `<li>${inline(l.replace(/^\s*\d+\.\s/, ''))}</li>`).join('');
      out.push(`<ol>${items}</ol>`); return;
    }

    /* quebra de linha simples só junta o texto (como no markdown de verdade).
       pra forçar uma quebra, termine a linha com dois espaços. */
    const par = inline(b).replace(/ {2,}\n/g, '<br>').replace(/\n/g, ' ');
    out.push(`<p>${par}</p>`);
  });

  return out.join('\n');
}

/* ---------- monta a página ---------- */
if(!post){
  document.title = 'não encontrado — enjoythevoid';
  elBody.innerHTML = `<p>Post não encontrado. <a href="index.html">Voltar ao arquivo</a>.</p>`;
} else {
  document.title = `${post.title} — enjoythevoid`;

  const tags = post.tags.map(t => `<span class="tag">#${t}</span>`).join('');
  elHead.innerHTML = `
    <p class="no">${catalogLabel(post)}</p>
    <h1>${post.title}</h1>
    <div class="meta">
      <span>${fullDate(post)}</span>
      ${post.location ? `<span>${post.location}</span>` : ''}
      ${tags}
    </div>`;

  /* o post profundo começa limpo: o vídeo NÃO entra mais sozinho.
     se quiser o vídeo (ou qualquer outro) dentro do texto, é só
     adicionar no corpo com "::video LINK". a capa segue entrando
     sozinha só nos posts de foto (nunca havia vídeo aqui de qualquer
     forma). */
  let top = '';
  if(post.type !== 'video' && post.cover){
    top = `<figure><img src="${post.cover}" data-fade alt="${post.title}"></figure>`;
  }

  const idx = ARCHIVE.slice().sort((a,b) => new Date(b.date) - new Date(a.date));
  const i = idx.findIndex(p => p.id === post.id);
  const prev = idx[i+1], next = idx[i-1];
  elFoot.innerHTML =
    `<span>${prev && prev.href ? `<a href="post.html?p=${prev.slug}">← ${prev.title}</a>` : ''}</span>` +
    `<span><a href="index.html#${post.slug}">back</a></span>` +
    `<span>${next && next.href ? `<a href="post.html?p=${next.slug}">${next.title} →</a>` : ''}</span>`;

  fetch(`posts/${post.slug}.md`)
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(md => { elBody.innerHTML = top + renderMarkdown(md); afterBody(); })
    .catch(() => {
      elBody.innerHTML = top +
        `<p><em>Texto ainda não escrito.</em> Crie o arquivo <code>posts/${post.slug}.md</code>.</p>`;
      afterBody();
    });
}
function afterBody(){
  if(typeof etvUpgradeVideos === 'function') etvUpgradeVideos(elBody);
  if(typeof etvSweepImages   === 'function') etvSweepImages(elBody);
}

bindTheme(document.getElementById('themeToggle'));

/* ---------- lightbox das fotos dentro de grades no texto ---------- */
const glb = document.getElementById('gridLightbox');
const glbImg = document.getElementById('glbImg');
const glbPos = document.getElementById('glbPos');
let glbList = [], glbIndex = 0;

function openGridLightbox(gridId, index){
  glbList = [...document.querySelectorAll(`img[data-grid-id="${gridId}"]`)]
    .map(img => img.dataset.full || img.src);
  if(!glbList.length) return;
  glbIndex = index;
  renderGlb();
  glb.classList.add('open');
  glb.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function renderGlb(){
  glbImg.src = glbList[glbIndex];
  glbPos.textContent = `${String(glbIndex+1).padStart(2,'0')} / ${glbList.length}`;
}
function closeGlb(){
  if(!glb.classList.contains('open')) return;
  glb.classList.remove('open');
  glb.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
function stepGlb(dir){
  glbIndex = (glbIndex + dir + glbList.length) % glbList.length;
  renderGlb();
}

/* lista solta: qualquer foto fora de grade também abre em tela cheia,
   e a navegação passeia por todas as fotos do corpo do post */
function openLooseLightbox(target){
  const all = [...elBody.querySelectorAll('figure img, .md-grid img')];
  glbList = all.map(i => i.dataset.full || i.src);
  glbIndex = Math.max(0, all.indexOf(target));
  if(!glbList.length) return;
  renderGlb();
  glb.classList.add('open');
  glb.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
elBody.addEventListener('click', e => {
  const img = e.target.closest('img');
  if(!img || !elBody.contains(img)) return;
  if(img.closest('.md-video')) return;
  openLooseLightbox(img);
});
document.getElementById('glbPrev').addEventListener('click', () => stepGlb(-1));
document.getElementById('glbNext').addEventListener('click', () => stepGlb(1));
glb.addEventListener('click', e => {
  if(e.target === glbImg || e.target.closest('.glb-nav')) return;
  closeGlb();
});
document.addEventListener('keydown', e => {
  if(!glb.classList.contains('open')) return;
  if(e.key === 'Escape') closeGlb();
  if(e.key === 'ArrowRight') stepGlb(1);
  if(e.key === 'ArrowLeft') stepGlb(-1);
});
