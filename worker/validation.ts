import { db } from './d1';

// Validação de CPF Oficial Brasileiro (Dígitos verificadores módulo 11)
export function validateCPF(cpfRaw: string): boolean {
  if (!cpfRaw) return false;
  const cpf = cpfRaw.replace(/\D/g, '');

  if (cpf.length !== 11) return false;

  // Rejeitar sequências conhecidas de dígitos iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validar primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9), 10)) return false;

  // Validar segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

// Validação de Telefone / WhatsApp Brasileiro
export function validatePhone(phoneRaw: string): boolean {
  if (!phoneRaw) return false;
  const digits = phoneRaw.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

// Validação de E-mail
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

// Sanitização e validação de tamanho de texto
export function sanitizeString(str: unknown, maxLen = 255): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

// Verificação de Honeypot Anti-Spam (Campo invisível preenchido por robôs)
export function checkHoneypot(honeypotField: unknown): boolean {
  if (honeypotField && typeof honeypotField === 'string' && honeypotField.trim().length > 0) {
    return false; // É um bot!
  }
  return true; // Passou no teste de honeypot
}

// Rate Limiter por IP no banco D1 (ex.: máx 5 envios a cada 10 minutos)
export async function checkRateLimit(ip: string, endpoint: string, maxAttempts = 5, windowMinutes = 10): Promise<boolean> {
  try {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;

    // Limpar registros antigos para evitar inchaço
    await db.prepare('DELETE FROM rate_limits WHERE timestamp < ?').run(cutoff);

    // Contar tentativas recentes do IP
    const row = await db.prepare(`
      SELECT COUNT(*) as count FROM rate_limits
      WHERE ip = ? AND endpoint = ? AND timestamp >= ?
    `).get<{ count: number }>(ip, endpoint, cutoff);

    if ((row?.count ?? 0) >= maxAttempts) {
      return false; // Bloqueado por excesso de requisições
    }

    await db.prepare('INSERT INTO rate_limits (ip, endpoint, timestamp) VALUES (?, ?, ?)')
      .run(ip, endpoint, Date.now());

    return true;
  } catch (err) {
    console.error('Erro no rate limiter:', err);
    return true; // Em caso de falha no banco, não travar o usuário
  }
}
