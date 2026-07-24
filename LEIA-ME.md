# enjoythevoid — manual do arquivo

O site inteiro é alimentado por **um arquivo só: `posts.js`**.
Tudo o que era repetitivo agora é deduzido: ano, numeração de catálogo,
capa, miniaturas de seleção, tamanho do player, página completa.

---

## 1. O que é cada coisa

```
index.html        o arquivo (grade por ano). não precisa mexer.
post.html         a página completa. UMA página serve TODOS os posts.
posts.js       ←  VOCÊ EDITA SÓ ISTO pra publicar.
posts/            os textos longos, um .md por post (opcional).
media/            as imagens, uma pasta por post.
assets/           css e javascript. não precisa mexer.
ferramentas/      script que prepara as fotos (opcional).
ver-local.bat     abre o site no seu PC antes de subir.
```

---

## 2. Publicar um post

Tem três jeitos. Todos terminam no mesmo lugar: uma entrada no `posts.js`
e as fotos na pasta certa.

### Jeito principal — publicar direto pelo `admin.html`

Configura uma vez:

1. Acessa **github.com/settings/personal-access-tokens/new**
2. Dá um nome pro token, tipo `enjoythevoid-admin`
3. Em **Repository access**, escolhe **Only select repositories** → marca
   só o `enjoythevoid`
4. Em **Permissions → Repository permissions**, procura **Contents** →
   muda pra **Read and write**
5. **Generate token** — copia o código que aparece (só aparece **uma vez**)
6. No `admin.html`, abre o painel **conexão com o github** no topo, cola:
   - usuário: seu usuário do GitHub
   - repositório: `enjoythevoid`
   - branch: `main`
   - token: o código copiado
7. Clica **salvar**, depois **testar conexão** — a bolinha fica verde
   quando funciona

Isso é feito **uma única vez**. Da próxima vez que abrir o `admin.html`,
já está tudo conectado.

**Publicar um post, depois disso:**

1. Preenche o formulário (título, data, fotos ou vídeo)
2. Clica **publicar no github**
3. Acompanha o log — ele mostra cada passo (lendo, gravando, enviando
   foto 1/3...) e no final entrega o link do post
4. Espera 1–5 minutos e recarrega o site (numa aba anônima, se não
   aparecer de primeira — o navegador guarda cache)

O token fica guardado só no seu navegador (`localStorage`), nunca é
enviado a nenhum lugar além de falar direto com a API do GitHub. Se
trocar de computador, gera outro token e configura de novo lá.

### Editar um post já publicado, ou adicionar mais fotos

No `admin.html`, logo abaixo da conexão com o github, tem o campo
**"editar um post já publicado"**:

1. Clica **carregar lista** — ele busca todos os posts direto do repositório
2. Escolhe o post na lista
3. O formulário se preenche sozinho com os dados daquele post
4. Se for post de fotos, ele avisa quantas já existem
   (ex: *"já tem 3 foto(s). as que você arrastar agora entram depois delas"*)
5. Arrasta as fotos novas (só as novas — não precisa readicionar as antigas),
   ou reescreve o texto da página completa, ou muda qualquer campo
6. Clica **salvar alterações**

Ele atualiza o post **no lugar certo** do `posts.js` (não duplica), e as
fotos novas continuam a numeração de onde parou (`03.jpg`, `04.jpg`...).

**Apagar um post:** depois de carregar ele na lista, aparece um botão
vermelho **"apagar este post"**. Ele remove a entrada do `posts.js`, mas
**não apaga as fotos** da pasta `media/` — isso você faz manualmente pelo
site do GitHub, se quiser liberar o espaço.

### Jeito alternativo — sem token, gerando o bloco pra colar manualmente

Se preferir não usar token nenhum, o botão **"só gerar o bloco (sem
publicar)"** no `admin.html` funciona sem precisar de conexão nenhuma:

1. Preenche o formulário
2. Clica **só gerar o bloco (sem publicar)**
3. Copia o bloco e cola dentro de `posts.js`, entre os colchetes `[ ]`
4. Se escolheu fotos: clica **baixar .zip** — ele já entrega redimensionado
   (imagem grande + miniatura) dentro da pasta certa. Só extrair e arrastar
   pra dentro de `media/`
