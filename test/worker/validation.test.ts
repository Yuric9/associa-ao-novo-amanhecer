import { describe, expect, it } from 'vitest';
import { checkHoneypot, sanitizeString, validateCPF, validateEmail, validatePhone } from '../../worker/validation';

describe('validateCPF (servidor)', () => {
  it.each(['529.982.247-25', '52998224725', '111.444.777-35'])('aceita CPF válido: %s', (cpf) => {
    expect(validateCPF(cpf)).toBe(true);
  });

  it.each(['529.982.247-26', '111.111.111-11', '000.000.000-00', '1234567890', '', 'abc.def.ghi-jk'])(
    'recusa CPF inválido: "%s"',
    (cpf) => {
      expect(validateCPF(cpf)).toBe(false);
    }
  );
});

describe('validatePhone', () => {
  it.each(['(62) 99999-0000', '62999990000', '(62) 3333-4444'])('aceita %s', (p) => expect(validatePhone(p)).toBe(true));
  it.each(['9999-0000', '', '(62) 99999-00001'])('recusa "%s"', (p) => expect(validatePhone(p)).toBe(false));
});

describe('validateEmail', () => {
  it.each(['maria@exemplo.com', ' joao.silva+ong@gmail.com.br '])('aceita "%s"', (e) => expect(validateEmail(e)).toBe(true));
  it.each(['maria@', '@exemplo.com', 'maria exemplo.com', ''])('recusa "%s"', (e) => expect(validateEmail(e)).toBe(false));
});

describe('sanitizeString e honeypot', () => {
  it('apara espaços, corta no tamanho máximo e ignora o que não é texto', () => {
    expect(sanitizeString('  oi  ')).toBe('oi');
    expect(sanitizeString('a'.repeat(300))).toHaveLength(255);
    expect(sanitizeString('abcdef', 3)).toBe('abc');
    expect(sanitizeString(123)).toBe('');
    expect(sanitizeString(null)).toBe('');
  });

  it('o campo armadilha só passa se estiver vazio', () => {
    expect(checkHoneypot('')).toBe(true);
    expect(checkHoneypot(undefined)).toBe(true);
    expect(checkHoneypot('   ')).toBe(true);
    expect(checkHoneypot('http://spam')).toBe(false);
  });
});
