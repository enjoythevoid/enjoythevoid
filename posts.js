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
    slug: "adrielli",
    title: "ADRIELLI",
    date: "2017-06-03",
    location: "São Paulo",
    tags: ["T5I", "Color grading"],
    photos: 5,
    videos: ["https://www.youtube.com/watch?v=N_Wjpe0mooo"],
    ratio: "16/9",
    order: ["photo", "photo", "photo", "photo", "photo", "video:0"],
  },

  {
    slug: "isabele",
    title: "ISABELE",
    date: "2017-02-11",
    location: "São Paulo",
    tags: ["T5I"],
    photos: 1,
  },

  {
    slug: "pico-do-jaragua",
    title: "PICO DO JARAGUÁ",
    date: "2017-09-08",
    location: "PICO DO JARAGUÁ - São Paulo",
    tags: ["T5I"],
    photos: 1,
  },

  {
    slug: "imback",
    title: "IMBACK",
    date: "2026-07-02",
    location: "São Paulo",
    tags: ["AI"],
    videos: ["https://www-ccv.adobe.io/v1/player/ccv/7EaTqkP6_6u/embed"],
    ratio: "16/9",
    order: ["video:0"],
    videoCovers: ["media/imback/video-thumbs/yt-XIn1jCvmO1k.jpg"],
  },

  {
    slug: "apocalipse-21-2",
    title: "APOCALIPSE 21:2",
    date: "2024-11-23",
    location: "São Paulo",
    tags: ["T5I", "RAW", "Color grading"],
    photos: 4,
    videos: ["https://www.youtube.com/watch?v=XTi-1XT46RQ&embeds_referring_euri=https%3A%2F%2Fenjoythevoid.myportfolio.com%2F"],
    ratio: "16/9",
    order: ["video:0", "photo", "photo", "photo", "photo"],
    videoCovers: ["media/apocalipse-21-2/video-thumbs/yt-XTi-1XT46RQ.jpg"],
    cover: "media/apocalipse-21-2/cover.jpg",
  },

  {
    slug: "bamboo-brasil",
    title: "BAMBOO BRASIL",
    date: "2017-09-08",
    location: "São Paulo - Pico do Jaraguá",
    tags: ["T5I"],
    photos: 1,
  },

  {
    slug: "litost",
    title: "LITOST",
    date: "2026-08-10",
    location: "São Paulo - Jaraguá",
    tags: ["EOS M"],
    photos: 2,
  },

];
