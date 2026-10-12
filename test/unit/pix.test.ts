import { describe, expect, it } from 'vitest';
import { generatePixPayload } from '../../src/utils/pix';

// CRC16-CCITT (0x1021, início 0xFFFF) escrito à parte, para conferir o do código.
function crc16(text: string): string {
  let crc = 0xffff;
  for (const ch of text) {
    crc ^= ch.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Lê os campos TLV (id de 2 dígitos + tamanho de 2 dígitos + valor) do BR Code. */
function parseTlv(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    fields[id] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return fields;
}

describe('PIX copia e cola (BR Code)', () => {
  it('o CRC de referência bate com o exemplo oficial do Banco Central', () => {
    const exemplo =
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304';
    expect(crc16(exemplo)).toBe('1D3D');
  });

  it('gera um código com CRC correto e os campos esperados', () => {
    const payload = generatePixPayload({ key: 'contato@novoamanhecer.org.br', amount: 25.5 });
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));

    const f = parseTlv(payload);
    expect(f['00']).toBe('01');
    expect(f['26']).toBe('0014br.gov.bcb.pix0128contato@novoamanhecer.org.br');
    expect(f['53']).toBe('986'); // real
    expect(f['54']).toBe('25.50');
    expect(f['58']).toBe('BR');
    expect(f['59']).toBe('ASSOC NOVO AMANHECER');
    expect(f['60']).toBe('TRINDADE');
  });

  it('sem valor, deixa o campo 54 de fora (quem doa escolhe o valor)', () => {
    expect(parseTlv(generatePixPayload({ key: 'chave' }))).not.toHaveProperty('54');
  });

  it('remove acentos e respeita os limites de tamanho de nome (25) e cidade (15)', () => {
    const f = parseTlv(
      generatePixPayload({ key: 'chave', name: 'Associação Ação Solidária de Goiás', city: 'São João da Aliança' })
    );
    expect(f['59']).toBe('ASSOCIACAO ACAO SOLIDARIA');
    expect(f['60']).toBe('SAO JOAO DA ALI');
  });
});
