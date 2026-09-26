import { db, logAudit } from './db.js';

export interface EmailMessage {
  tipo: 'NOVO_BENEFICIARIO' | 'NOVO_VOLUNTARIO' | 'NOVA_DOACAO' | 'CONFIRMACAO_BENEFICIARIO' | 'CONFIRMACAO_VOLUNTARIO' | 'CONFIRMACAO_DOACAO' | 'AVISO_SISTEMA';
  destinatario: string;
  assunto: string;
  corpo: string;
  corpoLog?: string;
}

/**
 * Obtém o e-mail oficial configurado para receber notificações da coordenação.
 */
export function getCoordinationEmail(): string {
  // 1. Variável de ambiente (se definida)
  if (process.env.COORDINATION_EMAIL && process.env.COORDINATION_EMAIL.trim()) {
    return process.env.COORDINATION_EMAIL.trim();
  }

  // 2. E-mail de contato cadastrado no CMS (site_content)
  try {
    const row = db.prepare('SELECT content_json FROM site_content WHERE id = ?').get('main') as { content_json: string } | undefined;
    if (row && row.content_json) {
      const parsed = JSON.parse(row.content_json);
      if (parsed.contato_email && parsed.contato_email.includes('@')) {
        return parsed.contato_email.trim();
      }
    }
  } catch {
    // Continua para o fallback padrão
  }

  // 3. Fallback padrão da associação
  return 'coordenacao@novoamanhecer.org.br';
}

/**
 * Registra e despacha um e-mail do sistema.
 * Grava na tabela email_logs para auditoria e histórico no painel administrativo.
 */
export async function sendSystemEmail(msg: EmailMessage): Promise<boolean> {
  const id = `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();
  const corpoLog = msg.corpoLog ?? msg.corpo;

  if (!apiKey || !emailFrom) {
    try {
      db.prepare(`
        INSERT INTO email_logs (id, tipo, destinatario, assunto, corpo, status, enviado_em)
        VALUES (?, ?, ?, ?, ?, 'NAO_ENVIADO', ?)
      `).run(id, msg.tipo, msg.destinatario, msg.assunto, corpoLog, now);
      console.warn('[EMAIL WARNING] RESEND_API_KEY ou EMAIL_FROM não configurado. E-mail não enviado.');
      return false;
    } catch (err: any) {
      console.error(`[EMAIL ERROR] Falha ao registrar e-mail não enviado para ${msg.destinatario}:`, err);
      return false;
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [msg.destinatario],
        subject: msg.assunto,
        text: msg.corpo,
        signal: AbortSignal.timeout(10_000),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Resend respondeu ${response.status}: ${errorBody}`);
    }

    db.prepare(`
      INSERT INTO email_logs (id, tipo, destinatario, assunto, corpo, status, enviado_em)
      VALUES (?, ?, ?, ?, ?, 'ENVIADO', ?)
    `).run(id, msg.tipo, msg.destinatario, msg.assunto, corpoLog, now);

    logAudit({
      action: 'EMAIL_SENT',
      entity: 'NOTIFICATION',
      entityId: id,
      details: `E-mail [${msg.tipo}] enviado com sucesso para ${msg.destinatario}: "${msg.assunto}"`,
    });

    console.log(`[EMAIL DISPATCH] Para: ${msg.destinatario} | Assunto: ${msg.assunto}`);
    return true;
  } catch (err: any) {
    console.error(`[EMAIL ERROR] Falha ao enviar e-mail para ${msg.destinatario}:`, err);
    try {
      db.prepare(`
        INSERT INTO email_logs (id, tipo, destinatario, assunto, corpo, status, enviado_em)
        VALUES (?, ?, ?, ?, ?, 'FALHOU', ?)
      `).run(id, msg.tipo, msg.destinatario, msg.assunto, corpoLog, now);
    } catch (logErr: any) {
      console.error('[EMAIL ERROR] Falha ao registrar o envio como FALHOU:', logErr);
    }
    return false;
  }
}

/**
 * Notifica a coordenação sobre nova inscrição de beneficiário.
 */
