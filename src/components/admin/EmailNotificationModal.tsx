import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle2 } from 'lucide-react';
import { StatusEmailNotification } from '../../types';

interface EmailNotificationModalProps {
  notification: StatusEmailNotification | null;
  onClose: () => void;
  onSend: (message: string) => void;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  notification,
  onClose,
  onSend,
}) => {
  const [customMessage, setCustomMessage] = useState(notification?.messageText || '');
  const [sent, setSent] = useState(false);

  if (!notification) return null;

  const handleSend = () => {
    setSent(true);
    setTimeout(() => {
      onSend(customMessage);
      setSent(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Mail className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Notificação por E-mail ao Beneficiário
            </h3>
            <span className="text-xs text-slate-500">
              Disparo automático de atualização de status (Serviço de Notificações)
            </span>
          </div>
        </div>

        {sent ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">E-mail enviado com sucesso!</h4>
            <p className="text-xs text-slate-600">
              O beneficiário {notification.beneficiaryName} foi notificado sobre a alteração para status{' '}
              <strong>{notification.newStatus}</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div>
                <strong className="text-slate-700">Destinatário:</strong> {notification.beneficiaryName} ({notification.beneficiaryEmail || 'E-mail não informado - via WhatsApp'})
              </div>
              <div>
                <strong className="text-slate-700">Projeto:</strong> {notification.project}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-500">Alteração:</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold text-[11px]">
                  {notification.previousStatus}
                </span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                  {notification.newStatus}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Mensagem do E-mail (Editável)
              </label>
              <textarea
                rows={5}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Dispensar Notificação
              </button>

              <button
                type="button"
                onClick={handleSend}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirmar & Enviar E-mail</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
