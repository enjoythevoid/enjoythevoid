@echo off
REM Abre o site no navegador com um servidor local.
REM Necessario porque as paginas de post leem arquivos .md,
REM e o navegador bloqueia isso quando o arquivo e aberto direto.
cd /d "%~dp0"
start "" http://localhost:8000
python -m http.server 8000
