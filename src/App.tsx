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
import { InstagramFeed } from './components/public/InstagramFeed';
import { ComoAjudar } from './components/public/ComoAjudar';
import { TransparenciaSection } from './components/public/TransparenciaSection';
import { CadastroBeneficiario } from './components/public/CadastroBeneficiario';
import { Footer } from './components/public/Footer';
import { VoluntarioModal, ParceiroModal } from './components/public/ApoioModals';
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
  INITIAL_BENEFICIARIES,
  INITIAL_ADMINS,
  INITIAL_INSTAGRAM_POSTS,
  INITIAL_VOLUNTEERS,
} from './data/initialData';
import {
  SiteContent,
  ProjectCard,
  GalleryPhoto,
  Beneficiary,
  AdminUser,
  StatusEmailNotification,
  InstagramPost,
  Volunteer,
} from './types';
import { CheckCircle2, ArrowUp } from 'lucide-react';

export default function App() {
  // Estado de Conteúdo do Site (CMS sem código)
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

  // Estado do Feed de Fotos do Instagram
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>(() => {
    const saved = localStorage.getItem('ana_trindade_instagram');
    return saved ? JSON.parse(saved) : INITIAL_INSTAGRAM_POSTS;
  });

  // Estado dos Beneficiários Cadastrados
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(() => {
    const saved = localStorage.getItem('ana_trindade_beneficiarios');
    return saved ? JSON.parse(saved) : INITIAL_BENEFICIARIES;
  });

  // Estado dos Administradores
  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('ana_trindade_admins');
    return saved ? JSON.parse(saved) : INITIAL_ADMINS;
  });

  // Estado dos Voluntários da Equipe
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => {
    const saved = localStorage.getItem('ana_trindade_voluntarios');
    return saved ? JSON.parse(saved) : INITIAL_VOLUNTEERS;
  });

  // Sessão Administrativa e Roteamento
  const [adminSession, setAdminSession] = useState<string | null>(() => {
    return localStorage.getItem('ana_admin_session');
  });

  const [currentView, setCurrentView] = useState<'public' | 'admin'>(() => {
    return window.location.hash === '#admin' ? 'admin' : 'public';
  });

  // Modais de Apoio
  const [isVoluntarioModalOpen, setIsVoluntarioModalOpen] = useState(false);
  const [isParceiroModalOpen, setIsParceiroModalOpen] = useState(false);
  const [predefinedProject, setPredefinedProject] = useState<string | undefined>(undefined);

  // Modal de Notificação por E-mail (Admin)
  const [pendingEmailNotification, setPendingEmailNotification] =
    useState<StatusEmailNotification | null>(null);

  // Toast de Notificação
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistência em LocalStorage
  useEffect(() => {
    localStorage.setItem('ana_trindade_content', JSON.stringify(content));
  }, [content]);

  useEffect(() => {
    localStorage.setItem('ana_trindade_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('ana_trindade_gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem('ana_trindade_instagram', JSON.stringify(instagramPosts));
  }, [instagramPosts]);

  useEffect(() => {
    localStorage.setItem('ana_trindade_beneficiarios', JSON.stringify(beneficiaries));
  }, [beneficiaries]);

  useEffect(() => {
    localStorage.setItem('ana_trindade_admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem('ana_trindade_voluntarios', JSON.stringify(volunteers));
  }, [volunteers]);

  useEffect(() => {
    if (adminSession) {
      localStorage.setItem('ana_admin_session', adminSession);
    } else {
      localStorage.removeItem('ana_admin_session');
    }
  }, [adminSession]);

  // Listener para hash na URL (#admin / #inicio)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLoginSuccess = (email: string) => {
    setAdminSession(email);
    setCurrentView('admin');
    showToast(`Bem-vindo ao painel administrativo da Associação Novo Amanhecer!`);
  };

  const handleLogout = () => {
    setAdminSession(null);
    setCurrentView('public');
    window.location.hash = '';
    showToast('Sessão administrativa encerrada.');
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

  // Se o usuário está na visão administrativa
  if (currentView === 'admin') {
    if (!adminSession) {
      return (
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onBackToSite={() => {
            setCurrentView('public');
            window.location.hash = '';
          }}
        />
      );
    }

    return (
      <>
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <AdminDashboard
          currentEmail={adminSession}
          onLogout={handleLogout}
          onBackToSite={() => {
            setCurrentView('public');
            window.location.hash = '';
          }}
          beneficiaries={beneficiaries}
          onUpdateBeneficiaries={setBeneficiaries}
          projects={projects}
          onUpdateProjects={setProjects}
          gallery={gallery}
          onUpdateGallery={setGallery}
          content={content}
          onUpdateContent={setContent}
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
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs animate-in slide-in-from-top duration-300 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Menu Fixo e Enxuto */}
      <Navbar
        content={content}
        onOpenCadastro={handleOpenCadastro}
        onOpenAdmin={() => {
          setCurrentView('admin');
          window.location.hash = 'admin';
        }}
        isAdminLoggedIn={!!adminSession}
      />

      <main className="flex-1">
        {/* 1. Hero */}
        <Hero
          content={content}
          onOpenCadastro={() => handleOpenCadastro()}
        />

        {/* 2. Sobre (História, Missão, Visão, Valores) */}
        <Sobre content={content} />

        {/* 3. Números de Impacto */}
        <ImpactoNumeros content={content} />

        {/* 4. Projetos Sociais em Cards Gerenciáveis (Ballet, Futebol, Book, Festas) */}
        <ProjetosSection
          projects={projects}
          onOpenCadastro={handleOpenCadastro}
        />

        {/* 5. Galeria de Fotos com Lightbox */}
        <GaleriaLightbox
          photos={gallery}
          instagramUrl={content.instagram_url}
        />

        {/* 6. Feed de Fotos e Stories do Instagram em Tempo Real (@anovoamanhecer) */}
        <InstagramFeed
          posts={instagramPosts}
          content={content}
          onRefresh={() => {
            setToastMessage('Feed do Instagram atualizado com sucesso!');
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />

        {/* 7. Como Ajudar (Doar PIX, Ser Voluntário, Ser Parceiro) */}
        <ComoAjudar
          content={content}
          onOpenVoluntarioModal={() => setIsVoluntarioModalOpen(true)}
          onOpenParceiroModal={() => setIsParceiroModalOpen(true)}
        />

        {/* 7. Transparência & Prestação de Contas (Padrão Time da Inclusão) */}
        <TransparenciaSection content={content} />

        {/* 8. Cadastro de Beneficiários com Validação Real de CPF e Controle de Duplicidade */}
        <CadastroBeneficiario
          projects={projects}
          beneficiaries={beneficiaries}
          onAddBeneficiary={handleAddBeneficiary}
          defaultProject={predefinedProject}
        />
      </main>

      {/* 8. Rodapé Completo */}
      <Footer
        content={content}
        onOpenAdmin={() => {
          setCurrentView('admin');
          window.location.hash = 'admin';
        }}
        onOpenCadastro={() => handleOpenCadastro()}
      />

      {/* Modais de Apoiadores */}
      <VoluntarioModal
        isOpen={isVoluntarioModalOpen}
        onClose={() => setIsVoluntarioModalOpen(false)}
      />

      <ParceiroModal
        isOpen={isParceiroModalOpen}
        onClose={() => setIsParceiroModalOpen(false)}
      />

      {/* Botão Flutuante Fale Conosco (WhatsApp Oficial com Contexto do Site) */}
      <FloatingWhatsAppButton content={content} />

      {/* PWA Banner de Instalação e Status Offline */}
      <PwaInstallBanner />
    </div>
  );
}
