import React, { useState, useEffect } from 'react';
import {
  Instagram,
  Heart,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  CheckCircle,
  MapPin,
  Send,
  Bookmark,
  X,
  Play,
  Layers,
  Share2,
  Check,
} from 'lucide-react';
import { InstagramPost, SiteContent } from '../../types';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';

interface InstagramFeedProps {
  posts: InstagramPost[];
  content: SiteContent;
  onRefresh?: () => void;
}

interface StoryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  timeAgo: string;
}

export const InstagramFeed: React.FC<InstagramFeedProps> = ({
  posts: initialPosts,
  content,
  onRefresh,
}) => {
  const [feedPosts, setFeedPosts] = useState<InstagramPost[]>(initialPosts);
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Agora mesmo');
  const [userLikedPosts, setUserLikedPosts] = useState<Record<string, boolean>>({});
  const [userComments, setUserComments] = useState<Record<string, string[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Stories ativos
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // Obter @handle a partir da URL configurada
  const getHandle = (url: string) => {
    try {
      const clean = url.trim().replace(/\/$/, '');
      const parts = clean.split('/');
      const last = parts[parts.length - 1];
      return last ? `@${last.replace('@', '')}` : '@anovoamanhecer';
    } catch {
      return '@anovoamanhecer';
    }
  };

  const handle = getHandle(content.instagram_url);

  const stories: StoryItem[] = [
    {
      id: 'st-1',
      title: 'Treino Hoje',
      category: 'Futebol',
      image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80',
      timeAgo: 'há 1h',
    },
    {
      id: 'st-2',
      title: 'Ballet',
      category: 'Dança',
      image: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=80',
      timeAgo: 'há 3h',
    },
    {
      id: 'st-3',
      title: 'Book Gestante',
      category: 'Acolhimento',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      timeAgo: 'há 5h',
    },
    {
      id: 'st-4',
      title: 'Panelão',
      category: 'Cozinha',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
      timeAgo: 'há 8h',
    },
    {
      id: 'st-5',
      title: 'Ponta Kayana',
      category: 'Comunidade',
      image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80',
      timeAgo: 'ontem',
    },
  ];

  // Atualizar feed ao vivo (simulação com sincronização à URL)
  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();

    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncTime('Sincronizado há instantes');
    }, 900);
  };

  // Curtir publicação interativa
  const handleToggleLike = (postId: string) => {
    const isLiked = !userLikedPosts[postId];
    setUserLikedPosts((prev) => ({ ...prev, [postId]: isLiked }));
    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      })
    );
  };

  // Enviar comentário na postagem
  const handleAddComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setUserComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newCommentText.trim()],
    }));
    setFeedPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
    );
    setNewCommentText('');
  };

  // Copiar link do post
  const handleCopyPostLink = (post: InstagramPost) => {
    navigator.clipboard.writeText(`${content.instagram_url}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Temporizador para progresso do Story
  useEffect(() => {
    if (!activeStory) return;
    setStoryProgress(0);
    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveStory(null);
          return 0;
        }
        return prev + 4;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [activeStory]);

  const filteredPosts =
    activeFilter === 'todos'
      ? feedPosts
      : feedPosts.filter((p) => p.category === activeFilter);

  return (
    <section id="instagram" className="py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/30 to-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho Oficial do Instagram da Associação */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            {/* Perfil & Identidade */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              {/* Avatar com Anel Gradiente Estilo Instagram */}
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0 shadow-md">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-1 flex items-center justify-center overflow-hidden">
                  <NovoAmanhecerLogo size="md" showText={false} />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-1.5 rounded-full shadow-xs">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Informações da Conta */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {handle.replace('@', '')}
                  </h2>
                  <div className="flex items-center gap-1 bg-sky-100 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5 text-sky-600 fill-sky-600 text-white" />
                    <span>Oficial</span>
                  </div>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    · Associação Novo Amanhecer
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                  ☀️ <strong>Comunidade que Acolhe em Trindade-GO</strong>. Acompanhe os treinos da Escolinha de Futebol, Ballet Solidário, Book de Gestantes e o panelão com as famílias no Setor Ponta Kayana.
                </p>

                {/* Métricas do Perfil */}
                <div className="flex items-center gap-4 sm:gap-6 mt-3 text-xs text-slate-700">
                  <span>
                    <strong className="text-slate-900 font-bold">{feedPosts.length + 212}</strong> publicações
                  </span>
                  <span>
                    <strong className="text-slate-900 font-bold">1.840</strong> seguidores
                  </span>
                  <span>
                    <strong className="text-slate-900 font-bold">412</strong> seguindo
                  </span>
                </div>
              </div>
            </div>

            {/* Ações da Conta: Seguir + Sincronizar */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleRefreshFeed}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-amber-300 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-white transition-all cursor-pointer shadow-2xs"
                title="Sincronizar publicações recentes"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Feed'}</span>
              </button>

              <a
                href={content.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white text-xs font-black shadow-md shadow-pink-500/20 hover:shadow-pink-500/30 transition-all hover:-translate-y-0.5"
              >
                <Instagram className="w-4 h-4" />
                <span>Seguir no Instagram</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          </div>

          {/* Barra de Stories / Destaques da Associação */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Destaques & Acontecendo Agora</span>
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Atualizações em tempo real · {lastSyncTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2">
              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => setActiveStory(story)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none cursor-pointer"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
                      <img
                        src={story.image}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 max-w-[70px] truncate text-center group-hover:text-amber-700">
                    {story.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Barra de Filtros das Postagens */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'todos', label: 'Todas as Fotos' },
              { id: 'futebol', label: '⚽ Futebol' },
              { id: 'ballet', label: '🩰 Ballet' },
              { id: 'book', label: '🤰 Book Gestante' },
              { id: 'festas', label: '🎉 Comunidade' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Mostrando <strong>{filteredPosts.length}</strong> publicações da página oficial
          </div>
        </div>

        {/* Grade de Postagens do Feed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const isLiked = !!userLikedPosts[post.id];
            const commentsCount = (userComments[post.id]?.length || 0) + post.comments;

            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Cabeçalho do Card (Estilo Post Instagram) */}
                <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-rose-500 shrink-0">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <NovoAmanhecerLogo size="sm" showText={false} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-slate-900">
                          {handle.replace('@', '')}
                        </span>
                        <CheckCircle className="w-3 h-3 text-sky-600 fill-sky-600 text-white" />
                      </div>
                      {post.location && (
                        <p className="text-[10px] text-slate-500 truncate max-w-[190px]">
                          {post.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    {post.timestamp}
                  </span>
                </div>

                {/* Imagem do Post com Gatilho para Modal */}
                <div
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square bg-slate-100 cursor-pointer overflow-hidden"
                >
                  <img
                    src={post.media_url}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Indicador de Tipo de Mídia */}
                  <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-950/60 text-white backdrop-blur-xs">
                    {post.media_type === 'CAROUSEL' ? (
                      <Layers className="w-4 h-4" />
                    ) : post.media_type === 'VIDEO' ? (
                      <Play className="w-4 h-4 fill-white" />
                    ) : (
                      <Instagram className="w-4 h-4" />
                    )}
                  </div>

                  {/* Overlay ao passar o mouse */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                    <span className="flex items-center gap-1.5 drop-shadow-md">
                      <Heart className="w-5 h-5 fill-white" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1.5 drop-shadow-md">
                      <MessageCircle className="w-5 h-5 fill-white" />
                      {commentsCount}
                    </span>
                  </div>
                </div>

                {/* Barra de Ações Rápidas */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className="text-slate-700 hover:text-rose-600 transition-colors cursor-pointer"
                          aria-label="Curtir"
                        >
                          <Heart
                            className={`w-5 h-5 transition-transform active:scale-125 ${
                              isLiked ? 'text-rose-600 fill-rose-600' : ''
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                          aria-label="Ver comentários"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleCopyPostLink(post)}
                          className="text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                          title="Compartilhar"
                        >
                          {copiedLink ? (
                            <Check className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Share2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <a
                        href={content.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-amber-700 transition-colors"
                        title="Ver no Instagram oficial"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="text-xs font-black text-slate-900 mb-1.5">
                      {post.likes} curtidas
                    </div>

                    {/* Legenda com corte e expansão */}
                    <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                      <strong className="text-slate-900 mr-1">{handle.replace('@', '')}</strong>
                      {post.caption}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[11px] font-semibold text-sky-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="font-bold text-amber-800 hover:text-amber-900 cursor-pointer"
                    >
                      Ver todos os {commentsCount} comentários →
                    </button>
                    <a
                      href={content.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-slate-500 hover:text-pink-600 inline-flex items-center gap-1"
                    >
                      <span>Abrir app</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé da Seção com Banner de Chamada para o Instagram */}
        <div className="mt-12 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-900 via-pink-900 to-amber-950 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold">
              <Instagram className="w-3.5 h-3.5" />
              <span>Conexão Oficial com o Instagram</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              Gostou de ver nossas ações no Setor Ponta Kayana?
            </h3>
            <p className="text-xs sm:text-sm text-pink-100 max-w-xl">
              Postamos fotos e stories todos os dias mostrando a evolução das crianças no futebol e no ballet, além dos ensaios de gestantes. Siga <strong>{handle}</strong> e deixe seu carinho nos comentários!
            </p>
          </div>

          <a
            href={content.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-amber-100 text-xs sm:text-sm font-black shadow-lg transition-all hover:scale-105 shrink-0"
          >
            <Instagram className="w-4 h-4 text-pink-600" />
            <span>Acessar @anovoamanhecer</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </div>

      {/* MODAL DETALHADO DO POST (Lightbox Estilo Instagram Desktop) */}
      {selectedPost && (
        <div
          onClick={() => setSelectedPost(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col md:flex-row border border-slate-200"
          >
            {/* Botão Fechar Modal */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors cursor-pointer md:text-slate-600 md:bg-slate-100 md:hover:bg-slate-200"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Coluna Esquerda: Imagem */}
            <div className="md:w-1/2 bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={selectedPost.media_url}
                alt={selectedPost.caption}
                className="w-full h-full object-contain max-h-[50vh] md:max-h-[80vh]"
              />
            </div>

            {/* Coluna Direita: Detalhes, Comentários e Ações */}
            <div className="md:w-1/2 flex flex-col justify-between p-6 bg-white overflow-y-auto">
              <div>
                {/* Perfil do Dono */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-rose-500 shrink-0">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      <NovoAmanhecerLogo size="sm" showText={false} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900">
                        {handle.replace('@', '')}
                      </span>
                      <CheckCircle className="w-3.5 h-3.5 text-sky-600 fill-sky-600 text-white" />
                    </div>
                    {selectedPost.location && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>{selectedPost.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Legenda & Comentários */}
                <div className="py-4 space-y-4 max-h-[35vh] overflow-y-auto pr-2">
                  {/* Legenda Principal */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 text-xs font-bold">
                      NA
                    </div>
                    <div className="text-xs text-slate-800 leading-relaxed">
                      <strong className="text-slate-900 mr-1.5">{handle.replace('@', '')}</strong>
                      {selectedPost.caption}
                      <div className="flex flex-wrap gap-1 mt-2 text-sky-700 font-semibold">
                        {selectedPost.tags.map((t, idx) => (
                          <span key={idx}>{t}</span>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{selectedPost.timestamp}</div>
                    </div>
                  </div>

                  {/* Comentários da Comunidade */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-800 text-xs font-bold">
                      MR
                    </div>
                    <div className="text-xs text-slate-800">
                      <strong className="text-slate-900 mr-1.5">marcos.souza_go</strong>
                      Que trabalho impecável! As crianças de Trindade merecem todo esse apoio e incentivo! 👏⚽
                      <div className="text-[10px] text-slate-400 mt-0.5">há 2h · Curtir</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-800 text-xs font-bold">
                      AM
                    </div>
                    <div className="text-xs text-slate-800">
                      <strong className="text-slate-900 mr-1.5">ana.maria_trindade</strong>
                      Minha filha ama as aulas de ballet! Gratidão imensa a todos os voluntários da Ponta Kayana. ❤️
                      <div className="text-[10px] text-slate-400 mt-0.5">há 3h · Curtir</div>
                    </div>
                  </div>

                  {/* Novos Comentários do Usuário */}
                  {(userComments[selectedPost.id] || []).map((cmt, idx) => (
                    <div key={idx} className="flex items-start gap-3 animate-in fade-in">
                      <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center shrink-0 text-amber-900 text-xs font-bold">
                        VC
                      </div>
                      <div className="text-xs text-slate-800">
                        <strong className="text-slate-900 mr-1.5">Você</strong>
                        {cmt}
                        <div className="text-[10px] text-slate-400 mt-0.5">Agora mesmo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações Inferiores & Formulário de Comentário */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLike(selectedPost.id)}
                      className="cursor-pointer"
                    >
                      <Heart
                        className={`w-6 h-6 ${
                          userLikedPosts[selectedPost.id]
                            ? 'text-rose-600 fill-rose-600'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleCopyPostLink(selectedPost)}
                      className="text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>

                  <a
                    href={content.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 bg-pink-50 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Ver no Instagram</span>
                  </a>
                </div>

                <div className="text-xs font-extrabold text-slate-900">
                  {selectedPost.likes} curtidas
                </div>

                {/* Input de comentário ao vivo */}
                <form
                  onSubmit={(e) => handleAddComment(e, selectedPost.id)}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Deixe uma mensagem de carinho..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="p-2 rounded-xl bg-slate-900 text-white disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE STORIES (Visualizador com Barra de Progresso) */}
      {activeStory && (
        <div
          onClick={() => setActiveStory(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm h-[80vh] max-h-[640px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/20"
          >
            {/* Barra de Progresso Superior */}
            <div className="absolute top-3 left-3 right-3 z-30">
              <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-150 ease-linear rounded-full"
                  style={{ width: `${storyProgress}%` }}
                />
              </div>

              {/* Informações do Story */}
              <div className="flex items-center justify-between mt-2.5 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white p-0.5">
                    <NovoAmanhecerLogo size="sm" showText={false} />
                  </div>
                  <div>
                    <span className="text-xs font-black block leading-none">
                      {handle.replace('@', '')}
                    </span>
                    <span className="text-[10px] text-slate-300">{activeStory.timeAgo}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStory(null)}
                  className="p-1 rounded-full text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Imagem de Fundo do Story */}
            <img
              src={activeStory.image}
              alt={activeStory.title}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Gradientes Superior e Inferior */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60 pointer-events-none" />

            <div />

            {/* Rodapé do Story com CTA */}
            <div className="relative z-30 p-5 space-y-3">
              <div className="bg-black/50 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                  {activeStory.category}
                </span>
                <p className="text-xs font-bold leading-snug">
                  {activeStory.title} · Acompanhe nossos stories no Instagram oficial da Associação Novo Amanhecer!
                </p>
              </div>

              <a
                href={content.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-amber-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg"
              >
                <Instagram className="w-4 h-4" />
                <span>Responder no Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
