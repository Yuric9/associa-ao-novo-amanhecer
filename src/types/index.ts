export type BeneficiaryStatus =
  | 'Pendente'
  | 'Em análise'
  | 'Aprovado'
  | 'Atendido/Entregue'
  | 'Recusado';

export interface Beneficiary {
  id: string;
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  projeto: string;
  status: BeneficiaryStatus;
  observacoes: string;
  criado_em: string;
  atualizado_em?: string;
  motivo_status?: string;
}

export interface ProjectCard {
  id: string;
  titulo: string;
  descricao: string;
  foto_url: string;
  ativo: boolean;
  ordem: number;
  detalhes?: string;
  idade_publico?: string;
  horario?: string;
  coordenador?: string;
}

export interface GalleryPhoto {
  id: string;
  foto_url: string;
  legenda: string;
  ordem: number;
  categoria?: 'ballet' | 'futebol' | 'book' | 'festas' | 'geral';
  data?: string;
}

export interface InstagramPost {
  id: string;
  media_url: string;
  caption: string;
  timestamp: string;
  likes: number;
  comments: number;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  location?: string;
  tags: string[];
  category: 'futebol' | 'ballet' | 'book' | 'festas' | 'geral';
}

export interface SiteContent {
  hero_tagline: string;
  hero_title: string;
  hero_subtitle: string;
  sobre_historia: string;
  sobre_missao: string;
  sobre_visao: string;
  sobre_valores: string;
  impacto_criancas: number;
  impacto_voluntarios: number;
  impacto_eventos: number;
  impacto_projetos: number;
  contato_cidade: string;
  contato_estado: string;
  contato_endereco: string;
  contato_telefone: string;
  contato_whatsapp: string;
  contato_whatsapp_mensagem?: string;
  contato_email: string;
  contato_cnpj: string;
  contato_pix_chave: string;
  contato_pix_tipo: string;
  instagram_url: string;
}

export type UserRole = 'admin' | 'equipe' | 'coordenador' | 'voluntario';

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  roles?: string[];
  ativo?: number;
  criado_em?: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  nome: string;
  role?: UserRole;
  criado_em: string;
}

export interface StatusEmailNotification {
  beneficiaryName: string;
  beneficiaryEmail: string;
  project: string;
  previousStatus: BeneficiaryStatus;
  newStatus: BeneficiaryStatus;
  date: string;
  messageText: string;
}

export type VolunteerArea =
  | 'Oficina de Ballet'
  | 'Treinos de Futebol'
  | 'Fotografia & Produção (Book)'
  | 'Cozinha Comunitária & Alimentação'
  | 'Apoio Pedagógico & Escolar'
  | 'Logística, Triagem & Eventos'
  | 'Saúde Comunitária (Acolhimento)';

export type VolunteerAvailability =
  | 'Sábados (Manhã)'
  | 'Finais de Semana (Geral)'
  | 'Dias de Semana (Tarde)'
  | 'Dias de Semana (Manhã)'
  | 'Eventos & Datas Comemorativas'
  | 'Escala Flexível';

export interface Volunteer {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  area: VolunteerArea;
  disponibilidade: VolunteerAvailability;
  ativo: boolean;
  data_inicio: string;
  habilidades?: string;
  observacoes?: string;
}

export interface Donation {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  valor: number;
  mensagem?: string;
  metodo: string;
  status: 'Confirmado' | 'Pendente' | 'Cancelado';
  ip_origem?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface SystemStats {
  totalBeneficiarios: number;
  familiasAtendidas: number;
  totalVoluntarios: number;
  totalProjetos: number;
  totalDoacoesMes: number;
  countDoacoesMes: number;
  statusMap: Record<string, number>;
}

