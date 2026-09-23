import React, { useState } from 'react';
import { Save, Check, RotateCcw } from 'lucide-react';
import { SiteContent } from '../../types';
import { INITIAL_SITE_CONTENT } from '../../data/initialData';

interface CmsConteudoProps {
  content: SiteContent;
  onUpdateContent: (content: SiteContent) => void;
}

export const CmsConteudo: React.FC<CmsConteudoProps> = ({ content, onUpdateContent }) => {
  const [formData, setFormData] = useState<SiteContent>(content);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateContent(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Deseja restaurar os textos originais da Associação Novo Amanhecer?')) {
      setFormData(INITIAL_SITE_CONTENT);
      onUpdateContent(INITIAL_SITE_CONTENT);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Edição de Textos do Site (CMS Sem Código)</h3>
          <p className="text-xs text-slate-500">
            Atualize frases da página inicial, história, números de impacto e chave PIX. As alterações são aplicadas instantaneamente no site público.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Textos Padrão</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloco 1: Página Inicial / Hero */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
            1. Seção Principal (Hero)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tagline Superior
              </label>
              <input
                type="text"
                value={formData.hero_tagline}
                onChange={(e) => setFormData({ ...formData, hero_tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Link do Instagram Oficial
              </label>
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Subtítulo Acolhedor do Hero
            </label>
            <textarea
              rows={2}
              value={formData.hero_subtitle}
              onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Bloco 2: Sobre a Associação */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
            2. História, Missão, Visão e Valores
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              História Curta da Associação em Trindade
            </label>
            <textarea
              rows={3}
              value={formData.sobre_historia}
              onChange={(e) => setFormData({ ...formData, sobre_historia: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Missão
              </label>
              <textarea
                rows={3}
                value={formData.sobre_missao}
                onChange={(e) => setFormData({ ...formData, sobre_missao: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Visão
              </label>
              <textarea
                rows={3}
                value={formData.sobre_visao}
                onChange={(e) => setFormData({ ...formData, sobre_visao: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Valores
              </label>
              <textarea
                rows={3}
                value={formData.sobre_valores}
                onChange={(e) => setFormData({ ...formData, sobre_valores: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Bloco 3: Números de Impacto */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
            3. Números de Impacto Social
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Crianças Atendidas
              </label>
              <input
                type="number"
                value={formData.impacto_criancas}
                onChange={(e) => setFormData({ ...formData, impacto_criancas: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Voluntários Ativos
              </label>
              <input
                type="number"
                value={formData.impacto_voluntarios}
                onChange={(e) => setFormData({ ...formData, impacto_voluntarios: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Edições de Eventos
              </label>
              <input
                type="number"
                value={formData.impacto_eventos}
                onChange={(e) => setFormData({ ...formData, impacto_eventos: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Projetos Ativos
              </label>
              <input
                type="number"
                value={formData.impacto_projetos}
                onChange={(e) => setFormData({ ...formData, impacto_projetos: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>

        {/* Bloco 4: Dados de Contato e Chave PIX */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
            4. Dados Oficiais & Chave PIX
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Chave PIX Oficial (CNPJ)
              </label>
              <input
                type="text"
                value={formData.contato_pix_chave}
                onChange={(e) => setFormData({ ...formData, contato_pix_chave: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={formData.contato_cnpj}
                onChange={(e) => setFormData({ ...formData, contato_cnpj: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                WhatsApp de Atendimento
              </label>
              <input
                type="text"
                value={formData.contato_whatsapp}
                onChange={(e) => setFormData({ ...formData, contato_whatsapp: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Mensagem Inicial do WhatsApp (Botão Flutuante "Fale Conosco")
            </label>
            <input
              type="text"
              value={formData.contato_whatsapp_mensagem || ''}
              onChange={(e) => setFormData({ ...formData, contato_whatsapp_mensagem: e.target.value })}
              placeholder="Ex: Olá! Vim pelo site da Associação Novo Amanhecer e gostaria de mais informações..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Esta mensagem será aberta automaticamente no chat do WhatsApp quando o visitante clicar no botão flutuante.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Endereço da Sede em Trindade
              </label>
              <input
                type="text"
                value={formData.contato_endereco}
                onChange={(e) => setFormData({ ...formData, contato_endereco: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                E-mail Institucional
              </label>
              <input
                type="email"
                value={formData.contato_email}
                onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              URL da Página Oficial no Instagram (Alimenta o Feed em Tempo Real)
            </label>
            <input
              type="url"
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="https://www.instagram.com/anovoamanhecer"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-pink-700"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              O feed de fotos e stories do site puxa automaticamente o perfil e as atualizações a partir deste link.
            </p>
          </div>
        </div>

        {/* Botão Salvar CMS */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Textos atualizados com sucesso no site!</span>
            </span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações no Site</span>
          </button>
        </div>
      </form>
    </div>
  );
};
