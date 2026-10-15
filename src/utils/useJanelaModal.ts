// Comportamento de acessibilidade comum a todas as janelas (modais) do site e do painel:
// - Esc fecha a janela;
// - ao abrir, o foco vai para dentro dela (o leitor de tela anuncia o título);
// - ao fechar, o foco volta para o botão que a abriu.
// Uso: const janela = useJanelaModal(aberto, fechar);
//      <div ref={janela} role="dialog" aria-modal="true" aria-labelledby="..." tabIndex={-1}>
import { useEffect, useRef } from 'react';

export function useJanelaModal(aberto: boolean, aoFechar: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  // Guarda sempre a versão mais recente de aoFechar sem reabrir o efeito a cada render
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar.current();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      anterior?.focus?.();
    };
  }, [aberto]);

  return ref;
}
