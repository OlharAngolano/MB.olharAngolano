"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

interface UseSocketProps {
  userId?: string;
  onNewMessage?: (data: any) => void;
  onMessageNotification?: (data: any) => void;
  onUserTyping?: (data: any) => void;
  onMessageRead?: (data: any) => void;
}

export function useSocket({
  userId,
  onNewMessage,
  onMessageNotification,
  onUserTyping,
  onMessageRead,
}: UseSocketProps = {}) {
  const socketRef = useRef<any>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!userId) return;

    const connectSocket = () => {
      try {
        // Initialize Socket.IO connection
        socketRef.current = io({
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
          console.log('Socket connected:', socket.id);
          reconnectAttempts.current = 0;
          
          // Authenticate the user
          socket.emit('authenticate', userId);
        });

        socket.on('disconnect', (reason: string) => {
          console.log('Socket disconnected:', reason);
        });

        socket.on('connect_error', (error: any) => {
          console.error('Socket connection error:', error);
          reconnectAttempts.current++;
          
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
          }
        });

        // Chat events
        socket.on('newMessage', (data: any) => {
          console.log('New message received:', data);
          onNewMessage?.(data);
        });

        socket.on('messageNotification', (data: any) => {
          console.log('Message notification received:', data);
          onMessageNotification?.(data);
        });

        socket.on('userTyping', (data: any) => {
          console.log('User typing status:', data);
          onUserTyping?.(data);
        });

        socket.on('messageRead', (data: any) => {
          console.log('Message read receipt:', data);
          onMessageRead?.(data);
        });

        socket.on('errorMessage', (data: any) => {
          console.error('Socket error message:', data);
        });

      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    connectSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, onNewMessage, onMessageNotification, onUserTyping, onMessageRead]);

  // Socket actions
  const joinConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('joinConversation', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveConversation', conversationId);
    }
  };

  const sendMessage = (data: { conversationId: string; content: string; receiverId: string }) => {
    if (socketRef.current) {
      socketRef.current.emit('sendMessage', data);
    }
  };

  const sendTypingStatus = (conversationId: string, isTyping: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { conversationId, isTyping });
    }
  };

  const markMessageAsRead = (conversationId: string, messageId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('markAsRead', { conversationId, messageId });
    }
  };

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTypingStatus,
    markMessageAsRead,
  };
}