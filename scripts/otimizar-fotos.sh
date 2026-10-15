#!/usr/bin/env bash
# Gera as versões WebP das fotos fixas do site (public/fotos/*.jpg):
#   foto.webp      até 1600 px de largura (computador)
#   foto-800.webp  até 800 px de largura (celular)
#   foto-400.webp  até 400 px de largura (miniaturas da galeria)
# O componente <Foto> (src/components/public/Foto.tsx) escolhe a melhor automaticamente.
# Os .jpg originais continuam: servem de reserva e para a prévia de links (WhatsApp/Facebook).
# Requer ImageMagick (comando "magick" ou "convert"). Uso: npm run fotos
set -euo pipefail
cd "$(dirname "$0")/../public/fotos"
IM=$(command -v magick || command -v convert)
for jpg in *.jpg; do
  base="${jpg%.jpg}"
  "$IM" "$jpg" -auto-orient -strip -resize '1600x>' -quality 78 "$base.webp"
  "$IM" "$jpg" -auto-orient -strip -resize '800x>' -quality 75 "$base-800.webp"
  "$IM" "$jpg" -auto-orient -strip -resize '400x>' -quality 72 "$base-400.webp"
  printf '%-36s %5s KB → %5s / %5s / %5s KB (1600 / 800 / 400 px)\n' "$jpg" \
    $(( $(stat -c%s "$jpg") / 1024 )) $(( $(stat -c%s "$base.webp") / 1024 )) \
    $(( $(stat -c%s "$base-800.webp") / 1024 )) $(( $(stat -c%s "$base-400.webp") / 1024 ))
done
