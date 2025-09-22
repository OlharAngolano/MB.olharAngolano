import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const posts = await db.post.findMany({
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

    const total = await db.post.count();

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { content, title, imageUrl, videoUrl, channelId } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "O conteúdo do post é obrigatório" },
        { status: 400 }
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

    // Award "Primeiro Post" badge if this is the user's first post
    const userPostsCount = await db.post.count({
      where: { authorId: user.id }
    });

    if (userPostsCount === 1) {
      const firstPostBadge = await db.badge.findUnique({
        where: { name: "Primeiro Post" }
      });

      if (firstPostBadge) {
        await db.userBadge.create({
          data: {
            userId: user.id,
            badgeId: firstPostBadge.id
          }
        });
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}