import React from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2, UserCheck } from 'lucide-react';

interface PoliticaPrivacidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PoliticaPrivacidadeModal: React.FC<PoliticaPrivacidadeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/70 to-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Aviso de Privacidade & Proteção de Dados (LGPD)
              </h3>
              <p className="text-xs text-slate-500">
                Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 leading-relaxed">
          <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl flex items-start gap-3 text-orange-950">
            <Lock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong>Compromisso de Sigilo e Segurança:</strong> A Associação Novo Amanhecer (CNPJ: 35.157.094/0001-91) trata os dados cadastrais de famílias, crianças e voluntários com respeito absoluto, confidencialidade e segurança, nunca comercializando ou compartilhando dados com terceiros não autorizados.
            </div>
          </div>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-orange-600" />
              1. Quais dados coletamos e por quê?
            </h4>
            <p className="text-xs">
              Para viabilizar o acolhimento nos projetos sociais (Ballet Solidário, Escolinha de Futebol, Book de Gestantes e Ações Comunitárias), coletamos:
            </p>
            <ul className="text-xs list-disc list-inside space-y-1 pl-2 text-slate-700">
              <li><strong>Nome Completo e Data de Nascimento:</strong> Para adequação às faixas etárias de turmas e atividades esportivas/culturais.</li>
              <li><strong>CPF (Cadastro de Pessoa Física):</strong> Para identificação unívoca do beneficiário ou responsável legal, evitando duplicidade e assegurando a prestação de contas transparente.</li>
              <li><strong>Telefone/WhatsApp:</strong> Para avisos de horários, convocações, eventos comunitários e confirmação de presença.</li>
              <li><strong>Endereço Residencial:</strong> Para comprovação de vínculo com a comunidade de Trindade/GO (Setor Ponta Kayana e adjacências).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              2. Proteção e Níveis de Acesso (RBAC)
            </h4>
            <p className="text-xs">
              Os dados sensíveis são armazenados em banco de dados protegido com criptografia. Nosso sistema conta com <strong>Controle de Acesso Baseado em Papéis (RBAC)</strong> verificado no servidor: voluntários operacionais não têm acesso a CPFs desmascarados ou endereços residenciais completos, resguardando a privacidade das crianças e famílias.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <UserCheck className="w-4 h-4 text-orange-600" />
              3. Seus Direitos como Titular (Art. 18 da LGPD)
            </h4>
            <p className="text-xs">
              Você pode a qualquer momento solicitar à nossa equipe:
            </p>
            <ul className="text-xs list-disc list-inside space-y-1 pl-2 text-slate-700">
              <li>Confirmação da existência de tratamento dos seus dados.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.</li>
              <li>Revogação do consentimento concedido.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-orange-600" />
              4. Contato com a Coordenação de Privacidade
            </h4>
            <p className="text-xs">
              Para tirar dúvidas ou exercer seus direitos de privacidade, entre em contato pelo e-mail <strong>contato@novoamanhecertrindade.org.br</strong> ou pelo WhatsApp oficial <strong>(62) 99341-8820</strong>.
            </p>
          </section>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Entendido e Ciente
          </button>
        </div>
      </div>
    </div>
  );
};
