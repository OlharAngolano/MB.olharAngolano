"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, Plus, Bell, Settings, Home, User, BookOpen, Calendar, Users, LogOut, MessageSquare, Image, Link, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePosts } from "@/hooks/use-posts";
import MainLayout from "@/components/layout/main-layout";

export default function MembersArea() {
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postLinks, setPostLinks] = useState<string[]>([""]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading, logout } = useAuth();
  const { posts, loading: postsLoading, createPost, toggleLike, sharePost } = usePosts();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleCreatePost = async () => {
    if (!newPost.trim() && !postImage && postLinks.every(link => !link.trim())) return;

    setIsSubmitting(true);
    
    const postData: any = {
      content: newPost.trim() || " ",
    };

    if (postImage) {
      postData.imageUrl = postImage;
    }

    const validLinks = postLinks.filter(link => link.trim());
    if (validLinks.length > 0) {
      // Add links to the post content
      const linksText = validLinks.map(link => `\n🔗 ${link}`).join('\n');
      postData.content += linksText;
    }

    const result = await createPost(postData);
    
    if (result.success) {
      setNewPost("");
      setPostImage(null);
      setPostLinks([""]);
      setShowLinkInput(false);
    } else {
      console.error("Erro ao criar post:", result.error);
    }
    
    setIsSubmitting(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP.");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("Arquivo muito grande. O tamanho máximo é 10MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload/post-image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPostImage(data.imageUrl);
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao fazer upload da imagem");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddLink = () => {
    setPostLinks([...postLinks, ""]);
  };

  const handleRemoveLink = (index: number) => {
    if (postLinks.length > 1) {
      setPostLinks(postLinks.filter((_, i) => i !== index));
    } else {
      setPostLinks([""]);
    }
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...postLinks];
    newLinks[index] = value;
    setPostLinks(newLinks);
  };

  const removeImage = () => {
    setPostImage(null);
  };

  const handleLike = async (postId: string) => {
    await toggleLike(postId);
  };

  const handleShare = async (postId: string) => {
    await sharePost(postId);
  };

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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const mockUser = {
    name: user.name || "Usuário",
    avatar: user.avatar || "",
    isVerified: user.isVerified,
    badges: user.badges?.map((badge: any) => badge.name) || ["Primeiro Post", "Membro VIP"]
  };

  const channels = [
    { name: "Dúvidas sobre YouTube", icon: "🎥", count: 45 },
    { name: "Equipamentos e Dicas", icon: "📹", count: 32 },
    { name: "Marketing Digital", icon: "📈", count: 28 },
    { name: "Geral", icon: "💬", count: 156 }
  ];

  return (
    <MainLayout requireAuth={true}>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
          {/* Left Column - Channels */}
          <div className="lg:col-span-3">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Canais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {channels.map((channel) => (
                  <Button
                    key={channel.name}
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:text-primary hover:bg-accent"
                  >
                    <span className="mr-2">{channel.icon}</span>
                    {channel.name}
                    <Badge variant="secondary" className="ml-auto bg-accent text-accent-foreground">
                      {channel.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Feed */}
          <div className="lg:col-span-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Criar Post</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-3">
                  <Avatar>
                    <AvatarImage src={mockUser.avatar} />
                    <AvatarFallback>{mockUser.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Compartilhe algo com a comunidade..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground mb-3"
                      rows={3}
                    />
                    
                    {/* Image Upload Section */}
                    {postImage && (
                      <div className="relative mb-3">
                        <img 
                          src={postImage} 
                          alt="Imagem do post" 
                          className="w-full max-h-64 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Links Section */}
                    {showLinkInput && (
                      <div className="space-y-2 mb-3">
                        {postLinks.map((link, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              type="url"
                              placeholder="https://exemplo.com"
                              value={link}
                              onChange={(e) => handleLinkChange(index, e.target.value)}
                              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveLink(index)}
                              className="px-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddLink}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar outro link
                        </Button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="text-muted-foreground hover:text-primary"
                        >
                          {uploadingImage ? (
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                          ) : (
                            <Image className="h-4 w-4 mr-2" />
                          )}
                          Foto
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLinkInput(!showLinkInput)}
                          className={`text-muted-foreground hover:text-primary ${showLinkInput ? 'bg-primary text-primary-foreground' : ''}`}
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Link
                        </Button>
                      </div>
                      
                      <Button 
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleCreatePost}
                        disabled={isSubmitting || (!newPost.trim() && !postImage && postLinks.every(link => !link.trim()))}
                      >
                        {isSubmitting ? "Publicando..." : "Publicar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 mt-6">
              {postsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Carregando posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Nenhum post ainda. Seja o primeiro a compartilhar algo!</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className={`bg-card border-border ${post.isHighlighted ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>{post.author.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-foreground">{post.author.name}</h3>
                            {post.author.isVerified && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${post.author.verificationType === 'admin' ? 'bg-white text-black' : 'bg-yellow-500 text-black'}`}
                              >
                                ✓
                              </Badge>
                            )}
                            {post.author.isAdmin && (
                              <Badge variant="destructive" className="text-xs">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          {post.title && (
                            <h4 className="font-semibold text-foreground mt-2">{post.title}</h4>
                          )}
                          
                          {/* Post Image */}
                          {post.imageUrl && (
                            <div className="mt-3">
                              <img 
                                src={post.imageUrl} 
                                alt="Imagem do post" 
                                className="w-full max-h-96 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          {/* Post Content with Links */}
                          <div className="mt-3">
                            {post.content.split('\n').map((line, index) => {
                              if (line.trim().startsWith('🔗')) {
                                const url = line.trim().substring(1).trim();
                                return (
                                  <div key={index} className="mb-2">
                                    <a 
                                      href={url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline break-all"
                                    >
                                      🔗 {url}
                                    </a>
                                  </div>
                                );
                              }
                              return line.trim() ? (
                                <p key={index} className="mb-2">{line}</p>
                              ) : (
                                <br key={index} />
                              );
                            })}
                          </div>
                          
                          <div className="flex items-center space-x-6 mt-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-muted-foreground hover:text-primary"
                              onClick={() => handleLike(post.id)}
                            >
                              <Heart className="h-4 w-4 mr-1" />
                              {post._count.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {post._count.comments}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-muted-foreground hover:text-primary"
                              onClick={() => handleShare(post.id)}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              {post._count.shares}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Profile Quick View */}
          <div className="lg:col-span-3">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Meu Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-3">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={mockUser.avatar} />
                    <AvatarFallback className="text-lg">{mockUser.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground">{mockUser.name}</h3>
                    {mockUser.isVerified && (
                      <Badge variant="secondary" className="mt-1 bg-yellow-500 text-black">
                        ✓ Verificado
                      </Badge>
                    )}
                    {user.isAdmin && (
                      <Badge variant="destructive" className="mt-1 ml-1">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <div className="w-full">
                    <Separator className="bg-border" />
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Badges</h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mockUser.badges.map((badge) => (
                          <Badge key={badge} variant="outline" className="text-xs border-border text-foreground">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="text-primary">Notificações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Novo comentário no seu post</p>
                      <p className="text-xs text-muted-foreground">há 2 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Novo membro na comunidade</p>
                      <p className="text-xs text-muted-foreground">há 1 hora</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}