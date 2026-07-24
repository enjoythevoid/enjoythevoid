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
    .replace(/\u0001span data-size="([^"]+)"\u0002([\s\S]*?)\u0001\/span\u0002/g, '<span data-size="$1">$2</span>')
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

/* ---------- markdown -> html ---------- */
function renderMarkdown(src){
  const out = [];
  const blocks = src.replace(/\r/g,'').split(/\n{2,}/);

  blocks.forEach(raw => {
    const b = raw.trim();
    if(!b) return;

    /* ::video URL | vertical */
    if(b.startsWith('::video')){
      const [url, mod] = b.replace('::video','').split('|').map(s => s.trim());
      const v = parseVideo(url);
      if(v) out.push(
        `<div class="md-video${mod === 'vertical' ? ' vertical' : ''}">
           <iframe src="${embedURL(v)}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>
         </div>`);
      return;
    }

    /* ::grid a.jpg | b.jpg | c.jpg */
    if(b.startsWith('::grid')){
      const files = b.replace('::grid','').split('|').map(s => s.trim()).filter(Boolean);
      out.push(`<div class="md-grid">` +
        files.map(f => imgWithFallback(mpath(f), '')).join('') + `</div>`);
      return;
    }

    /* ![legenda](arquivo.jpg) */
    const img = b.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if(img){
      out.push(
        `<figure><img src="${mpath(img[2])}" alt="${img[1]}" loading="lazy">` +
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

  /* o vídeo/capa do post entra automaticamente no topo do corpo */
  let top = '';
  if(post.type === 'video' && post.video){
    top = `<div class="md-video${post.ratio === '9/16' ? ' vertical' : ''}">
             <iframe src="${embedURL(post.video)}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>
           </div>`;
  } else if(post.cover){
    top = `<figure><img src="${post.cover}" alt="${post.title}"></figure>`;
  }

  const idx = ARCHIVE.slice().sort((a,b) => new Date(b.date) - new Date(a.date));
  const i = idx.findIndex(p => p.id === post.id);
  const prev = idx[i+1], next = idx[i-1];
  elFoot.innerHTML =
    `<span>${prev && prev.href ? `<a href="post.html?p=${prev.slug}">← ${prev.title}</a>` : ''}</span>` +
    `<span><a href="index.html#${post.slug}">arquivo</a></span>` +
    `<span>${next && next.href ? `<a href="post.html?p=${next.slug}">${next.title} →</a>` : ''}</span>`;

  fetch(`posts/${post.slug}.md`)
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(md => { elBody.innerHTML = top + renderMarkdown(md); })
    .catch(() => {
      elBody.innerHTML = top +
        `<p><em>Texto ainda não escrito.</em> Crie o arquivo <code>posts/${post.slug}.md</code>.</p>`;
    });
}

bindTheme(document.getElementById('themeToggle'));
