import QRCode from 'qrcode';

/**
 * Calcula o CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF)
 * exigido pelo padrão BR Code / Banco Central do Brasil para PIX.
 */
function crc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formata um campo no padrão TLV (Tag-Length-Value) do padrão EMVCo
 */
function formatTlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface PixPayloadParams {
  key: string;
  name?: string;
  city?: string;
  amount?: number;
  txid?: string;
}

/**
 * Gera o payload oficial do PIX Copia e Cola (BR Code)
 */
export function generatePixPayload({
  key,
  name = 'ASSOC NOVO AMANHECER',
  city = 'TRINDADE',
  amount,
  txid = '***',
}: PixPayloadParams): string {
  // Limpar formatação da chave se for CNPJ ou Telefone
  const cleanKey = key.trim();
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .substring(0, 25);
  const cleanCity = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .substring(0, 15);
  const cleanTxid = (txid || '***').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';

  // 00: Payload Format Indicator
  let payload = formatTlv('00', '01');

  // 26: Merchant Account Information - Pix
  const gui = formatTlv('00', 'br.gov.bcb.pix');
  const keyField = formatTlv('01', cleanKey);
  payload += formatTlv('26', `${gui}${keyField}`);

  // 52: Merchant Category Code (0000 = Geral)
  payload += formatTlv('52', '0000');

  // 53: Transaction Currency (986 = Real BRL)
  payload += formatTlv('53', '986');

  // 54: Transaction Amount (opcional ou dinâmico)
  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatTlv('54', formattedAmount);
  }

  // 58: Country Code (BR)
  payload += formatTlv('58', 'BR');

  // 59: Merchant Name
  payload += formatTlv('59', cleanName || 'ASSOC NOVO AMANHECER');

  // 60: Merchant City
  payload += formatTlv('60', cleanCity || 'TRINDADE');

  // 62: Additional Data Field Template (txid)
  const txidField = formatTlv('05', cleanTxid);
  payload += formatTlv('62', txidField);

  // 63: CRC16
  const payloadToCrc = `${payload}6304`;
  const checksum = crc16(payloadToCrc);

  return `${payloadToCrc}${checksum}`;
}

/**
 * Gera imagem DataURL do QR Code a partir da chave ou payload PIX
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err);
    throw err;
  }
}
