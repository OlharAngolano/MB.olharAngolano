import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("session");
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { user1Id: session.value },
          { user2Id: session.value }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isVerified: true,
            verificationType: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isVerified: true,
            verificationType: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Format conversations to show the other user
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.user1Id === session.value ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0];
      
      return {
        id: conv.id,
        user: otherUser,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender.name,
          createdAt: lastMessage.createdAt,
          isRead: lastMessage.isRead
        } : null,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: lastMessage && !lastMessage.isRead && lastMessage.senderId !== session.value ? 1 : 0
      };
    });

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const session = request.cookies.get("session");
    
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    if (userId === session.value) {
      return NextResponse.json(
        { error: "Não pode iniciar conversa consigo mesmo" },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversation = await db.conversation.findFirst({
      where: {
        OR: [
          { user1Id: session.value, user2Id: userId },
          { user1Id: userId, user2Id: session.value }
        ]
      }
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        user1Id: session.value,
        user2Id: userId
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isVerified: true,
            verificationType: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isVerified: true,
            verificationType: true
          }
        }
      }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}