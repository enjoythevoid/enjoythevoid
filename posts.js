/* ===========================================================
   POSTS.JS — O ÚNICO ARQUIVO QUE VOCÊ EDITA PRA PUBLICAR.

   Regras que o site resolve sozinho (você não precisa escrever):
   · o ano do post           -> vem do campo date
   · o número de catálogo    -> mais antigo = No.001
   · foto ou vídeo           -> se tem "video", é vídeo; senão é foto
   · a capa do grid          -> primeira foto, ou o frame do YouTube
   · as miniaturas de seleção-> aparecem sozinhas se houver +1 foto
   · o tamanho do player     -> vem do campo ratio ("16/9" ou "9/16")
   · a página completa       -> existe se page:true e houver posts/SLUG.md

   CAMPOS
   -----------------------------------------------------------
   slug      obrigatório. nome curto, sem acento/espaço. define
             a pasta media/SLUG/ e a URL da página completa.
   title     obrigatório.
   date      obrigatório. "AAAA-MM-DD".
   location  texto livre.
   tags      lista. use "Article" pra aparecer no menu articles.
   photos    número (5 = 01.jpg..05.jpg dentro de media/SLUG/)
             ou lista ["01.jpg","02.png"] se os nomes variarem.
   ext       opcional, padrão "jpg". só se usar photos como número.
   video     link do YouTube ou Vimeo. cola o link normal mesmo.
   ratio     opcional. "16/9" (padrão) ou "9/16" pra Reels/vertical.
   cover     opcional. força uma capa específica pro grid.
   page      true se esse post tem página completa em posts/SLUG.md
   =========================================================== */

const POSTS = [

  /* seus posts entram aqui — use o admin.html pra gerar cada bloco
     e cole dentro destes colchetes, separados por vírgula. */

  {
    slug: "adrieli",
    title: "ADRIELI",
    date: "2026-07-11",
    location: "",
    tags: ["T5I"],
    photos: 2,
  },

];
