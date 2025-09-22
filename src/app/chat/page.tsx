"use client";

import { useState } from "react";
import ChatSidebar from "@/components/chat/chat-sidebar";
import ChatWindow from "@/components/chat/chat-window";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    conversations, 
    selectedConversationId, 
    setSelectedConversationId, 
    loading: conversationsLoading,
    getSelectedConversation 
  } = useChat();
  const router = useRouter();
  const [showMobileChat, setShowMobileChat] = useState(false);

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
    router.push("/login");
    return null;
  }

  const selectedConversation = getSelectedConversation();

  return (
    <MainLayout requireAuth={true}>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary flex items-center">
            <MessageSquare className="h-8 w-8 mr-3" />
            Chat Direto
          </h1>
          <p className="text-muted-foreground mt-2">
            Converse diretamente com outros membros da comunidade
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat Sidebar - Always visible on desktop, conditionally on mobile */}
          <div className={`lg:block ${showMobileChat ? 'hidden' : 'block'} lg:col-span-1`}>
            <ChatSidebar
              selectedConversationId={selectedConversationId || undefined}
              onSelectConversation={(id) => {
                setSelectedConversationId(id);
                setShowMobileChat(true);
              }}
              onCreateConversation={() => {}}
            />
          </div>

          {/* Chat Window - Hidden on mobile when sidebar is shown */}
          <div className={`lg:block ${showMobileChat ? 'block' : 'hidden'} lg:col-span-2`}>
            {selectedConversation ? (
              <ChatWindow
                conversationId={selectedConversation.id}
                otherUser={selectedConversation.user}
                onBack={() => setShowMobileChat(false)}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-card border-border rounded-lg border">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                  <p>Escolha uma conversa da lista ou inicie uma nova</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}