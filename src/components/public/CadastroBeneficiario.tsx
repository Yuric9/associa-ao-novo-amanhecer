import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  MapPin,
  Sparkles,
  MessageCircle,
  HeartHandshake,
  ShieldCheck,
  Search,
  Loader2,
  Building2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { Beneficiary, ProjectCard } from '../../types';
import {
  validateCPF,
  formatCPF,
  formatPhone,
  formatCEP,
  cleanDigits,
} from '../../utils/validation';

interface CadastroBeneficiarioProps {
  projects: ProjectCard[];
  beneficiaries: Beneficiary[];
  onAddBeneficiary: (beneficiary: Beneficiary) => void;
  defaultProject?: string;
  onOpenPrivacidade?: () => void;
}

export const CadastroBeneficiario: React.FC<CadastroBeneficiarioProps> = ({
  projects,
  beneficiaries,
  onAddBeneficiary,
  defaultProject,
  onOpenPrivacidade,
}) => {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  // Estados de Endereço com Integração ViaCEP
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Trindade');
  const [uf, setUf] = useState('GO');
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [cepSuccess, setCepSuccess] = useState(false);
  const [manualAddressMode, setManualAddressMode] = useState(false);
  const [manualEndereco, setManualEndereco] = useState('');

  const [projeto, setProjeto] = useState(defaultProject || 'Aulas de Ballet Solidário');
  const [observacoes, setObservacoes] = useState('');

  // Estados de Segurança e LGPD
  const [consentimentoLgpd, setConsentimentoLgpd] = useState(true);
  const [hpSecurityCheck, setHpSecurityCheck] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Estados de feedback
  const [existingBeneficiary, setExistingBeneficiary] = useState<Beneficiary | null>(null);
  const [submittedBeneficiary, setSubmittedBeneficiary] = useState<Beneficiary | null>(null);

  const activeProjects = projects.filter((p) => p.ativo);

  // Consulta automática à API do ViaCEP
  const fetchAddressByCep = async (cepValue: string) => {
    const raw = cleanDigits(cepValue);
    if (raw.length !== 8) return;

    setIsCepLoading(true);
    setCepError('');
    setCepSuccess(false);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      if (!res.ok) throw new Error('Erro ao consultar ViaCEP');

      const data = await res.json();

      if (data.erro) {
        setCepError('CEP não localizado. Preencha os campos abaixo manualmente.');
        setCepSuccess(false);
        return;
      }

      // Preenchimento automático com os dados oficiais do ViaCEP
      if (data.logradouro) setLogradouro(data.logradouro);
      if (data.bairro) setBairro(data.bairro);
      if (data.localidade) setCidade(data.localidade);
      if (data.uf) setUf(data.uf);

      setCepSuccess(true);
      setCepError('');

      // Foca automaticamente no campo do número / lote
      setTimeout(() => {
        document.getElementById('cadastro-numero')?.focus();
      }, 120);
    } catch (err) {
      console.error('Falha na requisição ViaCEP:', err);
      setCepError('Serviço de CEP indisponível no momento. Preencha manualmente.');
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    setCepError('');
    setCepSuccess(false);

    const digits = cleanDigits(formatted);
    if (digits.length === 8) {
      fetchAddressByCep(digits);
    }
  };

  // Preencher atalho com o CEP da Associação (Setor Ponta Kayana)
  const handleQuickFillSedeCep = () => {
    const sedeCep = '75384-155';
    setCep(sedeCep);
    fetchAddressByCep(sedeCep);
  };

  // Gerar string unificada do endereço
  const getFormattedAddress = () => {
    if (manualAddressMode && manualEndereco.trim()) {
      return manualEndereco.trim();
    }

    const parts = [
      logradouro.trim() && `${logradouro.trim()}${numero.trim() ? `, nº ${numero.trim()}` : ''}`,
      complemento.trim(),
      bairro.trim() && (bairro.toLowerCase().startsWith('setor') || bairro.toLowerCase().startsWith('vila') ? bairro.trim() : `Setor ${bairro.trim()}`),
      `${cidade.trim() || 'Trindade'} - ${uf.trim() || 'GO'}`,
      cep.trim() && `CEP: ${cep.trim()}`,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : '';
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    setCpfError('');
    setExistingBeneficiary(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpfError('');
    setSubmitError('');
    setExistingBeneficiary(null);

    // 1. Validação de Consentimento LGPD Obrigatório
    if (!consentimentoLgpd) {
      setSubmitError('É obrigatório concordar com o tratamento de dados (LGPD) para prosseguir com o cadastro.');
      return;
    }

    // 2. Validação Matemática Real de CPF (Módulo 11)
    if (!validateCPF(cpf)) {
      setCpfError('CPF inválido. Por favor, verifique os dígitos verificadores informados.');
      return;
    }

    // 3. Controle de Duplicidade Real por CPF limpo
    const rawCpf = cleanDigits(cpf);
    const foundExisting = beneficiaries.find(
      (b) => cleanDigits(b.cpf) === rawCpf
    );

    if (foundExisting) {
      setExistingBeneficiary(foundExisting);
      return;
    }

    // 4. Montar endereço completo
    const finalEndereco = getFormattedAddress() || 'Trindade - GO';

    // 5. Criação no Banco de Dados Real no Servidor
    setIsSubmitting(true);
    try {
      const res = await api.createBeneficiary({
        nome: nome.trim(),
        cpf: formatCPF(cpf),
        nascimento,
        telefone: telefone.trim(),
        email: email.trim() || 'Não informado',
        endereco: finalEndereco,
        projeto,
        status: 'Pendente',
        observacoes: observacoes.trim(),
        consentimento_lgpd: true,
        hp_security_check: hpSecurityCheck,
      });

      const newBeneficiary: Beneficiary = {
        id: res.id || `ben-${Date.now()}`,
        nome: nome.trim(),
        cpf: formatCPF(cpf),
        nascimento,
        telefone: telefone.trim(),
        email: email.trim() || 'Não informado',
        endereco: finalEndereco,
        projeto,
        status: 'Pendente',
        observacoes: observacoes.trim(),
        criado_em: new Date().toISOString().split('T')[0],
      };

      onAddBeneficiary(newBeneficiary);
      setSubmittedBeneficiary(newBeneficiary);

      try {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignorar se falhar animação
      }

      // Limpar formulário
      setNome('');
      setCpf('');
      setNascimento('');
      setTelefone('');
      setEmail('');
      setCep('');
      setLogradouro('');
      setNumero('');
      setComplemento('');
      setBairro('');
      setCidade('Trindade');
      setUf('GO');
      setCepSuccess(false);
      setCepError('');
      setManualEndereco('');
      setObservacoes('');
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao enviar cadastro ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="cadastro" className="py-16 sm:py-24 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
            <span>Inscrição Solidária</span>
            <span aria-hidden="true">·</span>
            <span>Sem Custos</span>
            <span aria-hidden="true">·</span>
            <span>Trindade - GO</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Cadastro de Beneficiários da Comunidade
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Cadastre seu filho(a), você mesma (para o Book de Gestante) ou sua família para nossas atividades. Nosso acolhimento é 100% gratuito.
          </p>
        </div>

        {/* Feedback: CPF Já Cadastrado (Controle de Duplicidade Inteligente) */}
        {existingBeneficiary && (
          <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-300 rounded-3xl shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-6 h-6 text-amber-800" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Este CPF já possui cadastro registrado!
                  </h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      existingBeneficiary.status === 'Aprovado'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : existingBeneficiary.status === 'Em análise'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : existingBeneficiary.status === 'Atendido/Entregue'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : existingBeneficiary.status === 'Recusado'
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}
                  >
                    Status Atual: {existingBeneficiary.status}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 mt-2">
                  Encontramos o cadastro em nome de <strong>{existingBeneficiary.nome}</strong>, inscrito no projeto{' '}
                  <strong>{existingBeneficiary.projeto}</strong> em {existingBeneficiary.criado_em}.
                </p>

                {existingBeneficiary.observacoes && (
                  <p className="text-xs text-slate-600 mt-1 italic bg-white/70 p-2.5 rounded-xl border border-amber-200/60">
                    <strong>Anotação da equipe:</strong> {existingBeneficiary.observacoes}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-amber-200/80 flex flex-wrap items-center gap-3">
                  <a
                    href="https://wa.me/5562993418820?text=Ol%C3%A1!%20Gostaria%20de%20consultar%20ou%20atualizar%20meu%20cadastro%20na%20Associa%C3%A7%C3%A3o%20Novo%20Amanhecer."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar no WhatsApp para Atualizar Dados</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setExistingBeneficiary(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-amber-100 rounded-xl transition-colors"
                  >
                    Tentar outro CPF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback: Sucesso no Novo Cadastro */}
        {submittedBeneficiary && (
          <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Cadastro Enviado com Sucesso!
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Bem-vindo(a) à Associação Novo Amanhecer!
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 mt-2">
                  Recebemos a inscrição de <strong>{submittedBeneficiary.nome}</strong> para o projeto{' '}
                  <strong>{submittedBeneficiary.projeto}</strong>. O cadastro foi registrado com status{' '}
                  <strong className="text-amber-700">Pendente</strong> e está na fila de aprovação da nossa coordenação.
                </p>
                <div className="mt-3 text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-emerald-200">
                  Nossa equipe entrará em contato via WhatsApp no número <strong>{submittedBeneficiary.telefone}</strong> para confirmar a turma, data do ensaio ou entrega dos materiais.
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmittedBeneficiary(null)}
                    className="px-4 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Fazer Outro Cadastro
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulário Principal de Cadastro */}
        <div className="bg-amber-50/30 p-6 sm:p-10 rounded-3xl border border-amber-200/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome Completo e CPF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do(a) participante ou responsável"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>CPF (com validação real) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Apenas números</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={cpf}
                  onChange={handleCpfChange}
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 shadow-2xs ${
                    cpfError
                      ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
                      : 'border-slate-200 focus:ring-amber-500'
                  }`}
                />
                {cpfError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{cpfError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Data de Nascimento e Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  required
                  value={nascimento}
                  onChange={(e) => setNascimento(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(62) 99999-9999"
                  maxLength={15}
                  value={telefone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            {/* E-mail de Contato */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                E-mail de Contato (Opcional)
              </label>
              <input
                type="email"
                placeholder="exemplo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
            </div>

            {/* SEÇÃO DE ENDEREÇO COM INTEGRAÇÃO VIACEP */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-amber-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Endereço de Residência
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Digite o CEP para preencher a rua, bairro e cidade automaticamente
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickFillSedeCep}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Preencher com o CEP do Setor Ponta Kayana"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>CEP Ponta Kayana (75384-155)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualAddressMode(!manualAddressMode)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    {manualAddressMode ? 'Usar busca por CEP' : 'Digitar em campo único'}
                  </button>
                </div>
              </div>

              {manualAddressMode ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Endereço Completo Manual *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rua 14, Qd. 05, Lt. 12, Setor Maysa II, Trindade - GO"
                    value={manualEndereco}
                    onChange={(e) => setManualEndereco(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Campo de CEP com indicador de busca ViaCEP */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>CEP *</span>
                        {isCepLoading && (
                          <span className="text-[10px] text-amber-700 flex items-center gap-1 font-normal">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Buscando...
                          </span>
                        )}
                        {cepSuccess && !isCepLoading && (
                          <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold">
                            <Check className="w-3 h-3" />
                            Localizado!
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="00000-000"
                          maxLength={9}
                          value={cep}
                          onChange={handleCepChange}
                          className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 font-mono shadow-2xs ${
                            cepError
                              ? 'border-amber-400 focus:ring-amber-500 bg-amber-50/20'
                              : cepSuccess
                              ? 'border-emerald-300 focus:ring-emerald-500'
                              : 'border-slate-200 focus:ring-amber-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => fetchAddressByCep(cep)}
                          disabled={cleanDigits(cep).length !== 8 || isCepLoading}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-amber-700 disabled:opacity-30 transition-colors cursor-pointer"
                          title="Buscar CEP na API ViaCEP"
                        >
                          {isCepLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {cepError && (
                        <p className="text-[11px] text-amber-700 font-medium mt-1">
                          {cepError}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Rua / Avenida / Alameda *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Alameda das Rosas, Rua 12, etc."
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Número e Complemento / Quadra e Lote */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Número / Lote *
                      </label>
                      <input
                        id="cadastro-numero"
                        type="text"
                        required
                        placeholder="Ex: 16, S/N, Lt. 04"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Complemento / Quadra (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Qd. 14, Chácara 26/27, Casa 2, Fundos"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Bairro, Cidade e UF */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Bairro / Setor *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Setor Ponta Kayana"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        required
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Estado (UF) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={uf}
                        onChange={(e) => setUf(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs text-center font-bold"
                      />
                    </div>
                  </div>

                  {/* Prévia do Endereço Formatado */}
                  {getFormattedAddress() && (
                    <div className="mt-2 p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-950 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[10px] uppercase tracking-wider text-amber-800 block">
                          Prévia do Endereço que será Cadastrado:
                        </span>
                        <span className="font-medium">{getFormattedAddress()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Projeto de Interesse */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Projeto Social Desejado *
              </label>
              <select
                value={projeto}
                onChange={(e) => setProjeto(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs text-slate-900 font-semibold"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.titulo}>
                    {p.titulo} ({p.idade_publico || 'Acolhimento Comunitário'})
                  </option>
                ))}
              </select>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Observações / Informações Importantes (Opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Tamanho de roupa/calçado para o ballet ou futebol; meses de gestação para o Book Solidário; restrições de saúde..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs text-slate-800"
              />
            </div>

            {/* Proteção Anti-Spam (Honeypot para robôs) */}
            <div className="hidden" aria-hidden="true">
              <label>Não preencha este campo de segurança</label>
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={hpSecurityCheck}
                onChange={(e) => setHpSecurityCheck(e.target.value)}
              />
            </div>

            {/* Aviso de Privacidade e Consentimento Obrigatório LGPD */}
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  required
                  checked={consentimentoLgpd}
                  onChange={(e) => setConsentimentoLgpd(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                />
                <span className="leading-relaxed">
                  Autorizo e concordo com o tratamento dos dados pessoais e cadastrais informados acima pela <strong>Associação Beneficente Novo Amanhecer</strong> (CNPJ 35.157.094/0001-91) para fins exclusivos de inscrição, organização de turmas e prestação de contas dos projetos sociais, em integral conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
                  {onOpenPrivacidade && (
                    <button
                      type="button"
                      onClick={onOpenPrivacidade}
                      className="text-orange-700 underline font-bold ml-1.5 hover:text-orange-900 cursor-pointer"
                    >
                      Ler Política de Privacidade
                    </button>
                  )}
                </span>
              </label>
            </div>

            {submitError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Botão de Envio */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 text-sm font-extrabold text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 disabled:opacity-60 rounded-2xl shadow-md shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando dados com segurança...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Confirmar Inscrição Gratuita</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2">
                Ao enviar, seu cadastro entrará na fila de análise da Associação Novo Amanhecer. Seus dados estão seguros e protegidos.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
