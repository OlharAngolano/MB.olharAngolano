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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, Search, Edit, Trash2, Heart, MessageCircle, Share, Eye, Pin, Star } from "lucide-react";

interface Post {
  id: string;
  title?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  isPinned: boolean;
  isHighlighted: boolean;
  createdAt: string;
  author: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  channel?: {
    id: string;
    name: string;
    color: string;
  };
  _count: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  post: {
    id: string;
    title?: string;
    content: string;
  };
}

interface ContentManagementProps {
  sessionCookie: string;
}

export default function ContentManagement({ sessionCookie }: ContentManagementProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("posts");
  const [selectedItem, setSelectedItem] = useState<Post | Comment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [currentPage, searchTerm, activeTab]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchTerm,
        type: activeTab
      });

      const response = await fetch(`/api/admin/content?${params}`, {
        headers: {
          "Cookie": `session=${sessionCookie}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.type === "posts") {
          setPosts(data.data);
        } else {
          setComments(data.data);
        }
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: Post | Comment) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteItem = (item: Post | Comment) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const updateItem = async (updateData: any) => {
    if (!selectedItem) return;

    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `session=${sessionCookie}`
        },
        body: JSON.stringify({
          type: activeTab,
          id: selectedItem.id,
          ...updateData
        })
      });

      if (response.ok) {
        await fetchContent();
        setIsEditDialogOpen(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const deleteItem = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`/api/admin/content?type=${activeTab}&id=${selectedItem.id}`, {
        method: "DELETE",
        headers: {
          "Cookie": `session=${sessionCookie}`
        }
      });

      if (response.ok) {
        await fetchContent();
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
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
          <h2 className="text-2xl font-bold">Gerenciamento de Conteúdo</h2>
          <p className="text-muted-foreground">
            Gerencie posts e comentários da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comentários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Estatísticas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="font-medium flex items-center gap-2">
                            {post.isPinned && <Pin className="h-4 w-4 text-red-500" />}
                            {post.isHighlighted && <Star className="h-4 w-4 text-yellow-500" />}
                            {post.title || "Sem título"}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.content}
                          </p>
                          {post.imageUrl && (
                            <div className="text-xs text-blue-500">Contém imagem</div>
                          )}
                          {post.videoUrl && (
                            <div className="text-xs text-green-500">Contém vídeo</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={post.author.avatar} />
                            <AvatarFallback>{post.author.name?.charAt(0) || post.author.email.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{post.author.name || "Sem nome"}</div>
                            <div className="text-sm text-muted-foreground">{post.author.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.channel && (
                          <Badge variant="outline" style={{ borderColor: post.channel.color }}>
                            {post.channel.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post._count.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post._count.comments}
                          </div>
                          <div className="flex items-center gap-1">
                            <Share className="h-3 w-3" />
                            {post._count.shares}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {post.isPinned && <Badge variant="destructive">Fixado</Badge>}
                          {post.isHighlighted && <Badge variant="default">Destaque</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditItem(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(post)}
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
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comentário</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Post</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <p className="text-sm line-clamp-3">{comment.content}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={comment.author.avatar} />
                            <AvatarFallback>{comment.author.name?.charAt(0) || comment.author.email.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{comment.author.name || "Sem nome"}</div>
                            <div className="text-sm text-muted-foreground">{comment.author.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {comment.post.title || "Sem título"}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {comment.post.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditItem(comment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(comment)}
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
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "posts" ? "Editar Post" : "Editar Comentário"}
            </DialogTitle>
            <DialogDescription>
              Altere as informações do conteúdo selecionado.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && activeTab === "posts" && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Título
                </Label>
                <Input
                  id="title"
                  defaultValue={(selectedItem as Post).title || ""}
                  className="col-span-3"
                  onChange={(e) => setSelectedItem({...selectedItem, title: e.target.value} as Post)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right">
                  Conteúdo
                </Label>
                <Textarea
                  id="content"
                  defaultValue={(selectedItem as Post).content}
                  className="col-span-3"
                  rows={4}
                  onChange={(e) => setSelectedItem({...selectedItem, content: e.target.value} as Post)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isPinned" className="text-right">
                  Fixado
                </Label>
                <Switch
                  id="isPinned"
                  checked={(selectedItem as Post).isPinned}
                  onCheckedChange={(checked) => setSelectedItem({...selectedItem, isPinned: checked} as Post)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isHighlighted" className="text-right">
                  Destaque
                </Label>
                <Switch
                  id="isHighlighted"
                  checked={(selectedItem as Post).isHighlighted}
                  onCheckedChange={(checked) => setSelectedItem({...selectedItem, isHighlighted: checked} as Post)}
                />
              </div>
            </div>
          )}
          {selectedItem && activeTab === "comments" && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right">
                  Comentário
                </Label>
                <Textarea
                  id="content"
                  defaultValue={(selectedItem as Comment).content}
                  className="col-span-3"
                  rows={4}
                  onChange={(e) => setSelectedItem({...selectedItem, content: e.target.value} as Comment)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => updateItem(selectedItem)}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Excluir {activeTab === "posts" ? "Post" : "Comentário"}
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este {activeTab === "posts" ? "post" : "comentário"}? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteItem}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}