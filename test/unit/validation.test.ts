import { describe, expect, it } from 'vitest';
import { cleanDigits, formatCEP, formatCPF, formatPhone, validateCPF } from '../../src/utils/validation';
import { validateCPF as validateCPFServer } from '../../worker/validation';

describe('validateCPF (navegador)', () => {
  it.each(['529.982.247-25', '111.444.777-35'])('aceita %s', (cpf) => expect(validateCPF(cpf)).toBe(true));
  it.each(['529.982.247-26', '111.111.111-11', '123'])('recusa %s', (cpf) => expect(validateCPF(cpf)).toBe(false));

  // O CPF é validado duas vezes: no navegador (formulário) e no servidor (API), com fórmulas
  // escritas de jeitos diferentes. Se discordarem, o formulário aceita e a API recusa (ou vice-versa).
  it('concorda com a validação do servidor para 5.000 números aleatórios', () => {
    for (let i = 0; i < 5000; i++) {
      const cpf = String(Math.floor(Math.random() * 1e11)).padStart(11, '0');
      expect(validateCPF(cpf), cpf).toBe(validateCPFServer(cpf));
    }
  });
});

describe('máscaras de digitação', () => {
  it.each([
    ['5', '5'],
    ['5299', '529.9'],
    ['5299822', '529.982.2'],
    ['52998224725', '529.982.247-25'],
    ['529982247259999', '529.982.247-25'],
  ])('formatCPF(%s) → %s', (input, out) => expect(formatCPF(input)).toBe(out));

  it.each([
    ['', ''],
    ['6', '(6'],
    ['6299', '(62) 99'],
    ['6233334444', '(62) 3333-4444'],
    ['62999990000', '(62) 99999-0000'],
  ])('formatPhone(%s) → %s', (input, out) => expect(formatPhone(input)).toBe(out));

  it('formatCEP e cleanDigits', () => {
    expect(formatCEP('75380000')).toBe('75380-000');
    expect(formatCEP('7538')).toBe('7538');
    expect(cleanDigits('(62) 99999-0000')).toBe('62999990000');
  });
});
