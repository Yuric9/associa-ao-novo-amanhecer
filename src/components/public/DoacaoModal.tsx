import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Copy,
  Check,
  QrCode,
  CreditCard,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { SiteContent } from '../../types';
import { generatePixPayload, generateQrCodeDataUrl } from '../../utils/pix';
import { api } from '../../services/api';

interface DoacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: SiteContent;
  initialAmount?: number;
}

export const DoacaoModal: React.FC<DoacaoModalProps> = ({
  isOpen,
  onClose,
  content,
  initialAmount = 50,
}) => {
  const [activeTab, setActiveTab] = useState<'PIX' | 'CARTAO'>('PIX');
  const [selectedAmount, setSelectedAmount] = useState<number>(initialAmount);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [hpSecurityCheck, setHpSecurityCheck] = useState('');

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pixPayload, setPixPayload] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Valores sugeridos
  const suggestedAmounts = [20, 50, 100, 250];

  const currentAmount = customAmount ? parseFloat(customAmount.replace(',', '.')) || 0 : selectedAmount;

  // Atualiza QR Code dinâmico sempre que a chave ou o valor mudam
  useEffect(() => {
    if (!content.contato_pix_chave) return;

    try {
      const payload = generatePixPayload({
        key: content.contato_pix_chave,
        name: 'ASSOC NOVO AMANHECER',
        city: 'TRINDADE',
        amount: currentAmount > 0 ? currentAmount : undefined,
      });
      setPixPayload(payload);

      generateQrCodeDataUrl(payload)
        .then((url) => setQrCodeUrl(url))
        .catch(() => {
          // Fallback para gerar QR Code a partir da chave direta
          generateQrCodeDataUrl(content.contato_pix_chave).then((url) => setQrCodeUrl(url));
        });
    } catch (err) {
      console.error('Erro ao gerar dados PIX:', err);
    }
  }, [content.contato_pix_chave, currentAmount]);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(content.contato_pix_chave);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload || content.contato_pix_chave);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 3000);
  };

  const handleAmountSelect = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9,]/g, '');
    setCustomAmount(val);
    setSelectedAmount(0);
  };

  // Telefone com máscara (XX) XXXXX-XXXX
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    }
    setTelefone(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nome.trim() || nome.trim().length < 3) {
      setError('Por favor, informe seu nome completo para emissão do comprovante/recibo.');
      return;
    }

    if (!currentAmount || currentAmount < 1) {
      setError('Por favor, escolha ou digite um valor de no mínimo R$ 1,00.');
      return;
    }

    setIsLoading(true);

    try {
      await api.createDonation({
        nome: nome.trim(),
        email: email.trim() || undefined,
        telefone: telefone.trim() || undefined,
        valor: currentAmount,
        mensagem: mensagem.trim() || undefined,
        metodo: activeTab,
        hp_security_check: hpSecurityCheck,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar sua intenção de doação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-amber-200 relative my-8">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Gratidão pelo seu Gesto de Amor!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Sua intenção de doação no valor de{' '}
              <strong className="text-amber-800 font-bold">
                {currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>{' '}
              foi gravada no sistema oficial da Associação Novo Amanhecer.
            </p>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-slate-700 space-y-2">
              <div className="font-bold text-amber-900">Próximo Passo:</div>
              <p>
                1. Conclua a transferência no app do seu banco utilizando o QR Code ou a Chave PIX oficial:
              </p>
              <div className="p-2 bg-white rounded-xl font-mono font-bold text-slate-900 text-center select-all border border-amber-100">
                {content.contato_pix_chave}
              </div>
              <p>
                2. A coordenação foi notificada e encaminhará o recibo de confirmação para{' '}
                <strong>{email || telefone || 'o seu contato'}</strong>.
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 fill-amber-700 text-amber-700" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Faça sua Doação Solidária
                </h3>
                <p className="text-xs text-slate-600">
                  Associação Novo Amanhecer · Trindade - GO · CNPJ {content.contato_cnpj}
                </p>
              </div>
            </div>

            {/* Abas de Método: PIX Oficial ou Cartão de Crédito */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('PIX')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'PIX'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4 text-amber-700" />
                <span>PIX Instantâneo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CARTAO')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'CARTAO'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cartão de Crédito</span>
              </button>
            </div>

            {/* Seleção de Valor */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Escolha o valor que deseja doar:
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {suggestedAmounts.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAmountSelect(val)}
                    className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer border ${
                      selectedAmount === val && !customAmount
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50/50 text-slate-700 border-amber-200 hover:bg-amber-100/60'
                    }`}
                  >
                    R$ {val}
                  </button>
                ))}
              </div>

              {/* Valor Livre */}
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">
                  R$
                </span>
                <input
                  type="text"
                  placeholder="Outro valor livre (ex: 75,00)"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Conteúdo PIX */}
            {activeTab === 'PIX' && (
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl mb-5">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Code Dinâmico */}
                  <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-xs shrink-0 text-center">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="QR Code PIX para doação"
                        className="w-32 h-32 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center bg-slate-50">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                      </div>
                    )}
                    <span className="text-[10px] font-semibold text-slate-500 mt-1 block">
                      {currentAmount > 0 ? `Valor: R$ ${currentAmount.toFixed(2)}` : 'Escaneie no App'}
                    </span>
                  </div>

                  {/* Chave e Botões de Cópia */}
                  <div className="flex-1 space-y-2 text-left w-full">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-900 block">
                        Chave PIX Oficial (CNPJ):
                      </span>
                      <div className="font-mono text-xs font-extrabold text-slate-900 bg-white p-2 rounded-xl border border-amber-200 flex items-center justify-between mt-1">
                        <span className="truncate select-all mr-2">{content.contato_pix_chave}</span>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="p-1 text-amber-700 hover:text-amber-900 cursor-pointer shrink-0"
                          title="Copiar Chave"
                        >
                          {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyPayload}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <QrCode className="w-3.5 h-3.5" />}
                        <span>{copiedPayload ? 'Copia & Cola OK' : 'Pix Copia e Cola'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo Cartão de Crédito / Stripe */}
            {activeTab === 'CARTAO' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-5 text-left space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Checkout Seguro com Cartão</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                    Preparado / Stripe
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para doações recorrentes ou via cartão de crédito (Visa, Mastercard, Elo), o backend está 100% estruturado. Enquanto você registra sua intenção abaixo, o recebimento via PIX é instantâneo e livre de taxas de operadoras.
                </p>
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                  💡 <strong>Dica da Associação:</strong> O PIX cai imediatamente na conta bancária da entidade sem retenção de tarifas, garantindo que 100% da sua doação vá para as crianças de Trindade/GO.
                </div>
              </div>
            )}

            {/* Formulário de Registro de Intenção de Doação */}
            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Registrar meu apoio (para recibo e transparência):</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Seu Nome ou Empresa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ana Maria da Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    E-mail (para confirmação)
                  </label>
                  <input
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="(62) 99999-0000"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mensagem ou dedicação (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Para apoiar as sapatilhas do ballet infantil..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={hpSecurityCheck}
                  onChange={(e) => setHpSecurityCheck(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-60 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Confirmar Apoio de R$ {currentAmount.toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
