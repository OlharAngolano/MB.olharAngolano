"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Plus, Edit, Trash2, Users, Trophy, Star, Medal, Target, Crown } from "lucide-react";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  createdAt: string;
  users: Array<{
    user: {
      id: string;
      name?: string;
      email: string;
      avatar?: string;
    };
    earnedAt: string;
  }>;
}

interface GamificationManagementProps {
  sessionCookie: string;
}

export default function GamificationManagement({ sessionCookie }: GamificationManagementProps) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email: string; avatar?: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "🏆",
    color: "#FFD700",
    category: "achievement"
  });

  useEffect(() => {
    fetchBadges();
    fetchUsers();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/badges", {
        headers: {
          "Cookie": `session=${sessionCookie}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=1000", {
        headers: {
          "Cookie": `session=${sessionCookie}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateBadge = async () => {
    try {
      const response = await fetch("/api/admin/badges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `session=${sessionCookie}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchBadges();
        setIsCreateDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          icon: "🏆",
          color: "#FFD700",
          category: "achievement"
        });
      }
    } catch (error) {
      console.error("Error creating badge:", error);
    }
  };

  const handleUpdateBadge = async () => {
    if (!selectedBadge) return;

    try {
      const response = await fetch("/api/admin/badges", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `session=${sessionCookie}`
        },
        body: JSON.stringify({
          badgeId: selectedBadge.id,
          ...formData
        })
      });

      if (response.ok) {
        await fetchBadges();
        setIsEditDialogOpen(false);
        setSelectedBadge(null);
      }
    } catch (error) {
      console.error("Error updating badge:", error);
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    try {
      const response = await fetch(`/api/admin/badges?badgeId=${badgeId}`, {
        method: "DELETE",
        headers: {
          "Cookie": `session=${sessionCookie}`
        }
      });

      if (response.ok) {
        await fetchBadges();
      }
    } catch (error) {
      console.error("Error deleting badge:", error);
    }
  };

  const handleAwardBadge = async () => {
    if (!selectedBadge || !selectedUser) return;

    try {
      const response = await fetch("/api/admin/badges/award", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `session=${sessionCookie}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          badgeId: selectedBadge.id
        })
      });

      if (response.ok) {
        await fetchBadges();
        setIsAwardDialogOpen(false);
        setSelectedBadge(null);
        setSelectedUser("");
      }
    } catch (error) {
      console.error("Error awarding badge:", error);
    }
  };

  const handleRemoveBadge = async (userId: string, badgeId: string) => {
    try {
      const response = await fetch(`/api/admin/badges/award?userId=${userId}&badgeId=${badgeId}`, {
        method: "DELETE",
        headers: {
          "Cookie": `session=${sessionCookie}`
        }
      });

      if (response.ok) {
        await fetchBadges();
      }
    } catch (error) {
      console.error("Error removing badge:", error);
    }
  };

  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      icon: "🏆",
      color: "#FFD700",
      category: "achievement"
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (badge: BadgeData) => {
    setSelectedBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      category: badge.category
    });
    setIsEditDialogOpen(true);
  };

  const openAwardDialog = (badge: BadgeData) => {
    setSelectedBadge(badge);
    setIsAwardDialogOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "achievement": return <Trophy className="h-4 w-4" />;
      case "vip": return <Crown className="h-4 w-4" />;
      case "special": return <Star className="h-4 w-4" />;
      default: return <Medal className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Gamificação</h2>
          <p className="text-muted-foreground">
            Gerencie badges e conquistas da comunidade
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Badge
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Badges</p>
                <p className="text-3xl font-bold text-primary">{badges.length}</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Badges Atribuídas</p>
                <p className="text-3xl font-bold text-primary">
                  {badges.reduce((total, badge) => total + badge.users.length, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários com Badges</p>
                <p className="text-3xl font-bold text-primary">
                  {new Set(badges.flatMap(badge => badge.users.map(u => u.user.id))).size}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Badges e Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Badge</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Atribuições</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div 
                        className="text-2xl p-2 rounded-lg"
                        style={{ backgroundColor: badge.color + "20" }}
                      >
                        {badge.icon}
                      </div>
                      <div>
                        <div className="font-medium">{badge.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {badge.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-xs">{badge.description}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(badge.category)}
                      <Badge variant="outline" className="capitalize">
                        {badge.category}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {badge.users.length} usuários
                      </div>
                      <div className="flex -space-x-2">
                        {badge.users.slice(0, 3).map((userBadge, index) => (
                          <Avatar key={index} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={userBadge.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {userBadge.user.name?.charAt(0) || userBadge.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {badge.users.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{badge.users.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(badge.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAwardDialog(badge)}
                      >
                        <Award className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(badge)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBadge(badge.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Badge Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Badge</DialogTitle>
            <DialogDescription>
              Crie uma nova badge para o sistema de gamificação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Ícone
              </Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                className="col-span-3"
                placeholder="🏆"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Cor
              </Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="col-span-3 h-10"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoria
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achievement">Conquista</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="special">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBadge}>
              Criar Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Badge Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Badge</DialogTitle>
            <DialogDescription>
              Altere as informações da badge selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Ícone
              </Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Cor
              </Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="col-span-3 h-10"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoria
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achievement">Conquista</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="special">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateBadge}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Badge Dialog */}
      <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atribuir Badge</DialogTitle>
            <DialogDescription>
              Selecione um usuário para atribuir esta badge.
            </DialogDescription>
          </DialogHeader>
          {selectedBadge && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="text-2xl">{selectedBadge.icon}</div>
                <div>
                  <div className="font-medium">{selectedBadge.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedBadge.description}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Selecione o usuário</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs">
                              {user.name?.charAt(0) || user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name || user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAwardDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAwardBadge} disabled={!selectedUser}>
              Atribuir Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}