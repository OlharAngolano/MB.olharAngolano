import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    const postId = params.id;

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId },
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
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Check if user already shared the post
    const existingShare = await db.share.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId
        }
      }
    });

    if (existingShare) {
      return NextResponse.json({ 
        message: "Post já compartilhado",
        shared: true 
      });
    }

    // Create share record
    await db.share.create({
      data: {
        userId: user.id,
        postId: postId
      }
    });

    // Create a new post as a share (repost)
    const sharedPost = await db.post.create({
      data: {
        content: `Compartilhado de @${post.author.name}: ${post.content}`,
        title: post.title ? `Compartilhado: ${post.title}` : null,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
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
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: "Post compartilhado com sucesso",
      shared: true,
      newPost: sharedPost
    });
  } catch (error) {
    console.error("Share post error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}