import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Share,
  PlusSquare,
  Smartphone,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { usePwa } from '../../pwa/usePwa';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';

export const PwaInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isOnline,
    hasUpdate,
    promptInstall,
    updateApp,
  } = usePwa();

  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('ana_pwa_banner_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('ana_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    const success = await promptInstall();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    }
  };

  return (
    <>
      {/* 1. Alerta de Modo Offline */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-bold px-4 py-2 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Você está navegando offline. O aplicativo PWA continua funcionando com as informações salvas no dispositivo.
          </span>
        </div>
      )}

      {/* 2. Banner de Atualização Disponível do Service Worker */}
      {hasUpdate && (
        <div className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-md z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center justify-between gap-4 animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">Nova versão disponível!</p>
              <p className="text-[11px] text-slate-400">Atualize para ver as últimas novidades da Associação.</p>
            </div>
          </div>
          <button
            onClick={updateApp}
            className="px-3.5 py-2 text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>
        </div>
      )}

      {/* 3. Banner de Instalação do PWA (Desktop & Mobile) */}
      {!isInstalled && !dismissed && (isInstallable || isIOS) && (
        <aside
          aria-label="Instalação do Aplicativo"
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-2xl border border-amber-200/90 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl p-1 bg-gradient-to-br from-amber-500 to-orange-600 shrink-0 shadow-md flex items-center justify-center">
                <NovoAmanhecerLogo size="sm" showText={false} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Instalar Aplicativo Nativo
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    PWA Grátis
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  Acesse os projetos, fotos do Instagram e chave PIX com 1 toque na tela inicial, mesmo sem internet.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Dispensar aviso de instalação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2.5">
            <button
              onClick={handleInstallClick}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-black shadow-md shadow-amber-600/20 hover:shadow-amber-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isIOS ? 'Como Instalar no iPhone' : 'Instalar Agora'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Depois
            </button>
          </div>
        </aside>
      )}

      {/* 4. Notificação de Instalação Concluída */}
      {installSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>Aplicativo instalado com sucesso na sua tela inicial!</span>
        </div>
      )}

      {/* 5. Modal Especial de Instruções para iPhone / iPad (Safari) */}
      {showIOSModal && (
        <div
          onClick={() => setShowIOSModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Instalar no iPhone / iPad</h3>
                  <p className="text-[11px] text-slate-500">Adicione à tela de início em 3 passos simples</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 font-black flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Toque no botão Compartilhar</span>
                    <Share className="w-4 h-4 text-sky-600 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Localizado na barra inferior do Safari (no iPhone) ou no topo (no iPad).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Role e selecione "Adicionar à Tela de Início"</span>
                    <PlusSquare className="w-4 h-4 text-amber-700 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    O ícone oficial da Associação Novo Amanhecer será preparado.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    Toque em "Adicionar" no canto superior direito
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pronto! O app agora funciona direto da sua tela inicial como um app nativo.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Entendi, obrigado!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
