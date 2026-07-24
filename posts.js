/* ===========================================================
   POSTS.JS — O ÚNICO ARQUIVO QUE VOCÊ EDITA PRA PUBLICAR.

   Regras que o site resolve sozinho (você não precisa escrever):
   · o ano do post           -> vem do campo date
   · o número de catálogo    -> mais antigo = No.001
   · foto ou vídeo           -> se tem "video", é vídeo; senão é foto.
     um post pode ter os DOIS: basta ter "photos" e "video" juntos —
     o visor mostra o vídeo primeiro e as fotos em seguida.
   · a capa do grid          -> primeira foto, ou o frame do YouTube
   · as miniaturas de seleção-> aparecem sozinhas se houver +1 foto
   · o tamanho do player     -> vem do campo ratio ("16/9" ou "9/16")
   · a ordem foto/vídeo      -> videoAt diz quantas fotos vêm ANTES
     do vídeo na tira do visor (0 = vídeo primeiro, o padrão).
     o admin.html escreve esse campo sozinho quando você arrasta o
     vídeo pra outra posição na aba "fotos + vídeo".
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
   video     link do YouTube ou Vimeo (um só vídeo). cola o link normal.
   videos    lista de links, se o post tiver MAIS DE UM vídeo —
             ["https://youtu.be/AAA", "https://youtu.be/BBB"].
             não usa "video" e "videos" juntos, só um dos dois.
   order     opcional. a ordem exata de exibição, misturando fotos e
             vídeos como quiser: ["photo","video:0","photo","photo","video:1"]
             — "photo" consome a próxima foto da lista; "video:N" usa
             o vídeo de índice N em "videos". sem "order", o(s)
             vídeo(s) aparece(m) antes das fotos (ou na posição de
             "videoAt", se você usar esse campo mais simples com um
             único vídeo). o admin.html escreve "order" sozinho
             quando você arrasta fotos/vídeos pra reordenar.
   ratio     opcional. "16/9" (padrão) ou "9/16" pra Reels/vertical.
             vale pra todos os vídeos do post.
   cover     opcional. força uma capa específica pro grid.
   page      true se esse post tem página completa em posts/SLUG.md
   =========================================================== */

const POSTS = [

  /* seus posts entram aqui — use o admin.html pra gerar cada bloco
     e cole dentro destes colchetes, separados por vírgula. */

];
