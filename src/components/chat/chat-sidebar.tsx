"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  verificationType?: string;
}

interface Conversation {
  id: string;
  user: User;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
    isRead: boolean;
  };
  lastMessageAt?: string;
  unreadCount: number;
}

interface ChatSidebarProps {
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (userId: string) => void;
}

export default function ChatSidebar({ 
  selectedConversationId, 
  onSelectConversation, 
  onCreateConversation 
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/chat/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const response = await fetch(`/api/chat/users?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchUsers(value);
  };

  const handleCreateConversation = async (userId: string) => {
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        await loadConversations();
        setShowUserSearch(false);
        setSearchQuery("");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getVerificationBadge = (user: User) => {
    if (user.isVerified) {
      return (
        <Badge 
          variant="secondary" 
          className={`text-xs ${user.verificationType === 'admin' ? 'bg-white text-black' : 'bg-yellow-500 text-black'}`}
        >
          ✓
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Mensagens
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {showUserSearch ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        
        {showUserSearch && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-input border-border text-foreground pl-10"
            />
            {users.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-1 z-10 bg-card border-border">
                <ScrollArea className="max-h-64">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                      onClick={() => handleCreateConversation(user.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm text-foreground">{user.name}</span>
                          {getVerificationBadge(user)}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </Card>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando conversas...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma conversa ainda</p>
              <p className="text-sm">Clique no + para iniciar uma nova conversa</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 hover:bg-muted cursor-pointer border-l-4 transition-colors ${
                    selectedConversationId === conversation.id
                      ? 'border-primary bg-muted'
                      : 'border-transparent'
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.user.avatar} />
                      <AvatarFallback>{conversation.user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground truncate">
                            {conversation.user.name}
                          </span>
                          {getVerificationBadge(conversation.user)}
                        </div>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      
                      {conversation.lastMessage && (
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.senderId === user?.id ? 'Você: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}