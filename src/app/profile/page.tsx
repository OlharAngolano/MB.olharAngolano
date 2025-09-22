"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, MessageCircle, Share2, Edit, Calendar, MapPin, Globe, Mail, User, Settings, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePosts } from "@/hooks/use-posts";
import { useToast } from "@/hooks/use-toast";
import ProfileEditor from "@/components/profile/profile-editor";
import MainLayout from "@/components/layout/main-layout";

function ProfileContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { user, loading: authLoading, logout } = useAuth();
  const { posts, loading: postsLoading } = usePosts();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get("id");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setBio(user.bio || "");
      setLocation(user.profile?.location || "");
      setWebsite(user.profile?.website || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    // TODO: Implement profile update API
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Todos os campos são obrigatórios");
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      if (response.ok) {
        toast({
          title: "Senha alterada com sucesso",
          description: "Sua senha foi atualizada com sucesso.",
        });
        setIsChangingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        setPasswordError(data.error || "Erro ao alterar senha");
      }
    } catch (error) {
      setPasswordError("Erro de conexão. Tente novamente.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const userPosts = posts.filter(post => post.author.id === user?.id);

  if (authLoading) {
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
    return null; // Will redirect to login
  }

  const verificationBadge = user.isVerified ? (
    <Badge 
      variant="secondary" 
      className={`text-xs ${user.verificationType === 'admin' ? 'bg-white text-black' : 'bg-yellow-500 text-black'}`}
    >
      ✓ Verificado
    </Badge>
  ) : null;

  return (
    <MainLayout requireAuth={true}>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-2xl">{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <ProfileEditor user={user} />
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <h1 className="text-2xl font-bold text-foreground">{user.name || "Usuário"}</h1>
                      {verificationBadge}
                    </div>
                    {user.isAdmin && (
                      <Badge variant="destructive" className="mt-1">
                        Administrador
                      </Badge>
                    )}
                    <p className="text-muted-foreground mt-1">@{user.email?.split("@")[0]}</p>
                  </div>

                  {isEditing ? (
                    <div className="w-full space-y-4">
                      <div>
                        <Label htmlFor="bio" className="text-foreground">Bio</Label>
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="bg-input border-border text-foreground mt-1"
                          placeholder="Conte-nos sobre você..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="location" className="text-foreground">Localização</Label>
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="bg-input border-border text-foreground mt-1"
                          placeholder="Cidade, País"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website" className="text-foreground">Website</Label>
                        <Input
                          id="website"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="bg-input border-border text-foreground mt-1"
                          placeholder="https://seusite.com"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleSaveProfile}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                        >
                          Salvar
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      {bio && (
                        <div className="mb-4">
                          <p className="text-foreground">{bio}</p>
                        </div>
                      )}
                      
                      <div className="space-y-2 text-sm">
                        {location && (
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{location}</span>
                          </div>
                        )}
                        {website && (
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Globe className="h-4 w-4" />
                            <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {website}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Badges Card */}
            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="text-primary">Conquistas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {user.badges?.map((userBadge: any) => (
                    <div key={userBadge.badge.id} className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-2xl mb-1">{userBadge.badge.icon || "🏆"}</div>
                      <div className="text-xs font-medium text-foreground">{userBadge.badge.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{userBadge.badge.description}</div>
                    </div>
                  )) || (
                    <>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="text-xs font-medium text-foreground">Primeiro Post</div>
                        <div className="text-xs text-muted-foreground mt-1">Crie seu primeiro post</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <div className="text-2xl mb-1">⭐</div>
                        <div className="text-xs font-medium text-foreground">Membro VIP</div>
                        <div className="text-xs text-muted-foreground mt-1">Membro ativo</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="text-primary flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isChangingPassword ? (
                  <div className="space-y-4">
                    <Button
                      onClick={() => setIsChangingPassword(true)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <Label htmlFor="currentPassword" className="text-foreground">
                        Senha Atual
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="bg-input border-border text-foreground mt-1 pr-10"
                          placeholder="Digite sua senha atual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="newPassword" className="text-foreground">
                        Nova Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-input border-border text-foreground mt-1 pr-10"
                          placeholder="Digite sua nova senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword" className="text-foreground">
                        Confirmar Nova Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-input border-border text-foreground mt-1 pr-10"
                          placeholder="Confirme sua nova senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleChangePassword}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? "Alterando..." : "Alterar Senha"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsChangingPassword(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - User Posts */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Meus Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Carregando posts...</p>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Você ainda não fez nenhum post.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <div key={post.id} className="border-b border-border pb-4 last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{post.title || "Post sem título"}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                              {post.content}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</span>
                              <div className="flex items-center space-x-1">
                                <Heart className="h-3 w-3" />
                                <span>{post._count?.likes || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{post._count?.comments || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Share2 className="h-3 w-3" />
                                <span>{post._count?.shares || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}