export async function notifyCoordinationNewBeneficiary(beneficiary: {
  nome: string;
  cpf: string;
  telefone: string;
  projeto: string;
  endereco?: string;
  email?: string;
}) {
  const coordEmail = getCoordinationEmail();
  const assunto = `[Novo Cadastro] Inscrição recebida: ${beneficiary.nome} (${beneficiary.projeto})`;
  const corpo = `
Olá, Coordenação da Associação Novo Amanhecer!

Uma nova solicitação de inscrição foi registrada no portal público:

- Nome do Beneficiário / Criança: ${beneficiary.nome}
- CPF: ${beneficiary.cpf}
- Telefone / WhatsApp: ${beneficiary.telefone}
- E-mail informado: ${beneficiary.email || 'Não informado'}
- Endereço: ${beneficiary.endereco || 'Trindade - GO'}
- Projeto Desejado: ${beneficiary.projeto}
- Data/Hora: ${new Date().toLocaleString('pt-BR')}

Acesse o Painel Administrativo em /admin para revisar os dados, verificar a disponibilidade de vagas e aprovar o atendimento.

Associação Novo Amanhecer · Trindade/GO
Setor Ponta Kayana
  `.trim();

  return sendSystemEmail({
    tipo: 'NOVO_BENEFICIARIO',
    destinatario: coordEmail,
    assunto,
    corpo,
  });
}

/**
 * Envia e-mail de confirmação para a família/responsável pelo beneficiário.
 */
export async function sendBeneficiaryConfirmation(beneficiary: {
  nome: string;
  email?: string;
  projeto: string;
}) {
  if (!beneficiary.email || !beneficiary.email.includes('@') || beneficiary.email.includes('nao') || beneficiary.email.includes('sem')) {
    return false;
  }

  const assunto = `Recebemos sua inscrição na Associação Novo Amanhecer! (${beneficiary.projeto})`;
  const corpo = `
Olá, ${beneficiary.nome}!

Recebemos com muito carinho a sua inscrição para o projeto "${beneficiary.projeto}" na Associação Novo Amanhecer, em Trindade - GO.

Próximos Passos:
1. Nossa equipe de acolhimento e assistência social analisará as informações cadastradas.
2. Assim que houver vaga disponível na turma ou na próxima oficina, entraremos em contato diretamente pelo seu telefone / WhatsApp.
3. Se precisar tirar dúvidas ou nos fazer uma visita:
   - Sede: Rua 14, Qd. 23, Lt. 05 - Setor Ponta Kayana, Trindade/GO
   - Atendimento: Segunda a Sexta, das 08h às 17h | Sábados das 08h às 12h

Agradecemos imensamente a sua confiança em nosso trabalho comunitário!

Com afeto,
Equipe da Associação Novo Amanhecer
  `.trim();

  return sendSystemEmail({
    tipo: 'CONFIRMACAO_BENEFICIARIO',
    destinatario: beneficiary.email,
    assunto,
    corpo,
  });
}

/**
 * Notifica a coordenação sobre nova inscrição de voluntário.
 */
export async function notifyCoordinationNewVolunteer(volunteer: {
  nome: string;
  telefone: string;
  email: string;
  area: string;
  disponibilidade: string;
}) {
  const coordEmail = getCoordinationEmail();
  const assunto = `[Novo Voluntário] Interesse em apoiar: ${volunteer.nome} (${volunteer.area})`;
  const corpo = `
Olá, Coordenação da Associação Novo Amanhecer!

Um novo coração generoso se disponibilizou como voluntário(a) pelo portal:

- Nome: ${volunteer.nome}
- WhatsApp: ${volunteer.telefone}
- E-mail: ${volunteer.email}
- Área de Atuação: ${volunteer.area}
- Disponibilidade de Horários: ${volunteer.disponibilidade}
- Data/Hora: ${new Date().toLocaleString('pt-BR')}

Entre em contato com o voluntário via WhatsApp para agendar a integração na sede.

Associação Novo Amanhecer · Trindade/GO
  `.trim();

  return sendSystemEmail({
    tipo: 'NOVO_VOLUNTARIO',
    destinatario: coordEmail,
    assunto,
    corpo,
  });
}

