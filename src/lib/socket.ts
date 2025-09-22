import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  // Store user sessions
  const userSockets = new Map<string, string>(); // userId -> socketId
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle user authentication
    socket.on('authenticate', (userId: string) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    });
    
    // Handle joining conversation rooms
    socket.on('joinConversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });
    
    // Handle leaving conversation rooms
    socket.on('leaveConversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });
    
    // Handle sending messages
    socket.on('sendMessage', async (data: {
      conversationId: string;
      content: string;
      receiverId: string;
    }) => {
      try {
        // Broadcast message to conversation room
        io.to(`conversation:${data.conversationId}`).emit('newMessage', {
          conversationId: data.conversationId,
          content: data.content,
          senderId: socket.userId,
          timestamp: new Date().toISOString(),
        });
        
        // Send notification to receiver if they're in a different room
        const receiverSocketId = userSockets.get(data.receiverId);
        if (receiverSocketId && receiverSocketId !== socket.id) {
          io.to(receiverSocketId).emit('messageNotification', {
            conversationId: data.conversationId,
            senderId: socket.userId,
            content: data.content,
            timestamp: new Date().toISOString(),
          });
        }
        
        console.log(`Message sent in conversation ${data.conversationId} by user ${socket.userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('errorMessage', { error: 'Failed to send message' });
      }
    });
    
    // Handle typing indicators
    socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit('userTyping', {
        conversationId: data.conversationId,
        userId: socket.userId,
        isTyping: data.isTyping,
      });
    });
    
    // Handle read receipts
    socket.on('markAsRead', (data: { conversationId: string; messageId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('messageRead', {
        conversationId: data.conversationId,
        messageId: data.messageId,
        readBy: socket.userId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to Olhar Angolano Chat!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};