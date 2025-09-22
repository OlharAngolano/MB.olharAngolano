"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Upload, Camera, Save, X, Move, ZoomIn, ZoomOut } from "lucide-react";

interface ProfileData {
  name?: string;
  bio?: string;
  avatar?: string;
  profile?: {
    location?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      instagram?: string;
      youtube?: string;
      linkedin?: string;
    };
  };
}

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
}

interface ProfileEditorProps {
  user: {
    id: string;
    name?: string;
    email: string;
    bio?: string;
    avatar?: string;
    profile?: any;
  };
  onUpdate?: (profileData: ProfileData) => void;
}

export default function ProfileEditor({ user, onUpdate }: ProfileEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPositionControls, setShowPositionControls] = useState(false);
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ x: 0, y: 0, scale: 1 });
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user.name || "",
    bio: user.bio || "",
    avatar: user.avatar || "",
    profile: {
      location: user.profile?.location || "",
      website: user.profile?.website || "",
      socialLinks: user.profile?.socialLinks || {
        twitter: "",
        instagram: "",
        youtube: "",
        linkedin: ""
      }
    }
  });

  useEffect(() => {
    setProfileData({
      name: user.name || "",
      bio: user.bio || "",
      avatar: user.avatar || "",
      profile: {
        location: user.profile?.location || "",
        website: user.profile?.website || "",
        socialLinks: user.profile?.socialLinks || {
          twitter: "",
          instagram: "",
          youtube: "",
          linkedin: ""
        }
      }
    });
  }, [user]);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const { naturalWidth, naturalHeight } = img;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
    
    // Check if image is not 1:1 aspect ratio
    if (naturalWidth !== naturalHeight) {
      setShowPositionControls(true);
    } else {
      setShowPositionControls(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!showPositionControls) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !showPositionControls) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Calculate boundaries based on scale and container size
    const containerSize = 96; // Avatar size (h-24 w-24)
    const scaledWidth = (imageDimensions?.width || 0) * imagePosition.scale;
    const scaledHeight = (imageDimensions?.height || 0) * imagePosition.scale;
    
    const maxX = Math.max(0, (scaledWidth - containerSize) / 2);
    const maxY = Math.max(0, (scaledHeight - containerSize) / 2);
    
    setImagePosition(prev => ({
      ...prev,
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY))
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (value: number[]) => {
    const newScale = value[0];
    setImagePosition(prev => ({ ...prev, scale: newScale }));
  };

  const resetPosition = () => {
    setImagePosition({ x: 0, y: 0, scale: 1 });
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

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Arquivo muito grande. O tamanho máximo é 5MB.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      // Reset position controls for new image
      setImagePosition({ x: 0, y: 0, scale: 1 });
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      
      // Add positioning data if controls are shown
      if (showPositionControls) {
        formData.append("position", JSON.stringify(imagePosition));
      }

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(prev => ({ ...prev, avatar: data.avatarUrl }));
        setPreviewUrl(null);
        setShowPositionControls(false);
        setImagePosition({ x: 0, y: 0, scale: 1 });
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao fazer upload da imagem");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate?.(data.user);
        setIsOpen(false);
        // Reload page to update avatar
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao salvar perfil");
      }
    } catch (error) {
      console.error("Save profile error:", error);
      alert("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Camera className="h-4 w-4 mr-2" />
          Editar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais e foto de perfil.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div 
                ref={containerRef}
                className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {(previewUrl || profileData.avatar) && (
                  <img
                    ref={imageRef}
                    src={previewUrl || profileData.avatar}
                    alt="Avatar preview"
                    className="absolute inset-0 w-full h-full object-cover cursor-move select-none"
                    style={{
                      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imagePosition.scale})`,
                      transformOrigin: 'center center',
                    }}
                    onLoad={handleImageLoad}
                    onMouseDown={handleMouseDown}
                    draggable={false}
                  />
                )}
                <AvatarFallback className="absolute inset-0 flex items-center justify-center text-lg w-full h-full">
                  {profileData.name?.charAt(0) || user.email.charAt(0)}
                </AvatarFallback>
              </div>
              <Label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
              >
                {uploading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Clique na câmera para alterar sua foto de perfil
            </p>

            {/* Image Positioning Controls */}
            {showPositionControls && (
              <Card className="w-full max-w-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Move className="h-4 w-4" />
                    Ajustar Posição da Imagem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Zoom</Label>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(imagePosition.scale * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ZoomOut className="h-3 w-3 text-muted-foreground" />
                      <Slider
                        value={[imagePosition.scale]}
                        onValueChange={handleScaleChange}
                        min={0.5}
                        max={3}
                        step={0.1}
                        className="flex-1"
                      />
                      <ZoomIn className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Arraste a imagem para reposicionar
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetPosition}
                        className="flex-1"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Resetar
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <p>• Arraste a imagem para ajustar a posição</p>
                    <p>• Use o zoom para ampliar ou reduzir</p>
                    <p>• Clique em "Resetar" para voltar ao original</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={profileData.name || ""}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={profileData.profile?.location || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    profile: { ...prev.profile!, location: e.target.value }
                  }))}
                  placeholder="Cidade, País"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profileData.profile?.website || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    profile: { ...prev.profile!, website: e.target.value }
                  }))}
                  placeholder="https://seusite.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Redes Sociais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={profileData.profile?.socialLinks?.twitter || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile!,
                      socialLinks: { ...prev.profile!.socialLinks!, twitter: e.target.value }
                    }
                  }))}
                  placeholder="@seuusuario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={profileData.profile?.socialLinks?.instagram || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile!,
                      socialLinks: { ...prev.profile!.socialLinks!, instagram: e.target.value }
                    }
                  }))}
                  placeholder="@seuusuario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={profileData.profile?.socialLinks?.youtube || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile!,
                      socialLinks: { ...prev.profile!.socialLinks!, youtube: e.target.value }
                    }
                  }))}
                  placeholder="URL do seu canal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={profileData.profile?.socialLinks?.linkedin || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile!,
                      socialLinks: { ...prev.profile!.socialLinks!, linkedin: e.target.value }
                    }
                  }))}
                  placeholder="URL do seu perfil"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSaveProfile} disabled={loading || uploading}>
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}