/**
 * Envia e-mail de confirmação para o novo voluntário.
 */
export async function sendVolunteerConfirmation(volunteer: {
  nome: string;
  email: string;
  area: string;
}) {
  if (!volunteer.email || !volunteer.email.includes('@')) {
    return false;
  }

  const assunto = `Muito obrigado por se voluntariar na Associação Novo Amanhecer!`;
  const corpo = `
Olá, ${volunteer.nome}!

Ficamos muito felizes com a sua disposição em caminhar junto conosco no projeto "${volunteer.area}". A força da nossa associação vem exatamente da dedicação voluntária de pessoas como você.

Nossa coordenação entrará em contato via WhatsApp para marcarmos um café de boas-vindas e combinarmos os detalhes da sua participação.

Seja muito bem-vindo(a) à família Novo Amanhecer!

Associação Novo Amanhecer
Setor Ponta Kayana · Trindade/GO
  `.trim();

  return sendSystemEmail({
    tipo: 'CONFIRMACAO_VOLUNTARIO',
    destinatario: volunteer.email,
    assunto,
    corpo,
  });
}

/**
 * Notifica a coordenação sobre nova doação ou intenção registrada.
 */
export async function notifyCoordinationNewDonation(donation: {
  nome: string;
  valor: number;
  metodo: string;
  mensagem?: string;
  email?: string;
  telefone?: string;
}) {
  const coordEmail = getCoordinationEmail();
  const valorFormatado = Number(donation.valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const assunto = `[Doação Recebida] ${donation.nome} contribuiu com ${valorFormatado}`;
  const corpo = `
Olá, Coordenação da Associação Novo Amanhecer!

Uma nova doação via ${donation.metodo} foi registrada no portal oficial:

- Doador(a): ${donation.nome}
- Valor: ${valorFormatado}
- Método: ${donation.metodo}
- Contato: ${donation.telefone || donation.email || 'Não informado'}
- Mensagem de Apoio: "${donation.mensagem || 'Sem mensagem adicional'}"
- Data/Hora: ${new Date().toLocaleString('pt-BR')}

Você pode consultar e confirmar este valor no extrato bancário oficial da entidade e acompanhar os registros no Painel Administrativo (/admin).

Gratidão a todos que apoiam o projeto social!
Associação Novo Amanhecer
  `.trim();

  return sendSystemEmail({
    tipo: 'NOVA_DOACAO',
    destinatario: coordEmail,
    assunto,
    corpo,
  });
}

/**
 * Envia e-mail de agradecimento e confirmação para o doador.
 */
export async function sendDonationConfirmation(donation: {
  nome: string;
  email?: string;
  valor: number;
  metodo: string;
}) {
  if (!donation.email || !donation.email.includes('@')) {
    return false;
  }

  const valorFormatado = Number(donation.valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const assunto = `Agradecimento pela sua doação de ${valorFormatado} à Associação Novo Amanhecer`;
  const corpo = `
Olá, ${donation.nome}!

Recebemos com imensa alegria a sua contribuição de ${valorFormatado} via ${donation.metodo} para a Associação Novo Amanhecer.

Cada centavo doado se transforma diretamente em:
- Sapatilhas e figurinos para as alunas do Ballet Solidário;
- Bolas, redes e chuteiras para as turmas de Futebol Comunitário;
- Kits completos de enxoval para as mães atendidas no Book de Gestantes;
- Lanches e comemorações nas datas especiais das crianças de Trindade/GO.

Você pode acompanhar a aplicação dos recursos e nossa prestação de contas no portal oficial ou fazendo-nos uma visita em nossa sede no Setor Ponta Kayana.

De coração, muito obrigado por transformar vidas junto conosco!

Associação Novo Amanhecer
CNPJ: 50.123.456/0001-78
Trindade - Goiás
  `.trim();

  return sendSystemEmail({
    tipo: 'CONFIRMACAO_DOACAO',
    destinatario: donation.email,
    assunto,
    corpo,
  });
}
