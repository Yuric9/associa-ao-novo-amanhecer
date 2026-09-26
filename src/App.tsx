/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Associação Novo Amanhecer - Trindade/Goiás
 * Portal Institucional & Painel Administrativo Completo
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/public/Navbar';
import { Hero } from './components/public/Hero';
import { Sobre } from './components/public/Sobre';
import { ImpactoNumeros } from './components/public/ImpactoNumeros';
import { ProjetosSection } from './components/public/ProjetosSection';
import { GaleriaLightbox } from './components/public/GaleriaLightbox';
import { ComoAjudar } from './components/public/ComoAjudar';
import { TransparenciaSection } from './components/public/TransparenciaSection';
import { CadastroBeneficiario } from './components/public/CadastroBeneficiario';
import { Footer } from './components/public/Footer';
import { VoluntarioModal, ParceiroModal } from './components/public/ApoioModals';
import { PoliticaPrivacidadeModal } from './components/public/PoliticaPrivacidadeModal';
import { PwaInstallBanner } from './components/pwa/PwaInstallBanner';
import { FloatingWhatsAppButton } from './components/public/FloatingWhatsAppButton';

// Área Administrativa
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { EmailNotificationModal } from './components/admin/EmailNotificationModal';

import {
  INITIAL_SITE_CONTENT,
  INITIAL_PROJECTS,
  INITIAL_GALLERY,
  INITIAL_ADMINS,
} from './data/initialData';
import {
  SiteContent,
  ProjectCard,
  GalleryPhoto,
  Beneficiary,
  AdminUser,
  StatusEmailNotification,
  Volunteer,
  AuthUser,
} from './types';
import { api, getStoredUser, LEGACY_PII_KEYS } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Estado de Conteúdo do Site (CMS sincronizado com SQLite)
  const [content, setContent] = useState<SiteContent>(() => {
    const saved = localStorage.getItem('ana_trindade_content');
    return saved ? JSON.parse(saved) : INITIAL_SITE_CONTENT;
  });

  // Estado dos Cards de Projetos Sociais
  const [projects, setProjects] = useState<ProjectCard[]>(() => {
    const saved = localStorage.getItem('ana_trindade_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  // Estado da Galeria de Fotos
  const [gallery, setGallery] = useState<GalleryPhoto[]>(() => {
    const saved = localStorage.getItem('ana_trindade_gallery');
    return saved ? JSON.parse(saved) : INITIAL_GALLERY;
  });

  // Estado dos Beneficiários Cadastrados (Banco de Dados Seguro)
  // Dados pessoais NÃO ficam salvos no navegador: vêm sempre do servidor após o login.
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  // Estado dos Administradores
  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('ana_trindade_admins');
    return saved ? JSON.parse(saved) : INITIAL_ADMINS;
  });

  // Estado dos Voluntários da Equipe
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

  // Usuário Autenticado e Papel Real (RBAC via Servidor)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);

  // Roteamento Próprio (/admin, /login e /)
  const [currentView, setCurrentView] = useState<'public' | 'admin' | 'login'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#admin') {
        return 'login';
      }
      if (window.location.pathname === '/admin') {
        return 'admin';
      }
      if (window.location.pathname === '/login') {
        return 'login';
      }
    }
    return 'public';
  });

  // Modais de Apoio
  const [isVoluntarioModalOpen, setIsVoluntarioModalOpen] = useState(false);
  const [isParceiroModalOpen, setIsParceiroModalOpen] = useState(false);
  const [isPoliticaModalOpen, setIsPoliticaModalOpen] = useState(false);
  const [predefinedProject, setPredefinedProject] = useState<string | undefined>(undefined);

  // Modal de Notificação por E-mail (Admin)
  const [pendingEmailNotification, setPendingEmailNotification] =
    useState<StatusEmailNotification | null>(null);

  // Toast de Notificação
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Navegação Limpa por URL sem #admin
  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      if (path === '/admin' && !authUser) {
        window.history.pushState({}, '', '/login');
        setCurrentView('login');
      } else if (path === '/login' && authUser) {
        window.history.pushState({}, '', '/admin');
        setCurrentView('admin');
      } else {
        window.history.pushState({}, '', path);
        if (path === '/login') setCurrentView('login');
        else if (path === '/admin') setCurrentView('admin');
        else setCurrentView('public');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sincronização com Botões Voltar / Avançar e Redirecionamento de Rotas
  useEffect(() => {
    // Redireciona legado #admin para /login ou /admin
    if (window.location.hash === '#admin') {
      const target = authUser ? '/admin' : '/login';
      window.history.replaceState({}, '', target);
      setCurrentView(authUser ? 'admin' : 'login');
    }

    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        if (!authUser) {
          window.history.replaceState({}, '', '/login');
          setCurrentView('login');
        } else {
          setCurrentView('admin');
        }
      } else if (path === '/login') {
        if (authUser) {
          window.history.replaceState({}, '', '/admin');
          setCurrentView('admin');
        } else {
          setCurrentView('login');
        }
      } else {
        setCurrentView('public');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [authUser]);

  // Verificação de Sessão Real no Servidor ao Carregar
  useEffect(() => {
    const verifySession = async () => {
      try {
        const user = await api.getMe();
        if (user) {
          setAuthUser(user);
          if (window.location.pathname === '/login') {
            window.history.replaceState({}, '', '/admin');
            setCurrentView('admin');
          }
        } else {
          setAuthUser(null);
          if (window.location.pathname === '/admin') {
            window.history.replaceState({}, '', '/login');
            setCurrentView('login');
          }
        }
      } catch {
        setAuthUser(null);
        if (window.location.pathname === '/admin') {
          window.history.replaceState({}, '', '/login');
          setCurrentView('login');
        }
      } finally {
        setIsVerifyingAuth(false);
      }
    };
    verifySession();
  }, []);

  // Limpeza do cache antigo com dados pessoais. A antiga "migração automática" reenviava esse
  // cache a cada visita e fazia beneficiários excluídos reaparecerem no banco.
  useEffect(() => {
    try {
      LEGACY_PII_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // navegador sem acesso ao armazenamento
    }
  }, []);

  // Carga e Sincronização Inicial de Conteúdos Públicos do Banco de Dados SQLite
  useEffect(() => {
    const loadDatabaseData = async () => {
      try {
        const [dbContent, dbProjects, dbGallery] = await Promise.all([
          api.getSiteContent().catch(() => null),
          api.getProjects().catch(() => null),
          api.getGallery().catch(() => null),
        ]);

        if (dbContent) {
          setContent(dbContent);
          localStorage.setItem('ana_trindade_content', JSON.stringify(dbContent));
        }
        if (dbProjects && Array.isArray(dbProjects) && dbProjects.length > 0) {
          setProjects(dbProjects);
          localStorage.setItem('ana_trindade_projects', JSON.stringify(dbProjects));
        }
        if (dbGallery && Array.isArray(dbGallery) && dbGallery.length > 0) {
          setGallery(dbGallery);
          localStorage.setItem('ana_trindade_gallery', JSON.stringify(dbGallery));
        }
      } catch {
        // Usa dados locais se servidor inicializando
      }
    };

    loadDatabaseData();
  }, []);

  // Carga de Dados Protegidos (Beneficiários e Voluntários) quando Autenticado
  useEffect(() => {
    if (!authUser) return;

    const loadProtectedData = async () => {
      try {
        const [dbBeneficiaries, dbVolunteers] = await Promise.all([
          api.getBeneficiaries().catch(() => null),
          api.getVolunteers().catch(() => null),
        ]);

        if (dbBeneficiaries && Array.isArray(dbBeneficiaries)) {
          setBeneficiaries(dbBeneficiaries);
        }
        if (dbVolunteers && Array.isArray(dbVolunteers)) {
          setVolunteers(dbVolunteers);
        }
      } catch {
        // Silencioso se sem permissão
      }
    };

    loadProtectedData();
  }, [authUser]);

  // Handlers Administrativos com Persistência em Banco de Dados Real
  const handleLoginSuccess = (userOrEmail: any) => {
    if (typeof userOrEmail === 'object' && userOrEmail?.email) {
      setAuthUser(userOrEmail);
      showToast(`Bem-vindo(a), ${userOrEmail.nome || userOrEmail.email}! Nível: ${userOrEmail.role}`);
    } else {
      showToast(`Bem-vindo ao painel administrativo!`);
    }
    navigateTo('/admin');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignorar erro de logout
    }
    setAuthUser(null);
    setBeneficiaries([]);
    setVolunteers([]);
    navigateTo('/login');
    showToast('Sessão administrativa encerrada com segurança.');
  };

  const handleOpenCadastro = (projectName?: string) => {
    setPredefinedProject(projectName);
    const element = document.getElementById('cadastro');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddBeneficiary = (newBen: Beneficiary) => {
    setBeneficiaries((prev) => [newBen, ...prev]);
    showToast(`Inscrição de ${newBen.nome} enviada para análise da equipe!`);
  };

  const handleUpdateProjects = async (newProjects: ProjectCard[]) => {
    setProjects(newProjects);
    localStorage.setItem('ana_trindade_projects', JSON.stringify(newProjects));
    try {
      await api.updateProjects(newProjects);
    } catch {
      // Erro silencioso com fallback local
    }
  };

  const handleUpdateContent = async (newContent: SiteContent) => {
    setContent(newContent);
    localStorage.setItem('ana_trindade_content', JSON.stringify(newContent));
    try {
      await api.updateSiteContent(newContent);
    } catch {
      // Erro silencioso com fallback local
    }
  };

  const handleUpdateGallery = async (newPhotos: GalleryPhoto[]) => {
    setGallery(newPhotos);
    localStorage.setItem('ana_trindade_gallery', JSON.stringify(newPhotos));
    try {
      await api.updateGallery(newPhotos);
    } catch {
      // Erro silencioso com fallback local
    }
  };

  const handleRestoreAll = (data: {
    beneficiaries: Beneficiary[];
    projects: ProjectCard[];
    gallery: GalleryPhoto[];
    content: SiteContent;
  }) => {
    setBeneficiaries(data.beneficiaries);
    setProjects(data.projects);
    setGallery(data.gallery);
    setContent(data.content);
    showToast('Todos os dados foram restaurados com sucesso!');
  };

  // Se a rota for /login ou se for /admin sem autenticação
  if (currentView === 'login' || !authUser) {
    if (currentView === 'admin' || currentView === 'login') {
      return (
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onBackToSite={() => navigateTo('/')}
        />
      );
    }
  }

  // Se a rota acessada for /admin com usuário autenticado
  if (currentView === 'admin' && authUser) {

    // Painel Administrativo Autenticado com RBAC e Dados da Nuvem
    return (
      <>
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <AdminDashboard
          currentEmail={authUser.email}
          currentUser={authUser}
          onLogout={handleLogout}
          onBackToSite={() => navigateTo('/')}
          beneficiaries={beneficiaries}
          onUpdateBeneficiaries={setBeneficiaries}
          projects={projects}
          onUpdateProjects={handleUpdateProjects}
          gallery={gallery}
          onUpdateGallery={handleUpdateGallery}
          content={content}
          onUpdateContent={handleUpdateContent}
          admins={admins}
          onUpdateAdmins={setAdmins}
          volunteers={volunteers}
          onUpdateVolunteers={setVolunteers}
          onRequestEmailNotification={(notif) => setPendingEmailNotification(notif)}
          onRestoreAll={handleRestoreAll}
        />

        {/* Modal de Confirmação de E-mail */}
        <EmailNotificationModal
          notification={pendingEmailNotification}
          onClose={() => setPendingEmailNotification(null)}
          onSend={(msg) => {
            showToast('Notificação por e-mail disparada ao beneficiário!');
          }}
        />
      </>
    );
  }

  // Visão Pública do Site Institucional
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <a href="#inicio" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2">
        Pular para o conteúdo
      </a>

      {toastMessage && (
        <div
          role="status"
          className="fixed right-4 top-20 z-50 flex max-w-sm items-center gap-2.5 rounded-md bg-ink px-4 py-3 text-sm text-white"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-sun" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar
        content={content}
        onOpenCadastro={handleOpenCadastro}
        onOpenAdmin={() => navigateTo('/admin')}
        isAdminLoggedIn={!!authUser}
      />

      <main className="flex-1">
        <Hero content={content} onOpenCadastro={() => handleOpenCadastro()} />
        <ImpactoNumeros content={content} />
        <ProjetosSection projects={projects} onOpenCadastro={handleOpenCadastro} />
        <GaleriaLightbox photos={gallery} instagramUrl={content.instagram_url} />
        <Sobre content={content} />
        <ComoAjudar
          content={content}
          onOpenVoluntarioModal={() => setIsVoluntarioModalOpen(true)}
          onOpenParceiroModal={() => setIsParceiroModalOpen(true)}
        />
        <TransparenciaSection content={content} />
        <CadastroBeneficiario
          projects={projects}
          beneficiaries={beneficiaries}
          onAddBeneficiary={handleAddBeneficiary}
          defaultProject={predefinedProject}
          onOpenPrivacidade={() => setIsPoliticaModalOpen(true)}
        />
      </main>

      {/* 8. Rodapé Completo */}
      <Footer
        content={content}
        onOpenAdmin={() => navigateTo('/admin')}
        onOpenCadastro={() => handleOpenCadastro()}
        onOpenPrivacidade={() => setIsPoliticaModalOpen(true)}
      />

      {/* Modais de Apoiadores */}
      <VoluntarioModal
        isOpen={isVoluntarioModalOpen}
        onClose={() => setIsVoluntarioModalOpen(false)}
        onOpenPrivacidade={() => setIsPoliticaModalOpen(true)}
      />

      <ParceiroModal
        isOpen={isParceiroModalOpen}
        onClose={() => setIsParceiroModalOpen(false)}
      />

      {/* Modal de Política de Privacidade e Proteção de Dados (LGPD) */}
      <PoliticaPrivacidadeModal
        isOpen={isPoliticaModalOpen}
        onClose={() => setIsPoliticaModalOpen(false)}
      />

      {/* Botão Flutuante Fale Conosco (WhatsApp Oficial com Contexto do Site) */}
      <FloatingWhatsAppButton content={content} />

      {/* PWA Banner de Instalação e Status Offline */}
      <PwaInstallBanner />
    </div>
  );
}