5. Se marcou "página completa": baixa o modelo `.md` e escreve o texto nele
6. Sobe tudo pro GitHub manualmente (GitHub Desktop ou upload pelo site)

### Jeito manual — editar `posts.js` direto

Pra quem já pegou o jeito, ou quer editar algo pontual sem abrir o
formulário:

#### a) Post de fotos

1. Crie a pasta `media/nome-do-post/`
2. Jogue as fotos dentro, nomeadas `01.jpg`, `02.jpg`, `03.jpg`…
3. Abra `posts.js` e adicione:

```js
  {
    slug: "praia-negra",
    title: "PRAIA NEGRA",
    date: "2026-07-14",
    location: "Ubatuba",
    tags: ["Photo", "Analog"],
    photos: 5
  },
```

Pronto. O post entra sozinho em **2026**, ganha o número de catálogo pela
ordem cronológica, usa a `01.jpg` como capa e mostra a **tira de miniaturas
de seleção** porque tem mais de uma foto.

Se os nomes dos arquivos não seguirem a numeração, use a lista:
`photos: ["capa.jpg", "detalhe.png", "verso.jpg"]`

#### b) Post de vídeo

```js
  {
    slug: "entregador",
    title: "ENTREGADOR",
    date: "2026-03-28",
    location: "Rodovia dos Bandeirantes",
    tags: ["Short Film", "AI"],
    video: "https://youtu.be/K8xM2pQ7abc",
    ratio: "16/9"
  },
```

Cole o link do YouTube ou Vimeo **como ele aparece na barra do navegador** —
o site converte pro player limpo (sem sugestões, sem branding) sozinho.
A capa no grid vira o frame do próprio vídeo, automático.

Para **Reels / vertical**, troque para `ratio: "9/16"`.

#### c) Post com página completa

Adicione `page: true` no post e crie o arquivo `posts/SLUG.md`:

```markdown
Primeiro parágrafo. Quebrar a linha no editor não quebra no site —
o texto se junta sozinho.

## um subtítulo

Outro parágrafo, com *itálico*, **negrito** e [link](https://exemplo.com).

![Legenda da foto](03.jpg)

::grid 04.jpg | 05.jpg | 06.jpg

::video https://youtu.be/K8xM2pQ7abc

> uma citação

---
```

Os nomes de imagem são curtos porque o site já sabe que estão em
`media/SLUG/`. O link **ver post completo** aparece no visor só quando
`page: true` existe.

`::video LINK | vertical` deixa o player em formato Reels dentro do texto.

### Campos disponíveis

| campo | obrigatório | o que faz |
|---|---|---|
| `slug` | sim | nome curto, sem acento nem espaço. define a pasta e a URL |
| `title` | sim | título exibido |
| `date` | sim | `"AAAA-MM-DD"` — define o ano e a posição no arquivo |
| `location` | não | texto livre |
| `tags` | não | entram no menu `#`. use `"Article"` pra aparecer em *articles* |
| `photos` | não | número (`5` = `01.jpg`…`05.jpg`) ou lista de nomes |
| `ext` | não | extensão quando `photos` é número. padrão `jpg` |
| `video` | não | link do YouTube/Vimeo. o campo existindo já marca o post como vídeo |
| `ratio` | não | `"16/9"` (padrão) ou `"9/16"` |
| `cover` | não | força uma capa específica no grid |
| `page` | não | `true` se existe `posts/SLUG.md` |

---

## 3. Ver antes de subir

Dê dois cliques em **`ver-local.bat`**. Ele abre `localhost:8000` no navegador.

Isso é necessário porque as páginas completas leem arquivos `.md`, e o
navegador bloqueia essa leitura quando o `index.html` é aberto direto do
Explorer. (Precisa de Python instalado. Alternativa: extensão
*Live Server* no VS Code.)

---

## 4. Subir no GitHub — primeira vez

