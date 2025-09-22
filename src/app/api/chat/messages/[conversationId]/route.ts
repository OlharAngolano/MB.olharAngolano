import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = request.cookies.get("session");
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: params.conversationId,
        OR: [
          { user1Id: session.value },
          { user2Id: session.value }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      );
    }

    const messages = await db.directMessage.findMany({
      where: {
        conversationId: params.conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Mark messages as read
    await db.directMessage.updateMany({
      where: {
        conversationId: params.conversationId,
        receiverId: session.value,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { content } = await request.json();
    const session = request.cookies.get("session");
    
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Mensagem não pode estar vazia" },
        { status: 400 }
      );
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: params.conversationId,
        OR: [
          { user1Id: session.value },
          { user2Id: session.value }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      );
    }

    const message = await db.directMessage.create({
      data: {
        content: content.trim(),
        senderId: session.value,
        receiverId: conversation.user1Id === session.value ? conversation.user2Id : conversation.user1Id,
        conversationId: params.conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Update conversation last message
    await db.conversation.update({
      where: { id: params.conversationId },
      data: {
        lastMessage: content.trim(),
        lastMessageAt: new Date()
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}