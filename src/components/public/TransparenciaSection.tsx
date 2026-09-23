import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Download, ExternalLink, Building2, MapPin, Award } from 'lucide-react';
import { SiteContent } from '../../types';

interface TransparenciaSectionProps {
  content: SiteContent;
}

export const TransparenciaSection: React.FC<TransparenciaSectionProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'documentos' | 'destinacao'>('dados');

  const documentos = [
    {
      titulo: 'Estatuto Social Registrado em Cartório',
      descricao: 'Documento de fundação da Associação Novo Amanhecer com objetivos sociais e regras estatutárias.',
      ano: '2019 / Atualizado',
      tipo: 'PDF Oficial',
    },
    {
      titulo: 'Comprovante de Inscrição e Situação Cadastral (CNPJ)',
      descricao: `Inscrição Ativa sob o número ${content.contato_cnpj} junto à Receita Federal do Brasil.`,
      ano: 'Ativo e Regular',
      tipo: 'Certidão Federal',
    },
    {
      titulo: 'Ata de Eleição da Diretoria e Conselho Fiscal',
      descricao: 'Composição da diretoria voluntária e responsáveis legais pela gestão comunitária.',
      ano: 'Gestão Vigente',
      tipo: 'Ata Registrada',
    },
    {
      titulo: 'Relatório de Atividades & Prestação de Contas Anual',
      descricao: 'Demonstrativo de entradas de doações, despesas com uniformes, sapatilhas, eventos e kits.',
      ano: 'Exercício 2024/2025',
      tipo: 'Relatório Social',
    },
  ];

  return (
    <section id="transparencia" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho no padrão Time da Inclusão */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold tracking-wide uppercase mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Transparência & Ética Comunitária</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Cada centavo vira esporte, carinho e futuro em Trindade
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            A Associação Novo Amanhecer é conduzida com portas abertas e compromisso absoluto.
            Aqui você acompanha os dados oficiais, documentos e a destinação de cada apoio recebido.
          </p>

          {/* Abas */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setActiveTab('dados')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'dados'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Dados Cadastrais
            </button>
            <button
              onClick={() => setActiveTab('documentos')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'documentos'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Documentos & Estatuto
            </button>
            <button
              onClick={() => setActiveTab('destinacao')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'destinacao'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Como Aplicamos os Recursos
            </button>
          </div>
        </div>

        {/* Conteúdo Aba: Dados Cadastrais */}
        {activeTab === 'dados' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Bloco 1: Identificação Institucional */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                Identificação Jurídica
              </h3>
              <p className="text-base font-extrabold text-slate-900">
                Associação Novo Amanhecer
              </p>
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">CNPJ:</span>{' '}
                  <span className="font-mono text-slate-900 font-bold">{content.contato_cnpj}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Natureza Jurídica:</span>{' '}
                  <span>Associação Privada Sem Fins Lucrativos</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Situação:</span>{' '}
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativa e Regular
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco 2: Sede Comunitária Oficial */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800 mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                Sede e Endereço Oficial
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                {content.contato_endereco}
              </p>
              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Município / UF:</span> Trindade / Goiás
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Bairro:</span> Setor Ponta Kayana
                </div>
                <div>
                  <span className="font-semibold text-slate-800">CEP:</span> 75384-155
                </div>
              </div>
            </div>

            {/* Bloco 3: Compromisso de Governança */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800 mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                Governança & Comunidade
              </h3>
              <p className="text-base font-extrabold text-slate-900">
                Gestão Compartilhada
              </p>
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <p>
                  Nossa diretoria e corpo técnico são formados por voluntários dedicados, sem remuneração pela função estatutária.
                </p>
                <div className="pt-2 text-slate-800 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Prestação de contas periódica aos apoiadores
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Aba: Documentos */}
        {activeTab === 'documentos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
            {documentos.map((doc, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all shadow-2xs flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <FileText className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{doc.titulo}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {doc.ano}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{doc.descricao}</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      {doc.tipo}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Documento "${doc.titulo}" disponível na secretaria da Associação em Trindade-GO.`)}
                  className="p-2.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Solicitar cópia do documento"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Conteúdo Aba: Destinação dos Recursos */}
        {activeTab === 'destinacao' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs animate-in fade-in duration-300">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              Para onde vai a sua ajuda?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Como uma ONG de base comunitária, aplicamos 100% das doações diretamente nas atividades que beneficiam as crianças e as famílias de Trindade:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-2xl font-black text-amber-800">40%</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Materiais & Esporte</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Chuteiras, bolas, sapatilhas de ballet, figurinos de dança e uniformes para os treinos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-2xl font-black text-emerald-800">25%</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Lanches & Nutrição</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Frutas, sucos e lanche nutritivo servido para as crianças ao final de cada treino e ensaio.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                <span className="text-2xl font-black text-rose-800">20%</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Kits Maternidade</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Fraldas, enxovais, fotos tratadas e acolhimento para o Projeto Book Solidário.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <span className="text-2xl font-black text-blue-800">15%</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Festas Comunitárias</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Locação de brinquedos infláveis, presentes, doces e confraternização no Dia das Crianças e Natal.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
