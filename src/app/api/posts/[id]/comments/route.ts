import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    const comments = await db.comment.findMany({
      where: { postId },
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
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
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

    const postId = params.id;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "O conteúdo do comentário é obrigatório" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        userId: user.id,
        postId: postId
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
        }
      }
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}