**4.1** Crie a conta em [github.com](https://github.com) e confirme o e-mail.

**4.2** Clique em **+** (canto superior direito) → **New repository**.

- **Repository name:** `enjoythevoid`
- **Public** (obrigatório pro site funcionar de graça)
- **Não** marque nada em "Initialize this repository"
- **Create repository**

> Se preferir o endereço curto `seuusuario.github.io` em vez de
> `seuusuario.github.io/enjoythevoid`, dê ao repositório exatamente o
> nome `seuusuario.github.io`. O resto é igual.

**4.3** Na página que abrir, clique em **uploading an existing file**.

**4.4** Abra a pasta do site no Explorer, selecione **tudo que está dentro
dela** (não a pasta em si) e arraste pra janela do navegador. Espere subir.

**4.5** Escreva `primeira versão` no campo de baixo → **Commit changes**.

**4.6** Aba **Settings** → menu lateral **Pages**:

- **Source:** `Deploy from a branch`
- **Branch:** `main` · pasta `/ (root)` → **Save**

**4.7** Espere 1–2 minutos e recarregue. O endereço aparece no topo:
`https://seuusuario.github.io/enjoythevoid/`

Está no ar.

---

## 5. Atualizar depois — o jeito prático

Subir arquivo por arquivo pelo site do GitHub cansa rápido. Instale o
**[GitHub Desktop](https://desktop.github.com)** (gratuito, tem interface,
não precisa de terminal):

1. **File → Clone repository** → escolha `enjoythevoid` → salve numa pasta do seu PC.
2. Daqui pra frente você trabalha **nessa pasta local**: joga as fotos em
   `media/`, edita o `posts.js`, escreve o `.md`.
3. Abra o GitHub Desktop. Ele lista tudo que mudou sozinho.
4. Escreva uma frase curta em *Summary* (ex.: `post praia negra`) →
   **Commit to main** → **Push origin**.
5. Em ~1 minuto o site está atualizado.

Publicar um post vira: colar fotos, escrever 6 linhas, apertar dois botões.

---

## 6. Miniaturas (opcional, mas vale)

Foto de câmera tem 8–20 MB. Vinte delas no grid deixam o site lento no 4G.

O site já procura uma versão leve em `media/SLUG/thumbs/01.jpg` e, se não
achar, usa a imagem original — ou seja, **funciona com ou sem**. Pra gerar:

```
pip install pillow
python ferramentas/preparar-fotos.py "C:/caminho/da/pasta/com/as/fotos" praia-negra
```

O script pega as fotos na ordem, renomeia pra `01.jpg`, `02.jpg`…, reduz a
grande pra 2000px, gera a miniatura de 600px, e imprime o bloco pronto pra
colar no `posts.js`. Os originais não são tocados.

---

## 7. Regras que evitam dor de cabeça

- **Nome de arquivo sem acento, sem espaço, tudo minúsculo.** O servidor do
  GitHub diferencia maiúscula de minúscula — `Foto.JPG` e `foto.jpg` são
  arquivos diferentes lá, mesmo que o Windows ache que são iguais.
- Toda entrada no `posts.js` termina com **vírgula** depois da chave `}`.
- Se o site sumir depois de uma edição, quase sempre é uma vírgula ou aspas
  faltando no `posts.js`. Aperte **F12** no navegador, aba *Console*: a
  mensagem em vermelho diz a linha.
- Vídeo do YouTube precisa estar **público ou "não listado"**. Privado não
  incorpora.
- O arquivo `.nojekyll` é obrigatório, não apague.

---

## 8. Domínio próprio (quando quiser)

Compre o domínio (Registro.br, Namecheap), aponte os DNS pro GitHub e
coloque o endereço em **Settings → Pages → Custom domain**. O GitHub gera
o certificado HTTPS sozinho. Dá pra fazer depois, sem refazer nada.


---

## atualização — editor e visor

- **foto + vídeo no mesmo post:** na aba "tipo de post" existe agora
  a opção **fotos + vídeo**. O post publica os dois; no visor da home
  o vídeo aparece primeiro e as fotos vêm logo depois, na mesma tira
  de miniaturas.
- **tamanho de foto/vídeo/grade na página completa:** clique na mídia
  dentro do editor e use a barra que aparece — presets (25/50/75/100%),
  slider, número exato em % e, no caso da grade, o número de colunas.
  As setas ← → também ajustam de 5 em 5. A grade cresce e diminui
  inteira, como grupo, mantendo a proporção entre as fotos.
- **tamanho do texto:** botões P / Normal / G / GG mais um campo de
  número em % (ex.: 130).
- **clicar numa foto da página completa** abre em tela cheia, com
  setas pra navegar entre todas as fotos daquele post.
- no markdown isso vira `{w=65}` nas imagens e `| w=65 | cols=3`
  nas grades e vídeos. Os arquivos antigos com `size=lg` continuam
  funcionando.


---

## atualização 2 — publicação mais confiável, ordem de exibição, vídeo sem corte

- **erro "sha wasn't supplied":** acontecia ao salvar por cima de uma
  foto ou texto que já existia no repositório. Agora toda gravação
  busca o sha sozinha quando precisa — o erro não deve mais aparecer.
- **publicar não trava mais tudo se uma etapa falhar:** antes, se o
  envio das fotos desse erro, o texto da página completa nem chegava
  a ser enviado. Agora cada etapa (posts.js, fotos, texto) roda
  separada — se uma falhar, as outras ainda são tentadas, e o log
  mostra exatamente o que deu certo e o que não deu.
- **ordem de fotos + vídeo:** na aba "fotos + vídeo", o vídeo agora
  aparece como mais um item dentro da lista de fotos que você
  arrasta — arraste ele pra qualquer posição entre as fotos novas
  pra decidir onde ele entra na tira do visor. (fotos já publicadas,
  de um post em edição, continuam sempre antes das novas — ainda não
  dá pra reordenar essas por aqui.)
- **vídeo cortado no preview:** o player calculava altura fixa e
  largura máxima ao mesmo tempo, e os dois entravam em conflito —
  o vídeo saía com a proporção errada e parecia cortado. Agora o
  tamanho é calculado certinho pra caber no espaço disponível sem
  perder a proporção 16:9 (ou 9:16, no formato reels).
- **tamanho do texto:** o slider e o número agora ajustam aos poucos
  (1% de cada vez) e não perdem mais o texto que você tinha
  selecionado no meio do ajuste — clique num texto já redimensionado
  pra continuar ajustando ele.


---

## atualização 3 — múltiplos vídeos, mistura livre de fotos e vídeos

- **vários vídeos no mesmo post:** na aba "vídeo" (ou "fotos + vídeo"),
  cole um link e clique em "adicionar" — pode adicionar quantos
  vídeos quiser. cada um vira um item na lista de ordem, junto com
  as fotos.
- **ordem livre:** arraste fotos e vídeos na mesma lista pra colocar
  em QUALQUER sequência — não precisa mais ser "vídeo primeiro,
  fotos depois". dá pra intercalar do jeito que quiser: foto, vídeo,
  foto, foto, vídeo...
- posts assim usam os campos novos `videos` (lista de links) e
  `order` (a sequência exata) no posts.js — o admin escreve isso
  sozinho. Posts antigos com só `video` continuam funcionando iguais.
- **limite atual:** fotos e vídeos já publicados (quando você edita
  um post existente) continuam sempre antes dos novos — ainda não dá
  pra reordenar ou remover os antigos por aqui, só direto pelo
  posts.js no github.


---

## atualização 4 — botão "Normal", título sem misturar formatação, sem flick no scroll

- **botão "Normal" do tamanho de texto:** agora funciona igual P/G/GG
  — marca o texto selecionado e fica ativo pra você ajustar a partir
  dali, em vez de simplesmente não fazer nada.
- **slider de tamanho de texto:** corrigido um bug em que o número
  mostrado no slider não batia com o tamanho realmente aplicado
  (o G e o GG apareciam mostrando 75/100 no campo, mas o texto
  estava mesmo em 135%/180% — só a exibição estava errada).
- **Seção / Sub / Corpo / Citação:** não usam mais o método antigo do
  navegador pra trocar o tipo do bloco. Isso resolvia dois problemas:
  a tela não "pula" mais o scroll ao clicar, e transformar um trecho
  em Seção ou Sub agora limpa cor/tamanho que tinham sido aplicados
  só naquele trecho de texto — um título fica com uma aparência só,
  em vez de sair com pedaços em tamanhos e cores diferentes. Virar
  citação ou parágrafo continua preservando negrito/itálico/cor
  normalmente.


---

## atualização 5 — reordenar (e remover) o que já está publicado

- agora a lista de ordem mostra TUDO — fotos e vídeos publicados e
  os que você acabou de adicionar — misturados na mesma grade
  arrastável. dá pra arrastar qualquer item, publicado ou não, e dá
  pra remover (×) qualquer um também.
- itens já publicados aparecem com um selinho "publicado" no canto.
- ao salvar, o admin recalcula os nomes dos arquivos de foto (01.jpg,
  02.jpg...) pra bater com a ordem que ficou na tela — isso pode
  significar renomear uma foto que já estava lá, ou apagar uma que
  você removeu da lista. vídeos não precisam de arquivo nenhum, só
  reordena a lista mesmo.
- o botão "baixar .zip das fotos" continua exportando só as fotos
  NOVAS (as publicadas não têm o arquivo original disponível aqui
  no navegador pra reprocessar) — reordenar as antigas só funciona
  publicando direto pelo github.


---

## atualização 6 — vídeo no mobile, redes sociais como ícone

- **vídeo minúsculo no mobile:** a correção anterior calculava o
  tamanho do vídeo lendo de volta o max-width/max-height do CSS
  (que usa vw/vh dentro de min()) — e isso não vinha confiável no
  Chrome do Android, dando um vídeo bem menor do que deveria. agora
  o tamanho vem direto de window.innerWidth/innerHeight, sem
  depender de ler nada do CSS de volta.
- **redes sociais:** saíram de dentro do menu do # e viraram ícones
  (Instagram, LinkedIn, Letterboxd) do lado dele, na barra de
  navegação. pra trocar os links, edita o `index.html` e procura
  por `id="socialLinks"` — são só 3 `<a href="...">`.


---

## atualização 7 — escolher a thumb de um vídeo

- cada vídeo na lista de ordem agora tem um ícone 🖼 — clique pra
  escolher uma foto do seu computador pra usar como thumb dele, em
  vez do frame automático que o YouTube gera. aparece um ↺ do lado
  pra voltar a usar o automático.
- funciona tanto pra vídeo novo quanto pra vídeo já publicado.
- isso fica salvo como `videoCovers` no posts.js, uma lista paralela
  a `videos` (mesma posição = mesmo vídeo). o nome do arquivo da
  thumb é baseado no próprio vídeo (não na posição dele), então
  reordenar os vídeos nunca bagunça qual thumb pertence a qual.


---

## atualização 8 — ajustes finos no mobile

- **light/dark colado no logo:** o `margin-left:auto` que empurrava
  o botão pro canto direito só tinha sido cancelado do lado do logo,
  não do lado do próprio botão — por isso ele continuava indo pro
  canto oposto. corrigido.
- **ícones sociais menores no mobile.**
- **espaço entre anos reduzido no mobile:** de 56px pra 20px de
  respiro entre uma seção de ano e a próxima.
- **linha pontilhada/serrilhada perto do cabeçalho do ano:** é um bug
  conhecido do Safari/WebKit em elementos `position:sticky` com fundo
  transparente — o navegador às vezes desenha uma costura na borda
  da camada de composição. adicionei as propriedades que forçam uma
  promoção de camada "limpa" (`translateZ(0)` + `backface-visibility`),
  que é a correção padrão pra esse bug específico.
- **thumb de vídeo ao editar um post já publicado:** já funciona —
  o ícone 🖼 aparece em qualquer vídeo, publicado ou novo, desde a
  atualização anterior.
