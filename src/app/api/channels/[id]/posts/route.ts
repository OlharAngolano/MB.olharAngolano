import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channelId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Check if channel exists
    const channel = await db.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Canal não encontrado" },
        { status: 404 }
      );
    }

    const posts = await db.post.findMany({
      where: { channelId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isAdmin: true,
            isVerified: true,
            verificationType: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      },
      orderBy: [
        { isHighlighted: "desc" },
        { isPinned: "desc" },
        { createdAt: "desc" }
      ],
      skip: offset,
      take: limit
    });

    const total = await db.post.count({
      where: { channelId }
    });

    return NextResponse.json({
      posts,
      channel,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get channel posts error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = request.cookies.get("session")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: sessionId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const channelId = params.id;
    const { content, title, imageUrl, videoUrl } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "O conteúdo do post é obrigatório" },
        { status: 400 }
      );
    }

    // Check if channel exists
    const channel = await db.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Canal não encontrado" },
        { status: 404 }
      );
    }

    const post = await db.post.create({
      data: {
        content: content.trim(),
        title: title?.trim(),
        imageUrl,
        videoUrl,
        channelId,
        authorId: user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isAdmin: true,
            isVerified: true,
            verificationType: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create channel post error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}