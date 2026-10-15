// Envio de e-mail (Resend). O sistema só manda e-mail para RECUPERAR SENHA ("Esqueci minha senha").
// Sem RESEND_API_KEY e EMAIL_FROM configurados, nada é enviado (fica registrado como NAO_ENVIADO);
// nesse caso o administrador redefine a senha pela aba Usuários.
import { db, logAudit } from './db';
import { cfg } from './env';

export interface EmailMessage {
  tipo: 'RECUPERACAO_SENHA';
  destinatario: string;
  assunto: string;
  corpo: string;
  corpoLog?: string;
}

/**
 * Registra e despacha um e-mail do sistema.
 * Grava na tabela email_logs para auditoria e histórico no painel administrativo.
 */
export async function sendSystemEmail(msg: EmailMessage): Promise<boolean> {
  const id = `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const apiKey = cfg('RESEND_API_KEY');
  const emailFrom = cfg('EMAIL_FROM');
  const corpoLog = msg.corpoLog ?? msg.corpo;

  if (!apiKey || !emailFrom) {
    try {
      await db.prepare(`
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
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Resend respondeu ${response.status}: ${errorBody}`);
    }

    await db.prepare(`
      INSERT INTO email_logs (id, tipo, destinatario, assunto, corpo, status, enviado_em)
      VALUES (?, ?, ?, ?, ?, 'ENVIADO', ?)
    `).run(id, msg.tipo, msg.destinatario, msg.assunto, corpoLog, now);

    await logAudit({
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
      await db.prepare(`
        INSERT INTO email_logs (id, tipo, destinatario, assunto, corpo, status, enviado_em)
        VALUES (?, ?, ?, ?, ?, 'FALHOU', ?)
      `).run(id, msg.tipo, msg.destinatario, msg.assunto, corpoLog, now);
    } catch (logErr: any) {
      console.error('[EMAIL ERROR] Falha ao registrar o envio como FALHOU:', logErr);
    }
    return false;
  }
}
