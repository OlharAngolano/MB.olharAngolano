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
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Check if user already liked the post
    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId
        }
      }
    });

    if (existingLike) {
      // Unlike the post
      await db.like.delete({
        where: {
          userId_postId: {
            userId: user.id,
            postId: postId
          }
        }
      });

      return NextResponse.json({ 
        message: "Like removido",
        liked: false 
      });
    } else {
      // Like the post
      await db.like.create({
        data: {
          userId: user.id,
          postId: postId
        }
      });

      return NextResponse.json({ 
        message: "Post curtido",
        liked: true 
      });
    }
  } catch (error) {
    console.error("Like post error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}