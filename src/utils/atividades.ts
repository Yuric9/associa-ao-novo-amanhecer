// Tradução das ações gravadas na auditoria (tabela audit_logs) para a tela "Registro de atividades".
// Ao criar uma ação nova no Worker (logAudit({ action: 'X' })), adicione-a aqui:
// o teste test/unit/atividades.test.ts falha se alguma ficar de fora.

export type GrupoAtividade = 'acessos' | 'cadastros' | 'site' | 'sistema';

export interface InfoAtividade {
  rotulo: string;
  grupo: GrupoAtividade;
  /** Merece atenção (ex.: tentativa de login com senha errada). */
  alerta?: boolean;
}

export const ATIVIDADES: Record<string, InfoAtividade> = {
  LOGIN_SUCCESS: { rotulo: 'Entrou no painel', grupo: 'acessos' },
  LOGIN_FAILED: { rotulo: 'Tentativa de login recusada', grupo: 'acessos', alerta: true },
  LOGOUT: { rotulo: 'Saiu do painel', grupo: 'acessos' },
  PASSWORD_RESET_REQUESTED: { rotulo: 'Pediu o código de nova senha por e-mail', grupo: 'acessos' },
  PASSWORD_RESET_COMPLETED: { rotulo: 'Redefiniu a senha pelo código do e-mail', grupo: 'acessos' },
  PASSWORD_CHANGED: { rotulo: 'Trocou a própria senha', grupo: 'acessos' },
  PASSWORD_RESET_BY_ADMIN: { rotulo: 'Definiu senha provisória para alguém', grupo: 'acessos', alerta: true },
  USER_CREATED: { rotulo: 'Criou um usuário do painel', grupo: 'acessos' },
  USER_DELETED: { rotulo: 'Removeu um usuário do painel', grupo: 'acessos', alerta: true },

  BENEFICIARY_REGISTERED: { rotulo: 'Nova inscrição de beneficiário', grupo: 'cadastros' },
  BENEFICIARY_UPDATED: { rotulo: 'Alterou um beneficiário', grupo: 'cadastros' },
  BENEFICIARY_DELETED: { rotulo: 'Excluiu um beneficiário', grupo: 'cadastros', alerta: true },
  VOLUNTEER_REGISTERED: { rotulo: 'Novo voluntário', grupo: 'cadastros' },
  VOLUNTEER_UPDATED: { rotulo: 'Alterou um voluntário', grupo: 'cadastros' },
  DONATION_REGISTERED: { rotulo: 'Doação registrada', grupo: 'cadastros' },
  DONATION_UPDATED: { rotulo: 'Alterou uma doação', grupo: 'cadastros' },
  DONATION_DELETED: { rotulo: 'Excluiu uma doação', grupo: 'cadastros', alerta: true },

  CONTENT_UPDATED: { rotulo: 'Alterou os textos do site', grupo: 'site' },
  PROJECTS_UPDATED: { rotulo: 'Alterou os projetos', grupo: 'site' },
  GALLERY_UPDATED: { rotulo: 'Alterou a galeria', grupo: 'site' },
  PHOTO_UPLOADED: { rotulo: 'Enviou uma foto', grupo: 'site' },

  BACKUP_CREATED: { rotulo: 'Backup gerado', grupo: 'sistema' },
  BACKUP_RESTORED: { rotulo: 'Backup restaurado', grupo: 'sistema', alerta: true },
  EMAIL_SENT: { rotulo: 'E-mail enviado', grupo: 'sistema' },
  // Não é mais gravada (o e-mail da coordenação foi removido), mas pode aparecer em registros antigos
  COORDINATION_EMAIL_UPDATED: { rotulo: 'Alterou o e-mail da coordenação', grupo: 'sistema' },
};

export const GRUPOS: { id: GrupoAtividade; rotulo: string }[] = [
  { id: 'acessos', rotulo: 'Acessos' },
  { id: 'cadastros', rotulo: 'Cadastros' },
  { id: 'site', rotulo: 'Site' },
  { id: 'sistema', rotulo: 'Sistema' },
];

/** Informações de uma ação; ações desconhecidas aparecem com o código original, no grupo "sistema". */
export function infoDaAtividade(acao: string): InfoAtividade {
  return ATIVIDADES[acao] ?? { rotulo: acao, grupo: 'sistema' };
}
