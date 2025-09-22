"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Calendar, Award, TrendingUp, Settings, BarChart3, Activity } from "lucide-react";
import UserManagement from "@/components/admin/user-management";
import ContentManagement from "@/components/admin/content-management";
import GamificationManagement from "@/components/admin/gamification-management";
import MainLayout from "@/components/layout/main-layout";

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalEvents: number;
  recentUsers: any[];
  recentPosts: any[];
  upcomingEvents: any[];
}

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  isVerified: boolean;
  verificationType?: string;
  avatar?: string;
  bio?: string;
  profile?: any;
  badges: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 156,
    totalPosts: 89,
    totalComments: 342,
    totalEvents: 12,
    recentUsers: [
      { id: "1", name: "Maria Silva", email: "maria@example.com", createdAt: new Date().toISOString(), isAdmin: false },
      { id: "2", name: "João Santos", email: "joao@example.com", createdAt: new Date().toISOString(), isAdmin: false },
      { id: "3", name: "Ana Costa", email: "ana@example.com", createdAt: new Date().toISOString(), isAdmin: false }
    ],
    recentPosts: [
      { id: "1", title: "Bem-vindos à comunidade!", content: "Sejam todos bem-vindos...", createdAt: new Date().toISOString() },
      { id: "2", title: "Dúvida sobre edição", content: "Alguém sabe um bom software...", createdAt: new Date().toISOString() }
    ],
    upcomingEvents: [
      { id: "1", title: "Live Q&A", startTime: new Date().toISOString(), isVirtual: true },
      { id: "2", title: "Workshop de Edição", startTime: new Date().toISOString(), isVirtual: false }
    ]
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ value: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Get session cookie from document
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session='));
      
      if (sessionCookie) {
        const sessionValue = sessionCookie.split('=')[1];
        setSession({ value: sessionValue });
        
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você precisa estar logado para acessar o painel administrativo.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/login'}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o painel administrativo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout requireAuth={true}>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie sua comunidade Olhar Angolano</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando estatísticas...</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted border-border">
              <TabsTrigger value="overview" className="text-foreground hover:text-primary">
                <BarChart3 className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="users" className="text-foreground hover:text-primary">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="content" className="text-foreground hover:text-primary">
                <MessageSquare className="h-4 w-4 mr-2" />
                Conteúdo
              </TabsTrigger>
              <TabsTrigger value="events" className="text-foreground hover:text-primary">
                <Calendar className="h-4 w-4 mr-2" />
                Eventos
              </TabsTrigger>
              <TabsTrigger value="gamification" className="text-foreground hover:text-primary">
                <Award className="h-4 w-4 mr-2" />
                Gamificação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                        <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Posts</p>
                        <p className="text-3xl font-bold text-primary">{stats.totalPosts}</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Eventos</p>
                        <p className="text-3xl font-bold text-primary">{stats.totalEvents}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Comentários</p>
                        <p className="text-3xl font-bold text-primary">{stats.totalComments}</p>
                      </div>
                      <Activity className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-primary">Usuários Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentUsers.length > 0 ? (
                        stats.recentUsers.map((recentUser) => (
                          <div key={recentUser.id} className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={recentUser.avatar} />
                              <AvatarFallback>{recentUser.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{recentUser.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(recentUser.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            {recentUser.isAdmin && (
                              <Badge variant="destructive">Admin</Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          Nenhum usuário recente
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-primary">Próximos Eventos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.upcomingEvents.length > 0 ? (
                        stats.upcomingEvents.map((event) => (
                          <div key={event.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-foreground">{event.title}</h4>
                              {event.isVirtual && (
                                <Badge variant="secondary">Virtual</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.startTime).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          Nenhum evento agendado
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <UserManagement sessionCookie={session?.value || ''} />
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <ContentManagement sessionCookie={session?.value || ''} />
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-primary">Gerenciamento de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">
                        Crie e gerencie eventos para sua comunidade
                      </p>
                      <Button onClick={() => window.location.href = '/calendar'}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Gerenciar Eventos
                      </Button>
                    </div>
                    <div className="text-center py-4">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Acesse a página de calendário para gerenciar eventos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gamification" className="space-y-6">
              <GamificationManagement sessionCookie={session?.value || ''} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}