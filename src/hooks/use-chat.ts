"use client";

import { useState, useEffect } from "react";

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

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const createConversation = async (userId: string) => {
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
        return true;
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
    return false;
  };

  const getSelectedConversation = () => {
    return conversations.find(c => c.id === selectedConversationId);
  };

  return {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    loading,
    loadConversations,
    createConversation,
    getSelectedConversation
  };
}