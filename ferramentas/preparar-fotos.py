#!/usr/bin/env python3
"""
PREPARAR-FOTOS — arruma um post de fotos inteiro de uma vez.

O que faz:
  1. pega todas as imagens de uma pasta qualquer (na ordem alfabética)
  2. renomeia pra 01.jpg, 02.jpg, 03.jpg ...
  3. reduz o lado maior pra 2000px  -> media/SLUG/
  4. gera a miniatura de 600px      -> media/SLUG/thumbs/
  5. imprime o bloco pronto pra colar no posts.js

Instalar uma vez:
    pip install pillow

Usar (dentro da pasta do site):
    python ferramentas/preparar-fotos.py "C:/Users/voce/Desktop/rolo01" helios-swirl

O original nunca é alterado — sempre grava cópia dentro de media/.
"""

import sys, os
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta a biblioteca Pillow. Rode:  pip install pillow")

LADO_MAIOR = 2000    # px da imagem grande do visor
LADO_THUMB = 600     # px da miniatura do grid
QUALIDADE  = 88
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}


def salvar(img, destino, lado):
    img = ImageOps.exif_transpose(img)          # respeita a rotação da câmera
    img = img.convert("RGB")
    img.thumbnail((lado, lado), Image.LANCZOS)
    destino.parent.mkdir(parents=True, exist_ok=True)
    img.save(destino, "JPEG", quality=QUALIDADE, optimize=True, progressive=True)


def main():
    if len(sys.argv) < 3:
        sys.exit("Uso: python ferramentas/preparar-fotos.py <pasta-de-origem> <slug>")

    origem = Path(sys.argv[1]).expanduser()
    slug   = sys.argv[2].strip().lower()

    if not origem.is_dir():
        sys.exit(f"Pasta não encontrada: {origem}")

    arquivos = sorted(p for p in origem.iterdir() if p.suffix.lower() in EXTS)
    if not arquivos:
        sys.exit("Nenhuma imagem nessa pasta.")

    destino = Path("media") / slug
    for i, arq in enumerate(arquivos, start=1):
        nome = f"{i:02d}.jpg"
        with Image.open(arq) as im:
            salvar(im.copy(), destino / nome, LADO_MAIOR)
        with Image.open(arq) as im:
            salvar(im.copy(), destino / "thumbs" / nome, LADO_THUMB)
        print(f"  {arq.name}  ->  media/{slug}/{nome}")

    print(f"\n{len(arquivos)} imagem(ns) prontas.\nCole isto no posts.js:\n")
    print(f"""  {{
    slug: "{slug}",
    title: "TÍTULO AQUI",
    date: "AAAA-MM-DD",
    location: "",
    tags: ["Photo"],
    photos: {len(arquivos)},
    page: false
  }},""")


if __name__ == "__main__":
    main()
