import { exports } from 'cloudflare:workers';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './constants';

let ipCounter = 0;

/** IP diferente a cada chamada, para os limites de tentativas por IP não interferirem entre testes. */
export function newIp(): string {
  ipCounter++;
  return `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

interface CallOptions {
  method?: string;
  body?: unknown;
  cookie?: string;
  ip?: string;
  headers?: Record<string, string>;
}

/** Chama a API do Worker como um navegador faria. */
export function api(path: string, { method = 'GET', body, cookie, ip, headers = {} }: CallOptions = {}) {
  const h = new Headers(headers);
  h.set('cf-connecting-ip', ip ?? newIp());
  if (body !== undefined) h.set('content-type', 'application/json');
  if (cookie) h.set('cookie', cookie);
  return exports.default.fetch(
    new Request(`https://novoamanhecer.test/api${path}`, {
      method,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  );
}

/** "ana_token=..." a partir do Set-Cookie da resposta (o que o navegador guardaria). */
export function sessionCookie(res: Response): string {
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/ana_token=[^;]+/);
  if (!match) throw new Error(`Resposta sem cookie de sessão: "${setCookie}"`);
  return match[0];
}

export async function login(email = TEST_ADMIN_EMAIL, password = TEST_ADMIN_PASSWORD) {
  const res = await api('/auth/login', { method: 'POST', body: { email, password } });
  return { res, cookie: res.ok ? sessionCookie(res) : '' };
}

/** Gera um CPF válido (dígitos verificadores corretos) a partir de 9 dígitos aleatórios. */
export function randomCpf(): string {
  const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  if (d.every((x) => x === d[0])) d[0] = (d[0] + 1) % 10;
  for (const len of [9, 10]) {
    const sum = d.slice(0, len).reduce((acc, n, i) => acc + n * (len + 1 - i), 0);
    const rest = (sum * 10) % 11;
    d.push(rest === 10 ? 0 : rest);
  }
  const s = d.join('');
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
}

/** Inscrição válida do formulário público; sobrescreva campos para testar erros. */
export function beneficiaryForm(overrides: Record<string, unknown> = {}) {
  return {
    nome: 'Maria de Teste',
    cpf: randomCpf(),
    nascimento: '2015-03-10',
    telefone: '(62) 99999-0000',
    email: '',
    endereco: 'Rua de Teste, 10 - Trindade - GO',
    projeto: 'Aulas de Ballet Solidário',
    consentimento_lgpd: true,
    hp_security_check: '',
    ...overrides,
  };
}
