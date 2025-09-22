"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  verificationType?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface ChatWindowProps {
  conversationId: string;
  otherUser: User;
  onBack?: () => void;
}

export default function ChatWindow({ conversationId, otherUser, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Socket.IO integration
  const { joinConversation, leaveConversation, sendMessage: sendSocketMessage, sendTypingStatus } = useSocket({
    userId: user?.id,
    onNewMessage: (data) => {
      if (data.conversationId === conversationId) {
        // Add the new message to the list
        const newMessage: Message = {
          id: `socket-${Date.now()}`,
          content: data.content,
          senderId: data.senderId,
          createdAt: data.timestamp,
          sender: {
            id: data.senderId,
            name: data.senderId === user?.id ? user.name || "Você" : otherUser.name,
            avatar: data.senderId === user?.id ? user.avatar : otherUser.avatar,
          }
        };
        setMessages(prev => [...prev, newMessage]);
        setOtherUserTyping(false);
      }
    },
    onUserTyping: (data) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setOtherUserTyping(data.isTyping);
        if (data.isTyping) {
          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          // Set new timeout to hide typing indicator
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        }
      }
    }
  });

  useEffect(() => {
    loadMessages();
    if (user?.id) {
      joinConversation(conversationId);
    }
    
    return () => {
      if (user?.id) {
        leaveConversation(conversationId);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setSending(true);
    
    try {
      // Send via API first
      const response = await fetch(`/api/chat/messages/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage("");
        
        // Send via Socket.IO for real-time updates
        if (user?.id) {
          sendSocketMessage({
            conversationId,
            content: messageContent,
            receiverId: otherUser.id
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Handle typing indicator
    if (user?.id) {
      if (!isTyping && value.length > 0) {
        setIsTyping(true);
        sendTypingStatus(conversationId, true);
      } else if (isTyping && value.length === 0) {
        setIsTyping(false);
        sendTypingStatus(conversationId, false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getVerificationBadge = () => {
    if (otherUser.isVerified) {
      return (
        <Badge 
          variant="secondary" 
          className={`text-xs ${otherUser.verificationType === 'admin' ? 'bg-white text-black' : 'bg-yellow-500 text-black'}`}
        >
          ✓ Verificado
        </Badge>
      );
    }
    return null;
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center bg-card border-border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando mensagens...</p>
        </div>
      </Card>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.avatar} />
            <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground">{otherUser.name}</h3>
              {getVerificationBadge()}
            </div>
            <p className="text-sm text-muted-foreground">{otherUser.email}</p>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground">
              <div>
                <p className="text-lg font-medium mb-2">Nenhuma mensagem ainda</p>
                <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(messageGroups).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatDate(date)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {dateMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.senderId === user?.id
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === user?.id 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground px-4 py-2 rounded-2xl rounded-bl-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      
      <div className="p-4 border-t border-border">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-input border-border text-foreground"
            disabled={sending}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}